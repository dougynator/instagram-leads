import { FilterCriteria, ScrapedProfile, MatchReason, ScoringWeights } from './types';

// ==================== Filter Evaluation ====================

export function evaluateFilters(
  profile: ScrapedProfile,
  filters: FilterCriteria
): { matched: boolean; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];

  // Helper
  const addReason = (criterion: string, passed: boolean, detail: string) => {
    reasons.push({ criterion, passed, detail });
  };

  // Follower count filters
  if (filters.min_followers != null && filters.min_followers > 0) {
    const v = profile.follower_count || 0;
    const passed = v >= filters.min_followers;
    addReason(
      'min_followers',
      passed,
      passed
        ? `Followers (${v.toLocaleString()}) >= ${filters.min_followers.toLocaleString()}`
        : `Followers (${v.toLocaleString()}) < min ${filters.min_followers.toLocaleString()}`
    );
  }

  if (filters.max_followers != null && filters.max_followers > 0) {
    const v = profile.follower_count || 0;
    const passed = v <= filters.max_followers;
    addReason(
      'max_followers',
      passed,
      passed
        ? `Followers (${v.toLocaleString()}) <= ${filters.max_followers.toLocaleString()}`
        : `Followers (${v.toLocaleString()}) > max ${filters.max_followers.toLocaleString()}`
    );
  }

  // Engagement rate
  if (filters.min_engagement_rate != null && filters.min_engagement_rate > 0) {
    const v = profile.engagement_rate || 0;
    const passed = v >= filters.min_engagement_rate;
    addReason(
      'min_engagement_rate',
      passed,
      passed
        ? `Engagement (${v}%) >= ${filters.min_engagement_rate}%`
        : `Engagement (${v}%) < min ${filters.min_engagement_rate}%`
    );
  }

  if (filters.max_engagement_rate != null && filters.max_engagement_rate > 0) {
    const v = profile.engagement_rate || 0;
    const passed = v <= filters.max_engagement_rate;
    addReason(
      'max_engagement_rate',
      passed,
      passed
        ? `Engagement (${v}%) <= ${filters.max_engagement_rate}%`
        : `Engagement (${v}%) > max ${filters.max_engagement_rate}%`
    );
  }

  // Average likes
  if (filters.avg_likes_last_x != null && filters.avg_likes_last_x > 0) {
    const v = profile.avg_likes || 0;
    const passed = v >= filters.avg_likes_last_x;
    addReason(
      'avg_likes_last_x',
      passed,
      passed
        ? `Avg likes (${v}) >= ${filters.avg_likes_last_x}`
        : `Avg likes (${v}) < min ${filters.avg_likes_last_x}`
    );
  }

  // Average comments
  if (filters.avg_comments_last_x != null && filters.avg_comments_last_x > 0) {
    const v = profile.avg_comments || 0;
    const passed = v >= filters.avg_comments_last_x;
    addReason(
      'avg_comments_last_x',
      passed,
      passed
        ? `Avg comments (${v}) >= ${filters.avg_comments_last_x}`
        : `Avg comments (${v}) < min ${filters.avg_comments_last_x}`
    );
  }

  // Last post within days
  if (filters.last_post_within_days != null && filters.last_post_within_days > 0) {
    const lastDate = profile.last_post_date ? new Date(profile.last_post_date) : null;
    const now = new Date();
    if (lastDate) {
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);
      const passed = daysDiff <= filters.last_post_within_days;
      addReason(
        'last_post_within_days',
        passed,
        passed
          ? `Last post ${daysDiff}d ago (within ${filters.last_post_within_days}d)`
          : `Last post ${daysDiff}d ago (exceeds ${filters.last_post_within_days}d limit)`
      );
    } else {
      addReason('last_post_within_days', false, 'No recent posts found');
    }
  }

  // Bio keywords include (any match = pass)
  if (filters.bio_keywords_include?.length) {
    const bio = (profile.bio || '').toLowerCase();
    const matched = filters.bio_keywords_include.filter((kw) =>
      bio.includes(kw.toLowerCase())
    );
    const passed = matched.length > 0;
    addReason(
      'bio_keywords_include',
      passed,
      passed
        ? `Bio contains: ${matched.join(', ')}`
        : `Bio missing required keywords: ${filters.bio_keywords_include.join(', ')}`
    );
  }

  // Bio keywords exclude (any match = fail)
  if (filters.bio_keywords_exclude?.length) {
    const bio = (profile.bio || '').toLowerCase();
    const found = filters.bio_keywords_exclude.filter((kw) =>
      bio.includes(kw.toLowerCase())
    );
    const passed = found.length === 0;
    addReason(
      'bio_keywords_exclude',
      passed,
      passed
        ? 'Bio does not contain excluded keywords'
        : `Bio contains excluded keywords: ${found.join(', ')}`
    );
  }

  // Location keywords
  if (filters.location_keywords?.length) {
    const text = `${profile.bio || ''} ${profile.display_name || ''}`.toLowerCase();
    const matched = filters.location_keywords.filter((kw) =>
      text.includes(kw.toLowerCase())
    );
    const passed = matched.length > 0;
    addReason(
      'location_keywords',
      passed,
      passed
        ? `Location match: ${matched.join(', ')}`
        : `No location match for: ${filters.location_keywords.join(', ')}`
    );
  }

  // Contact info required
  if (filters.contact_info_required) {
    const hasEmail = !!profile.detected_email;
    const hasPhone = !!profile.detected_phone;
    const hasWebsite = !!profile.detected_website;
    const hasWhatsapp = !!profile.detected_whatsapp;

    const types = filters.contact_info_types || { email: true, website: true, phone: true };
    const checks: string[] = [];
    let hasAny = false;

    if (types.email && hasEmail) { checks.push('email'); hasAny = true; }
    if (types.website && hasWebsite) { checks.push('website'); hasAny = true; }
    if (types.phone && (hasPhone || hasWhatsapp)) { checks.push('phone/whatsapp'); hasAny = true; }

    // If no specific types requested, any contact info counts
    if (!types.email && !types.website && !types.phone) {
      hasAny = hasEmail || hasPhone || hasWebsite || hasWhatsapp;
    }

    addReason(
      'contact_info_required',
      hasAny,
      hasAny
        ? `Contact info found: ${checks.join(', ')}`
        : 'No contact info detected'
    );
  }

  // Overall match: all criteria must pass
  const matched = reasons.length === 0 || reasons.every((r) => r.passed);

  return { matched, reasons };
}

