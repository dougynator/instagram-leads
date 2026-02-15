import { ScrapedProfile, RecentPost } from './types';

const INSTAGRAM_BASE = 'https://www.instagram.com';

function getRandomDelay(min: number = 2000, max: number = 5000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

function extractPhone(text: string): string | null {
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  const matches = text.match(phoneRegex);
  if (matches) {
    const cleaned = matches[0].replace(/\s/g, '');
    if (cleaned.length >= 7 && cleaned.length <= 15) return cleaned;
  }
  return null;
}

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

function extractWebsite(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s,)]+/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
}

function extractContactInfo(bio: string, externalLink?: string) {
  const combinedText = `${bio} ${externalLink || ''}`;
  return {
    detected_email: extractEmail(combinedText),
    detected_phone: extractPhone(bio),
    detected_whatsapp: detectWhatsapp(bio),
    detected_website: externalLink || extractWebsite(bio) || null,
  };
}

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

// ==================== Instagram API Headers ====================

function getHeaders(sessionCookie?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-IG-App-ID': '936619743392459',
  };
  if (sessionCookie) {
    headers['Cookie'] = `sessionid=${sessionCookie}`;
  }
  return headers;
}

// ==================== Discovery: Find Usernames ====================

export interface DiscoveryOptions {
  hashtags: string[];
  searchKeywords: string[];
  maxAccounts: number;
  sessionCookie?: string;
}

