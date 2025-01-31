// Calculate Engagement Rate
export function calculateEngagementRate(videoStats: any[]) {
  const totalLikes = videoStats.reduce((sum, v) => sum + parseInt(v.likes), 0);
  const totalComments = videoStats.reduce((sum, v) => sum + parseInt(v.comments), 0);
  const totalViews = videoStats.reduce((sum, v) => sum + parseInt(v.views), 0);

  return (totalLikes + totalComments) / totalViews;
}


// Calculate Like-to-View Ratio
export function calculateLikeToViewRatio(videoStats: any[]) {
  const totalLikes = videoStats.reduce((sum, v) => sum + parseInt(v.likes), 0);
  const totalViews = videoStats.reduce((sum, v) => sum + parseInt(v.views), 0);
  return (totalLikes / totalViews) * 100;
}

// Calculate Comment Rate
export function calculateCommentRate(videoStats: any[]) {
  const totalComments = videoStats.reduce((sum, v) => sum + parseInt(v.comments), 0);
  const totalViews = videoStats.reduce((sum, v) => sum + parseInt(v.views), 0);
  return (totalComments / totalViews) * 100;
}

// Estimate Earnings based on views and CPM
export function estimateEarnings(videoStats: any[], cpm: number = 2.5) {
  const totalViews = videoStats.reduce((sum, v) => sum + parseInt(v.views), 0);
  return (totalViews / 1000) * cpm;
}
