import { NextRequest, NextResponse } from 'next/server';
import { getScan, updateScan, createScanItems, getScanItems, updateScanItem } from '@/lib/db';
import { discoverUsernames, scrapeProfile } from '@/lib/scraper';
import { evaluateFilters, computeScore } from '@/lib/scoring';
import { FilterCriteria } from '@/lib/types';

function parseSessionCookies(): string[] {
  const raw = process.env.INSTAGRAM_SESSION_COOKIES || process.env.INSTAGRAM_SESSION_COOKIE || '';
  const normalized = raw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      let v = value.replace(/^['"]|['"]$/g, '');
      if (v.toLowerCase().startsWith('sessionid=')) {
        v = v.slice('sessionid='.length);
      }
      if (v.includes(';')) {
        v = v.split(';')[0].trim();
      }
      return v.trim();
    })
    .filter(Boolean);

  return [...new Set(normalized)];
}

function prioritizeCookie(primary: string, allCookies: string[]): string[] {
  const unique = [...new Set(allCookies.filter(Boolean))];
  const ordered = !primary ? unique : [primary, ...unique.filter((cookie) => cookie !== primary)];
  // Always try a no-cookie request as last fallback, so a stale cookie cannot block discovery.
  return [...ordered, ''];
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return 'Scan execution failed';
}

async function safeUpdateScan(scanId: string, payload: Partial<{ status: string; total_input: number; total_scanned: number; total_matched: number; total_errors: number; finished_at: string }>) {
  try {
    await updateScan(scanId, payload);
  } catch (error) {
    console.warn('updateScan failed (non-fatal):', toErrorMessage(error));
  }
}

async function safeUpdateScanItem(itemId: string, payload: Partial<{ status: string; error_message: string; scraped_data: unknown; score: number; matched: boolean; match_reasons: unknown; profile_url: string }>) {
  try {
    await updateScanItem(itemId, payload);
  } catch (error) {
    console.warn('updateScanItem failed (non-fatal):', toErrorMessage(error));
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scanId } = await params;

  try {
    const scan = await getScan(scanId);
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    if (scan.status === 'running') {
      return NextResponse.json({ error: 'Scan is already running' }, { status: 409 });
    }

    // Mark as running
    await safeUpdateScan(scanId, { status: 'running' });

    const filters: FilterCriteria = scan.filters || {};
    const allowMockData = process.env.ALLOW_MOCK_DATA === 'true';
    const configuredCookies = parseSessionCookies();

    // ===== PHASE 1: Discover usernames =====
    const hashtags = filters.search_hashtags || [];
    const keywords = filters.search_keywords || [];
    const maxAccounts = filters.max_accounts || 25;

    const discoveryCookieCandidates = prioritizeCookie('', configuredCookies);

    let usernames: string[] = [];
    let discoveryCookieUsed = '';

    for (const cookie of discoveryCookieCandidates) {
      const discovery = await discoverUsernames({
        hashtags,
        searchKeywords: keywords,
        maxAccounts,
        sessionCookie: cookie || undefined,
      });
      usernames = discovery.usernames;
      discoveryCookieUsed = cookie;

      if (!discovery.isMock || allowMockData) {
        break;
      }
    }

    if (usernames.length === 0) {
      await safeUpdateScan(scanId, {
        status: 'completed',
        total_input: 0,
        total_scanned: 0,
        finished_at: new Date().toISOString(),
      });
      return NextResponse.json({ status: 'completed', scanned: 0, matched: 0, errors: 0 });
    }

    // Create scan items for discovered usernames
    const items = usernames.map((username) => ({
      scan_id: scanId,
      username,
      profile_url: `https://instagram.com/${username}`,
    }));
    let persistedItems = [];
    try {
      persistedItems = await createScanItems(items);
    } catch {
      // Fallback: try per-item inserts so one bad row won't fail the whole scan.
      const recovered = [];
      for (const row of items) {
        try {
          const inserted = await createScanItems([row]);
          recovered.push(...inserted);
        } catch {
          // Skip row-level insert errors.
        }
      }
      persistedItems = recovered;
    }

    await safeUpdateScan(scanId, { total_input: usernames.length });

    // ===== PHASE 2: Scrape each profile and apply filters =====
    const scanItems = persistedItems.length > 0 ? persistedItems : await getScanItems(scanId);
    let scanned = 0;
    let matched = 0;
    let errors = 0;

    for (const item of scanItems) {
      // Check for cancellation
      const currentScan = await getScan(scanId);
      if (currentScan?.status === 'cancelled') {
        return NextResponse.json({ status: 'cancelled', scanned, matched, errors });
      }

      try {
        await safeUpdateScanItem(item.id, { status: 'processing' });

        const scrapeCookieCandidates = prioritizeCookie(discoveryCookieUsed, configuredCookies);

        let profile = null;
        let scrapeError: string | null = null;

        for (const cookie of scrapeCookieCandidates) {
          const attempt = await scrapeProfile(item.username, {
            sessionCookie: cookie || undefined,
            postsToAnalyze: filters.last_x_posts_to_analyze || 12,
          });

          if (attempt.profile && !attempt.isMock) {
            profile = attempt.profile;
            scrapeError = null;
            break;
          }

          profile = attempt.profile;
          scrapeError = attempt.error;
        }

        if (scrapeError || !profile) {
          await safeUpdateScanItem(item.id, {
            status: 'error',
            error_message:
              scrapeError || 'Failed to scrape profile',
          });
          errors++;
        } else {
          const { matched: isMatched, reasons } = evaluateFilters(profile, filters);
          const score = computeScore(profile, filters);

          await safeUpdateScanItem(item.id, {
            scraped_data: profile,
            score,
            matched: isMatched,
            match_reasons: reasons,
            status: 'completed',
            profile_url: `https://instagram.com/${item.username}`,
          });

          if (isMatched) matched++;
        }

        scanned++;
        await safeUpdateScan(scanId, {
          total_scanned: scanned,
          total_matched: matched,
          total_errors: errors,
        });
      } catch (err) {
        console.error(`Error processing ${item.username}:`, err);
        await safeUpdateScanItem(item.id, {
          status: 'error',
          error_message: err instanceof Error ? err.message : 'Unknown error',
        });
        errors++;
        scanned++;
        await safeUpdateScan(scanId, {
          total_scanned: scanned,
          total_matched: matched,
          total_errors: errors,
        });
      }
    }

    // Done
    await safeUpdateScan(scanId, {
      status: 'completed',
      total_scanned: scanned,
      total_matched: matched,
      total_errors: errors,
      finished_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: 'completed', scanned, matched, errors });
  } catch (error: unknown) {
    await safeUpdateScan(scanId, {
      status: 'failed',
      finished_at: new Date().toISOString(),
    });
    const message = toErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
