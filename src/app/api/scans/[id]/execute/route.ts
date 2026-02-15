import { NextRequest, NextResponse } from 'next/server';
import { getScan, getScanItems, updateScan, updateScanItem } from '@/lib/db';
import { scrapeProfile } from '@/lib/scraper';
import { evaluateFilters, computeScore } from '@/lib/scoring';
import { FilterCriteria } from '@/lib/types';

// Track running scans to enable cancellation
const runningScanIds = new Set<string>();

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
    runningScanIds.add(scanId);

    // Get pending items
    const items = await getScanItems(scanId);
    const pendingItems = items.filter((i) => i.status === 'pending');

    const filters: FilterCriteria = scan.filters || {};
    const sessionCookie = process.env.INSTAGRAM_SESSION_COOKIE || '';

    let scanned = scan.total_scanned || 0;
    let matched = scan.total_matched || 0;
    let errors = scan.total_errors || 0;

    // Process items sequentially
    for (const item of pendingItems) {
      // Check for cancellation
      if (!runningScanIds.has(scanId)) {
        await updateScan(scanId, {
          status: 'cancelled',
          total_scanned: scanned,
          total_matched: matched,
          total_errors: errors,
          finished_at: new Date().toISOString(),
        });
        return NextResponse.json({ status: 'cancelled', scanned, matched, errors });
      }

      // Re-check scan status from DB for external cancellation
      const currentScan = await getScan(scanId);
      if (currentScan?.status === 'cancelled') {
        runningScanIds.delete(scanId);
        return NextResponse.json({ status: 'cancelled', scanned, matched, errors });
      }

      try {
        // Mark item as processing
        await updateScanItem(item.id, { status: 'processing' });

        // Scrape profile
        const { profile, error: scrapeError } = await scrapeProfile(
          item.username,
          {
            sessionCookie,
            postsToAnalyze: filters.last_x_posts_to_analyze || 12,
          }
        );

        if (scrapeError || !profile) {
          await updateScanItem(item.id, {
            status: 'error',
            error_message: scrapeError || 'Failed to scrape profile',
          });
          errors++;
        } else {
          // Evaluate filters
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

        // Update scan progress periodically
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

    // Mark scan as completed
    runningScanIds.delete(scanId);
    await updateScan(scanId, {
      status: 'completed',
      total_scanned: scanned,
      total_matched: matched,
      total_errors: errors,
      finished_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: 'completed', scanned, matched, errors });
  } catch (error: unknown) {
    runningScanIds.delete(scanId);
    await updateScan(scanId, {
      status: 'failed',
      finished_at: new Date().toISOString(),
    });
    const message = error instanceof Error ? error.message : 'Scan execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Export for use by cancel route
export { runningScanIds };
