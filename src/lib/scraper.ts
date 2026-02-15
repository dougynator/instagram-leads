import { ScrapedProfile, RecentPost } from './types';

// ==================== Instagram Scraper ====================
// Uses Instagram's public web API (?__a=1&__d=dis) or page scraping
// Falls back to mock data if Instagram blocks or no session cookie

const INSTAGRAM_BASE = 'https://www.instagram.com';

function getRandomDelay(min: number = 2000, max: number = 5000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Extract email from text
function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

// Extract phone from text
function extractPhone(text: string): string | null {
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  const matches = text.match(phoneRegex);
  if (matches) {
    const cleaned = matches[0].replace(/\s/g, '');
    if (cleaned.length >= 7 && cleaned.length <= 15) return cleaned;
  }
  return null;
}

// Detect WhatsApp indicator
function detectWhatsapp(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('whatsapp') ||
    lower.includes('wa.me') ||
    lower.includes('wa link') ||
    lower.includes('📱') ||
    /whats\s*app/i.test(text)
  );
}

// Extract website from bio text
function extractWebsite(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s,)]+/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
}

// Build contact info from bio and external link
function extractContactInfo(bio: string, externalLink?: string) {
  const combinedText = `${bio} ${externalLink || ''}`;
  return {
    detected_email: extractEmail(combinedText),
    detected_phone: extractPhone(bio),
    detected_whatsapp: detectWhatsapp(bio),
    detected_website: externalLink || extractWebsite(bio) || null,
  };
}

// Compute engagement metrics from recent posts
function computeMetrics(
  posts: RecentPost[],
  followerCount: number
): { avg_likes: number; avg_comments: number; engagement_rate: number } {
  if (!posts.length || !followerCount) {
    return { avg_likes: 0, avg_comments: 0, engagement_rate: 0 };
  }
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0);
  const avg_likes = Math.round(totalLikes / posts.length);
  const avg_comments = Math.round(totalComments / posts.length);
  const engagement_rate = parseFloat(
    (((avg_likes + avg_comments) / followerCount) * 100).toFixed(2)
  );
  return { avg_likes, avg_comments, engagement_rate };
}

// ==================== Live Scraping ====================

interface ScrapeOptions {
  sessionCookie?: string;
  postsToAnalyze?: number;
}

async function scrapeFromInstagramAPI(
  username: string,
  options: ScrapeOptions
): Promise<ScrapedProfile | null> {
  try {
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'X-IG-App-ID': '936619743392459',
    };

    if (options.sessionCookie) {
      headers['Cookie'] = `sessionid=${options.sessionCookie}`;
    }

    // Try the web profile info endpoint
    const apiUrl = `${INSTAGRAM_BASE}/api/v1/users/web_profile_info/?username=${username}`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(15000) });

    if (!response.ok) {
      console.log(`Instagram API returned ${response.status} for ${username}`);
      return null;
    }

    const data = await response.json();
    const user = data?.data?.user;

    if (!user) return null;

    const postEdges = user.edge_owner_to_timeline_media?.edges || [];
    const postsToGet = options.postsToAnalyze || 12;
    const recentPosts: RecentPost[] = postEdges.slice(0, postsToGet).map((edge: any) => ({
      shortcode: edge.node?.shortcode,
      likes: edge.node?.edge_liked_by?.count || edge.node?.edge_media_preview_like?.count || 0,
      comments: edge.node?.edge_media_to_comment?.count || 0,
      timestamp: edge.node?.taken_at_timestamp
        ? new Date(edge.node.taken_at_timestamp * 1000).toISOString()
        : undefined,
      caption: edge.node?.edge_media_to_caption?.edges?.[0]?.node?.text || '',
      url: edge.node?.shortcode
        ? `${INSTAGRAM_BASE}/p/${edge.node.shortcode}/`
        : undefined,
    }));

    const followerCount =
      user.edge_followed_by?.count || 0;
    const bio = user.biography || '';
    const externalLink =
      user.external_url || user.bio_links?.[0]?.url || '';

    const contact = extractContactInfo(bio, externalLink);
    const metrics = computeMetrics(recentPosts, followerCount);

    const lastPostDate = recentPosts.length > 0 ? recentPosts[0].timestamp || null : null;

    const profile: ScrapedProfile = {
      username: user.username,
      display_name: user.full_name || '',
      bio,
      external_link: externalLink || undefined,
      follower_count: followerCount,
      following_count: user.edge_follow?.count || 0,
      post_count: user.edge_owner_to_timeline_media?.count || 0,
      recent_posts: recentPosts,
      ...metrics,
      ...contact,
      last_post_date: lastPostDate,
      is_private: user.is_private || false,
      profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || '',
      scraped_at: new Date().toISOString(),
    };

    return profile;
  } catch (err) {
    console.error(`Error scraping ${username}:`, err);
    return null;
  }
}

