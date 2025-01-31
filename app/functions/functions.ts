/**
 * Calculates the engagement rate based on likes, comments, and views.
 * @param {Array<{ likes: string, comments: string, views: string }>} videoStats - Array of video statistics.
 * @returns {number} Engagement rate as a decimal.
 */
export function calculateEngagementRate(
  videoStats: Array<{ likes: string; comments: string; views: string }>
) {
  const totalLikes = videoStats.reduce((sum, v) => sum + parseInt(v.likes), 0);
  const totalComments = videoStats.reduce(
    (sum, v) => sum + parseInt(v.comments),
    0
  );
  const totalViews = videoStats.reduce((sum, v) => sum + parseInt(v.views), 0);

  return totalViews > 0 ? (totalLikes + totalComments) / totalViews : 0;
}

/**
 * Calculates the like-to-view ratio as a percentage.
 * @param {Array<{ likes: string, views: string }>} videoStats - Array of video statistics.
 * @returns {number} Like-to-view ratio as a percentage.
 */
export function calculateLikeToViewRatio(
  videoStats: Array<{ likes: string; views: string }>
) {
  const totalLikes = videoStats.reduce((sum, v) => sum + parseInt(v.likes), 0);
  const totalViews = videoStats.reduce((sum, v) => sum + parseInt(v.views), 0);

  return totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
}

/**
 * Calculates the comment rate as a percentage.
 * @param {Array<{ comments: string, views: string }>} videoStats - Array of video statistics.
 * @returns {number} Comment rate as a percentage.
 */
export function calculateCommentRate(
  videoStats: Array<{ comments: string; views: string }>
) {
  const totalComments = videoStats.reduce(
    (sum, v) => sum + parseInt(v.comments),
    0
  );
  const totalViews = videoStats.reduce((sum, v) => sum + parseInt(v.views), 0);

  return totalViews > 0 ? (totalComments / totalViews) * 100 : 0;
}

/**
 * Estimates earnings based on total views and cost per thousand (CPM).
 * @param {Array<{ views: string }>} videoStats - Array of video statistics.
 * @param {number} [cpm=2.5] - Cost per thousand views (default is 2.5).
 * @returns {number} Estimated earnings.
 */
export function estimateEarnings(
  videoStats: Array<{ views: string }>,
  cpm = 2.5
) {
  const totalViews = videoStats.reduce((sum, v) => sum + parseInt(v.views), 0);
  return (totalViews / 1000) * cpm;
}
