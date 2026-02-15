import Papa from 'papaparse';
import { ScanItem, ScrapedProfile, ALL_EXPORT_COLUMNS } from './types';

// ==================== CSV Parsing ====================

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export function parseCSVContent(content: string): ParsedCSV {
  const result = Papa.parse(content, {
    skipEmptyLines: true,
  });

  const data = result.data as string[][];
  if (data.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  // First row as headers
  const headers = data[0].map((h) => h.trim());
  const rows = data.slice(1);

  return { headers, rows, rowCount: rows.length };
}

export function extractUsernames(
  rows: string[][],
  columnIndex: number
): string[] {
  return rows
    .map((row) => {
      const val = row[columnIndex]?.trim() || '';
      // Remove @ prefix if present
      return val.replace(/^@/, '').toLowerCase();
    })
    .filter((u) => u.length > 0);
}

// ==================== CSV Export ====================

export function exportScanItemsToCSV(
  items: ScanItem[],
  columns: string[]
): string {
  const validColumns = columns.filter((c) => ALL_EXPORT_COLUMNS.includes(c));

  const rows = items.map((item) => {
    const row: Record<string, string> = {};
    const data: ScrapedProfile = item.scraped_data || {};

    for (const col of validColumns) {
      switch (col) {
        case 'username':
          row[col] = item.username;
          break;
        case 'profile_url':
          row[col] = item.profile_url || `https://instagram.com/${item.username}`;
          break;
        case 'display_name':
          row[col] = data.display_name || '';
          break;
        case 'follower_count':
          row[col] = String(data.follower_count ?? '');
          break;
        case 'following_count':
          row[col] = String(data.following_count ?? '');
          break;
        case 'post_count':
          row[col] = String(data.post_count ?? '');
          break;
        case 'engagement_rate':
          row[col] = String(data.engagement_rate ?? '');
          break;
        case 'avg_likes':
          row[col] = String(data.avg_likes ?? '');
          break;
        case 'avg_comments':
          row[col] = String(data.avg_comments ?? '');
          break;
        case 'bio':
          row[col] = (data.bio || '').replace(/\n/g, ' ');
          break;
        case 'external_link':
          row[col] = data.external_link || '';
          break;
        case 'detected_email':
          row[col] = data.detected_email || '';
          break;
        case 'detected_phone':
          row[col] = data.detected_phone || '';
          break;
        case 'detected_whatsapp':
          row[col] = data.detected_whatsapp ? 'Yes' : 'No';
          break;
        case 'detected_website':
          row[col] = data.detected_website || '';
          break;
        case 'last_post_date':
          row[col] = data.last_post_date || '';
          break;
        case 'is_private':
          row[col] = data.is_private ? 'Yes' : 'No';
          break;
        case 'score':
          row[col] = String(item.score);
          break;
        case 'matched':
          row[col] = item.matched ? 'Yes' : 'No';
          break;
        case 'match_reasons':
          row[col] = (item.match_reasons || [])
            .map((r) => `${r.passed ? '✓' : '✗'} ${r.detail}`)
            .join(' | ');
          break;
        case 'tags':
          row[col] = (item.tags || []).join(', ');
          break;
        case 'notes':
          row[col] = item.notes || '';
          break;
        case 'error_message':
          row[col] = item.error_message || '';
          break;
        case 'status':
          row[col] = item.status;
          break;
        default:
          row[col] = '';
      }
    }

    return row;
  });

  return Papa.unparse(rows, { columns: validColumns });
}