// Search Instagram hashtag page and extract unique usernames from recent posts
async function discoverFromHashtag(
  hashtag: string,
  headers: Record<string, string>
): Promise<string[]> {
  try {
    const tag = hashtag.replace(/^#/, '').trim().toLowerCase();
    if (!tag) return [];

    const url = `${INSTAGRAM_BASE}/api/v1/tags/web_info/?tag_name=${encodeURIComponent(tag)}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    const edges =
      data?.data?.recent?.sections?.flatMap(
        (s: any) => s?.layout_content?.medias?.map((m: any) => m?.media?.user?.username) || []
      ) ||
      data?.data?.hashtag?.edge_hashtag_to_media?.edges?.map(
        (e: any) => e?.node?.owner?.username
      ) ||
      [];

    return edges.filter(Boolean) as string[];
  } catch (err) {
    console.log(`Hashtag discovery failed for #${hashtag}:`, err);
    return [];
  }
}

// Search Instagram for user accounts matching a keyword
async function discoverFromSearch(
  keyword: string,
  headers: Record<string, string>
): Promise<string[]> {
  try {
    const url = `${INSTAGRAM_BASE}/web/search/topsearch/?context=user&query=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    const users = data?.users || [];
    return users.map((u: any) => u?.user?.username).filter(Boolean) as string[];
  } catch (err) {
    console.log(`Search discovery failed for "${keyword}":`, err);
    return [];
  }
}

// Mock discovery: generate realistic fake usernames for a given niche
function mockDiscoverUsernames(
  hashtags: string[],
  keywords: string[],
  maxAccounts: number
): string[] {
  const niches: Record<string, string[]> = {
    fitness: ['fitlife_coach', 'gymrat_daily', 'strongbody_pt', 'yoga.with.sarah', 'musclemind_fit', 'healthhustle_', 'liftlife.pro', 'flexzone_studio', 'pilates.queen', 'runnersworld_nl', 'crossfit.beast', 'fitfoodie.nl', 'bodytransform_', 'trainhard_ams', 'wellness.warrior'],
    food: ['chef.marco_', 'foodie.amsterdam', 'bakedbylisa_', 'tastynl_', 'veganvibes.nl', 'pasta.lovers_', 'brunchspot_020', 'streetfood.scout', 'coffeecorner.nl', 'healthybites_', 'sushimaster.ams', 'wineanddine_nl', 'mealprep.pro_', 'glutenfree.nl', 'organickitchen_'],
    fashion: ['style.by.emma', 'fashionista_nl', 'ootd.daily_', 'vintage.finds_', 'streetstyle.ams', 'luxelabel_', 'thriftqueen_nl', 'menswear.daily', 'sustainable.style_', 'shoelover_020', 'designerbags_nl', 'minimalist.wear', 'curvy.fashion_', 'denim.diaries_', 'accessorize.me_'],
    photography: ['lens.stories_', 'shutterclick.nl', 'golden.hour.pics', 'urban.frames_', 'portrait.pro_nl', 'travel.lens_', 'wedding.shots_', 'street.capture_', 'nature.focus_nl', 'drone.views_', 'film.analog_', 'lightroom.edit_', 'nightphoto_nl', 'macro.world_', 'bw.photography_'],
    beauty: ['glow.studio_nl', 'makeup.by.anna', 'skincare.daily_', 'nailart.queen_', 'hairgoals_ams', 'beauty.insider_', 'lashes.by.kim', 'organic.beauty_nl', 'browbar.ams', 'lipstick.lover_', 'derma.glow_', 'hairstylist.nl', 'beautybox_020', 'cleanbeauty_nl', 'makeupclass_'],
    travel: ['wanderlust.nl_', 'explore.europe_', 'backpack.tales_', 'luxury.travel_nl', 'roadtrip.diaries', 'island.hopper_', 'cityscapes_nl', 'nomad.life_', 'hidden.gems_020', 'sunset.chaser_', 'hostel.stories_', 'solotravel_nl', 'adventure.seek_', 'beach.bum_nl', 'alps.explorer_'],
    business: ['startup.grind_nl', 'entrepreneur.daily', 'hustle.hard_020', 'bizcoach_nl', 'marketing.pro_', 'ecommerce.tips_', 'freelance.life_nl', 'ceo.mindset_', 'growth.hacker_', 'sales.master_nl', 'branding.studio_', 'digital.nomad_nl', 'investor.nl_', 'sideproject_020', 'leadgen.pro_'],
    default: ['creator.studio_', 'daily.inspo_nl', 'content.king_', 'brand.builder_', 'social.growth_', 'viral.media_nl', 'influence.hub_', 'trending.now_nl', 'discover.new_', 'fresh.content_', 'niche.expert_', 'local.hero_020', 'community.nl_', 'creative.mind_', 'next.level_nl'],
  };

  const allTerms = [...hashtags, ...keywords].map((t) => t.toLowerCase().replace(/^#/, ''));
  let pool: string[] = [];

  for (const term of allTerms) {
    for (const [niche, names] of Object.entries(niches)) {
      if (term.includes(niche) || niche.includes(term)) {
        pool.push(...names);
      }
    }
  }

  // Always add some defaults if pool is small
  if (pool.length < maxAccounts) {
    pool.push(...niches.default);
    // Also generate some based on the search terms
    for (const term of allTerms) {
      const clean = term.replace(/[^a-z0-9]/g, '');
      if (clean) {
        pool.push(
          `${clean}.official_`,
          `the.${clean}_`,
          `${clean}.daily_`,
          `${clean}_hub`,
          `${clean}.pro_nl`,
          `best.${clean}_`,
          `${clean}.studio_`,
          `${clean}.expert_`,
        );
      }
    }
  }

  // Deduplicate and limit
  const unique = [...new Set(pool)];
  // Shuffle
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique.slice(0, maxAccounts);
}

// Main discovery function: finds usernames from Instagram based on search terms
export async function discoverUsernames(options: DiscoveryOptions): Promise<{
  usernames: string[];
  isMock: boolean;
}> {
  const { hashtags, searchKeywords, maxAccounts, sessionCookie } = options;
  const headers = getHeaders(sessionCookie);

  const allUsernames = new Set<string>();
  let liveFailed = false;

  // Try live discovery from hashtags
  for (const tag of hashtags) {
    if (allUsernames.size >= maxAccounts) break;
    await sleep(getRandomDelay(1000, 2500));
    try {
      const found = await discoverFromHashtag(tag, headers);
      if (found.length === 0) liveFailed = true;
      found.forEach((u) => allUsernames.add(u));
    } catch {
      liveFailed = true;
    }
  }

  // Try live discovery from keyword search
  for (const kw of searchKeywords) {
    if (allUsernames.size >= maxAccounts) break;
    await sleep(getRandomDelay(1000, 2500));
    try {
      const found = await discoverFromSearch(kw, headers);
      if (found.length === 0) liveFailed = true;
      found.forEach((u) => allUsernames.add(u));
    } catch {
      liveFailed = true;
    }
  }

  // If live discovery didn't find enough, use mock data
  if (allUsernames.size < maxAccounts && (liveFailed || allUsernames.size === 0)) {
    console.log('Using mock discovery for remaining accounts');
    const mockNames = mockDiscoverUsernames(hashtags, searchKeywords, maxAccounts - allUsernames.size);
    mockNames.forEach((u) => allUsernames.add(u));
    return {
      usernames: [...allUsernames].slice(0, maxAccounts),
      isMock: true,
    };
  }

  return {
    usernames: [...allUsernames].slice(0, maxAccounts),
    isMock: false,
  };
}

// ==================== Profile Scraping ====================

interface ScrapeOptions {
  sessionCookie?: string;
  postsToAnalyze?: number;
}

async function scrapeFromInstagramAPI(
  username: string,
  options: ScrapeOptions
): Promise<ScrapedProfile | null> {
  try {
    const headers = getHeaders(options.sessionCookie);
    const apiUrl = `${INSTAGRAM_BASE}/api/v1/users/web_profile_info/?username=${username}`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(15000) });

    if (!response.ok) return null;

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
      url: edge.node?.shortcode ? `${INSTAGRAM_BASE}/p/${edge.node.shortcode}/` : undefined,
    }));

    const followerCount = user.edge_followed_by?.count || 0;
    const bio = user.biography || '';
    const externalLink = user.external_url || user.bio_links?.[0]?.url || '';
    const contact = extractContactInfo(bio, externalLink);
    const metrics = computeMetrics(recentPosts, followerCount);
    const lastPostDate = recentPosts.length > 0 ? recentPosts[0].timestamp || null : null;

    return {
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
  } catch (err) {
    console.error(`Error scraping ${username}:`, err);
    return null;
  }
}

// ==================== Mock Profile ====================

function generateMockProfile(username: string): ScrapedProfile {
  const seed = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min: number, max: number) =>
    Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * (max - min) + min);

  const followers = rand(500, 500000);
  const following = rand(100, 5000);
  const postCount = rand(20, 2000);

  const bios = [
    `${username} | Digital creator 🎨 | Based in NYC 📍 | Contact: ${username.replace(/[._]/g, '')}@email.com`,
    `Photographer & content creator ✨ | DM for collabs | ${username.replace(/[._]/g, '')}@gmail.com | wa.me/1234567890`,
    `Lifestyle blogger 🌿 | Link below 👇 | hello@${username.replace(/[._]/g, '')}.com`,
    `🎯 Marketing expert | Helping brands grow | Book a call 📞 +1-555-${rand(100, 999)}-${rand(1000, 9999)}`,
    `Creator | Artist | Dreamer | No contact info here, just vibes`,
    `${username} official | LA 🌴 | Business: work@${username.replace(/[._]/g, '')}.io | WhatsApp available`,
  ];

  const bio = bios[seed % bios.length];
  const externalLink =
    seed % 3 === 0
      ? `https://${username.replace(/[._]/g, '')}.com`
      : seed % 3 === 1
      ? `https://linktr.ee/${username.replace(/[._]/g, '')}`
      : '';

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
  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
  if (!cleanUsername) return { profile: null, error: 'Empty username', isMock: false };

  await sleep(getRandomDelay(1500, 4000));

  try {
    const profile = await scrapeFromInstagramAPI(cleanUsername, options);
    if (profile) return { profile, error: null, isMock: false };
  } catch {
    // fall through to mock
  }

  const mockProfile = generateMockProfile(cleanUsername);
  return { profile: mockProfile, error: null, isMock: true };
}

export { extractContactInfo, computeMetrics };