// ==================== Mock Scraping (Fallback) ====================

function generateMockProfile(username: string): ScrapedProfile {
  const seed = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min: number, max: number) =>
    Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * (max - min) + min);

  const followers = rand(500, 500000);
  const following = rand(100, 5000);
  const postCount = rand(20, 2000);

  const bios = [
    `${username} | Digital creator 🎨 | Based in NYC 📍 | Contact: ${username}@email.com`,
    `Photographer & content creator ✨ | DM for collabs | ${username}@gmail.com | wa.me/1234567890`,
    `Lifestyle blogger 🌿 | Link below 👇 | hello@${username}.com`,
    `🎯 Marketing expert | Helping brands grow | Book a call 📞 +1-555-${rand(100, 999)}-${rand(1000, 9999)}`,
    `Creator | Artist | Dreamer | No contact info here, just vibes`,
    `${username} official | LA 🌴 | Business: work@${username}.io | WhatsApp available`,
  ];

  const bio = bios[seed % bios.length];
  const externalLink = seed % 3 === 0 ? `https://${username}.com` : seed % 3 === 1 ? `https://linktr.ee/${username}` : '';

  const recentPosts: RecentPost[] = Array.from({ length: 12 }, (_, i) => {
    const postSeed = seed + i * 17;
    const likes = Math.floor(((postSeed * 7919 + 104729) % 233280) / 233280 * followers * 0.08);
    const comments = Math.floor(likes * 0.03 + ((postSeed * 3571) % 50));
    const daysAgo = i * rand(1, 5) + i;
    return {
      shortcode: `mock_${username}_${i}`,
      likes,
      comments,
      timestamp: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      caption: `Post ${i + 1} by ${username}`,
      url: `${INSTAGRAM_BASE}/p/mock_${username}_${i}/`,
    };
  });

  const contact = extractContactInfo(bio, externalLink);
  const metrics = computeMetrics(recentPosts, followers);

  return {
    username,
    display_name: username.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    bio,
    external_link: externalLink || undefined,
    follower_count: followers,
    following_count: following,
    post_count: postCount,
    recent_posts: recentPosts,
    ...metrics,
    ...contact,
    last_post_date: recentPosts[0]?.timestamp || null,
    is_private: seed % 10 === 0,
    profile_pic_url: '',
    scraped_at: new Date().toISOString(),
  };
}

// ==================== Main Scrape Function ====================

export async function scrapeProfile(
  username: string,
  options: ScrapeOptions = {}
): Promise<{ profile: ScrapedProfile | null; error: string | null; isMock: boolean }> {
  // Clean username
  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

  if (!cleanUsername) {
    return { profile: null, error: 'Empty username', isMock: false };
  }

  // Random delay for politeness
  await sleep(getRandomDelay(1500, 4000));

  // Try live scraping first
  try {
    const profile = await scrapeFromInstagramAPI(cleanUsername, options);
    if (profile) {
      return { profile, error: null, isMock: false };
    }
  } catch (err) {
    console.log(`Live scraping failed for ${cleanUsername}, falling back to mock`);
  }

  // Fallback to mock data
  console.log(`Using mock data for ${cleanUsername}`);
  const mockProfile = generateMockProfile(cleanUsername);
  return { profile: mockProfile, error: null, isMock: true };
}

export { extractContactInfo, computeMetrics };
