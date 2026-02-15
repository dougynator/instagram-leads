// ==================== Database Types ====================

export interface Client {
  id: string;
  name: string;
  notes: string;
  default_filters: FilterCriteria;
  created_at: string;
}

export interface Scan {
  id: string;
  client_id: string | null;
  name: string;
  filters: FilterCriteria;
  total_input: number;
  total_scanned: number;
  total_matched: number;
  total_errors: number;
  started_at: string;
  finished_at: string | null;
  status: ScanStatus;
  created_at: string;
  // Joined
  client?: Client;
}

export type ScanStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';

export interface ScanItem {
  id: string;
  scan_id: string;
  username: string;
  profile_url: string;
  scraped_data: ScrapedProfile;
  score: number;
  matched: boolean;
  match_reasons: MatchReason[];
  tags: string[];
  notes: string;
  status: ScanItemStatus;
  error_message: string | null;
  created_at: string;
}

export type ScanItemStatus = 'pending' | 'processing' | 'completed' | 'error' | 'skipped';

// ==================== Filter Criteria ====================

export interface FilterCriteria {
  min_followers?: number | null;
  max_followers?: number | null;
  min_engagement_rate?: number | null;
  max_engagement_rate?: number | null;
  avg_likes_last_x?: number | null;
  avg_comments_last_x?: number | null;
  last_x_posts_to_analyze?: number;
  last_post_within_days?: number | null;
  bio_keywords_include?: string[];
  bio_keywords_exclude?: string[];
  location_keywords?: string[];
  contact_info_required?: boolean;
  contact_info_types?: {
    email?: boolean;
    website?: boolean;
    phone?: boolean;
  };
  scoring_enabled?: boolean;
  scoring_weights?: ScoringWeights;
}

export interface ScoringWeights {
  followers?: number;
  engagement?: number;
  contact_info?: number;
  freshness?: number;
  keyword_match?: number;
}

export const DEFAULT_FILTERS: FilterCriteria = {
  min_followers: null,
  max_followers: null,
  min_engagement_rate: null,
  max_engagement_rate: null,
  avg_likes_last_x: null,
  avg_comments_last_x: null,
  last_x_posts_to_analyze: 12,
  last_post_within_days: null,
  bio_keywords_include: [],
  bio_keywords_exclude: [],
  location_keywords: [],
  contact_info_required: false,
  contact_info_types: { email: true, website: true, phone: true },
  scoring_enabled: true,
  scoring_weights: {
    followers: 20,
    engagement: 30,
    contact_info: 20,
    freshness: 15,
    keyword_match: 15,
  },
};

// ==================== Scraped Data ====================

export interface ScrapedProfile {
  username?: string;
  display_name?: string;
  bio?: string;
  external_link?: string;
  follower_count?: number;
  following_count?: number;
  post_count?: number;
  recent_posts?: RecentPost[];
  avg_likes?: number;
  avg_comments?: number;
  engagement_rate?: number;
  detected_email?: string | null;
  detected_phone?: string | null;
  detected_whatsapp?: boolean;
  detected_website?: string | null;
  last_post_date?: string | null;
  is_private?: boolean;
  profile_pic_url?: string;
  scraped_at?: string;
}

export interface RecentPost {
  shortcode?: string;
  likes?: number;
  comments?: number;
  timestamp?: string;
  caption?: string;
  url?: string;
}

// ==================== Match Reasons ====================

export interface MatchReason {
  criterion: string;
  passed: boolean;
  detail: string;
}

// ==================== Export ====================

export const DEFAULT_EXPORT_COLUMNS = [
  'username',
  'profile_url',
  'follower_count',
  'engagement_rate',
  'avg_likes',
  'avg_comments',
  'bio',
  'detected_email',
  'detected_phone',
  'detected_website',
  'score',
  'matched',
  'tags',
  'notes',
];

export const ALL_EXPORT_COLUMNS = [
  'username',
  'profile_url',
  'display_name',
  'follower_count',
  'following_count',
  'post_count',
  'engagement_rate',
  'avg_likes',
  'avg_comments',
  'bio',
  'external_link',
  'detected_email',
  'detected_phone',
  'detected_whatsapp',
  'detected_website',
  'last_post_date',
  'is_private',
  'score',
  'matched',
  'match_reasons',
  'tags',
  'notes',
  'error_message',
  'status',
];

// ==================== Dashboard Stats ====================

export interface DashboardStats {
  total_clients: number;
  total_scans: number;
  last_scan_date: string | null;
  total_leads_matched: number;
}