// ==================== Scoring ====================

export function computeScore(
  profile: ScrapedProfile,
  filters: FilterCriteria
): number {
  if (!filters.scoring_enabled) return 0;

  const weights: ScoringWeights = filters.scoring_weights || {
    followers: 20,
    engagement: 30,
    contact_info: 20,
    freshness: 15,
    keyword_match: 15,
  };

  const totalWeight =
    (weights.followers || 0) +
    (weights.engagement || 0) +
    (weights.contact_info || 0) +
    (weights.freshness || 0) +
    (weights.keyword_match || 0);

  if (totalWeight === 0) return 0;

  let score = 0;

  // Followers score (bell curve: sweet spot 5k-100k)
  if (weights.followers) {
    const f = profile.follower_count || 0;
    let fScore = 0;
    if (f < 1000) fScore = 20;
    else if (f < 5000) fScore = 50;
    else if (f < 10000) fScore = 75;
    else if (f < 50000) fScore = 100;
    else if (f < 100000) fScore = 90;
    else if (f < 500000) fScore = 70;
    else fScore = 50;
    score += (fScore * (weights.followers || 0)) / totalWeight;
  }

  // Engagement score
  if (weights.engagement) {
    const er = profile.engagement_rate || 0;
    let eScore = 0;
    if (er >= 6) eScore = 100;
    else if (er >= 4) eScore = 90;
    else if (er >= 2) eScore = 70;
    else if (er >= 1) eScore = 50;
    else if (er >= 0.5) eScore = 30;
    else eScore = 10;
    score += (eScore * (weights.engagement || 0)) / totalWeight;
  }

  // Contact info score
  if (weights.contact_info) {
    let cScore = 0;
    if (profile.detected_email) cScore += 40;
    if (profile.detected_phone || profile.detected_whatsapp) cScore += 30;
    if (profile.detected_website) cScore += 30;
    score += (Math.min(cScore, 100) * (weights.contact_info || 0)) / totalWeight;
  }

  // Freshness score
  if (weights.freshness) {
    const lastDate = profile.last_post_date ? new Date(profile.last_post_date) : null;
    let fScore = 0;
    if (lastDate) {
      const daysSince = Math.floor(
        (Date.now() - lastDate.getTime()) / 86400000
      );
      if (daysSince <= 3) fScore = 100;
      else if (daysSince <= 7) fScore = 90;
      else if (daysSince <= 14) fScore = 75;
      else if (daysSince <= 30) fScore = 60;
      else if (daysSince <= 60) fScore = 40;
      else fScore = 10;
    }
    score += (fScore * (weights.freshness || 0)) / totalWeight;
  }

  // Keyword match score
  if (weights.keyword_match) {
    const bio = (profile.bio || '').toLowerCase();
    const includeKw = filters.bio_keywords_include || [];
    const locationKw = filters.location_keywords || [];
    const allKw = [...includeKw, ...locationKw];

    let kScore = 0;
    if (allKw.length > 0) {
      const matched = allKw.filter((kw) => bio.includes(kw.toLowerCase()));
      kScore = Math.round((matched.length / allKw.length) * 100);
    } else {
      kScore = 50; // Neutral when no keywords defined
    }
    score += (kScore * (weights.keyword_match || 0)) / totalWeight;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}
