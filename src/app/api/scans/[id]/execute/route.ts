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
  if (!primary) return unique;
  return [primary, ...unique.filter((cookie) => cookie !== primary)];
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
    await updateScan(scanId, { status: 'running' });

    const filters: FilterCriteria = scan.filters || {};
    const allowMockData = process.env.ALLOW_MOCK_DATA === 'true';
    const configuredCookies = parseSessionCookies();

    // ===== PHASE 1: Discover usernames =====
    const hashtags = filters.search_hashtags || [];
    const keywords = filters.search_keywords || [];
    const maxAccounts = filters.max_accounts || 25;

    const discoveryCookieCandidates = [...configuredCookies];
    if (discoveryCookieCandidates.length === 0) {
      discoveryCookieCandidates.push('');
    }

    let usernames: string[] = [];
    let usedMockDiscovery = false;
    let discoveryCookieUsed = '';

    for (const cookie of discoveryCookieCandidates) {
      const discovery = await discoverUsernames({
        hashtags,
        searchKeywords: keywords,
        maxAccounts,
        sessionCookie: cookie || undefined,
      });
      usernames = discovery.usernames;
      usedMockDiscovery = discovery.isMock;
      discoveryCookieUsed = cookie;

      if (!discovery.isMock || allowMockData) {
        break;
      }
    }

    if (usedMockDiscovery && !allowMockData) {
      await updateScan(scanId, {
        status: 'failed',
        finished_at: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error:
            'Live Instagram discovery failed and mock data is disabled. Set ALLOW_MOCK_DATA=true to allow fallback.',
        },
        { status: 503 }
      );
    }

    if (usernames.length === 0) {
      await updateScan(scanId, {
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
    await createScanItems(items);

    await updateScan(scanId, { total_input: usernames.length });

    // ===== PHASE 2: Scrape each profile and apply filters =====
    const scanItems = await getScanItems(scanId);
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
        await updateScanItem(item.id, { status: 'processing' });

        const scrapeCookieCandidates = prioritizeCookie(discoveryCookieUsed, configuredCookies);
        if (scrapeCookieCandidates.length === 0) {
          scrapeCookieCandidates.push('');
        }

        let profile = null;
        let scrapeError: string | null = null;
        let isMock = false;

        for (const cookie of scrapeCookieCandidates) {
          const attempt = await scrapeProfile(item.username, {
            sessionCookie: cookie || undefined,
            postsToAnalyze: filters.last_x_posts_to_analyze || 12,
          });

          if (attempt.profile && !attempt.isMock) {
            profile = attempt.profile;
            scrapeError = null;
            isMock = false;
            break;
          }

          profile = attempt.profile;
          scrapeError = attempt.error;
          isMock = attempt.isMock;
        }

        if (scrapeError || !profile || (isMock && !allowMockData)) {
          await updateScanItem(item.id, {
            status: 'error',
            error_message:
              scrapeError ||
              (isMock && !allowMockData
                ? 'Live profile scrape failed and mock data is disabled'
                : 'Failed to scrape profile'),
          });
          errors++;
        } else {
          const { matched: isMatched, reasons } = evaluateFilters(profile, filters);
          const score = computeScore(profile, filters);

          await updateScanItem(item.id, {
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
        await updateScan(scanId, {
          total_scanned: scanned,
          total_matched: matched,
          total_errors: errors,
        });
      } catch (err) {
        console.error(`Error processing ${item.username}:`, err);
        await updateScanItem(item.id, {
          status: 'error',
          error_message: err instanceof Error ? err.message : 'Unknown error',
        });
        errors++;
        scanned++;
        await updateScan(scanId, {
          total_scanned: scanned,
          total_matched: matched,
          total_errors: errors,
        });
      }
    }

    // Done
    await updateScan(scanId, {
      status: 'completed',
      total_scanned: scanned,
      total_matched: matched,
      total_errors: errors,
      finished_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: 'completed', scanned, matched, errors });
  } catch (error: unknown) {
    await updateScan(scanId, {
      status: 'failed',
      finished_at: new Date().toISOString(),
    });
    const message = error instanceof Error ? error.message : 'Scan execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
