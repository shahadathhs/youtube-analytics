import { google } from "googleapis";
import { ActionFunction, json } from "@remix-run/node";
import {
  calculateCommentRate,
  calculateEngagementRate,
  calculateLikeToViewRatio,
  estimateEarnings,
} from "~/functions/functions";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const url = formData.get("url") as string;
  const days = 365;

  function extractVideoId(url: string) {
    const regex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  const videoId = extractVideoId(url);

  const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
  });

  const videoResponse = await youtube.videos.list({
    part: ["snippet"],
    id: [videoId],
  });

  const channelId = videoResponse?.data?.items?.[0]?.snippet?.channelId;
  if (!channelId) return json({ error: "Channel ID is required." });

  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const publishedAfter = dateFrom.toISOString();

    // 🟢 Fetch all video IDs with pagination
    const videosFromChannel = [];
    let nextPageToken = null;

    do {
      const res = await youtube.search.list({
        part: ["id"],
        channelId,
        publishedAfter,
        type: "video",
        maxResults: 50, // Max allowed per request
        pageToken: nextPageToken || undefined,
      });

      const newVideos =
        res?.data?.items?.map((video) => video.id.videoId) || [];
      videosFromChannel.push(...newVideos);
      nextPageToken = res?.data?.nextPageToken;
    } while (nextPageToken);

    console.log("Total Videos Found:", videosFromChannel.length);

    // 🟢 Fetch stats in batches of 50
    const stats = [];
    for (let i = 0; i < videosFromChannel.length; i += 50) {
      const videoBatch = videosFromChannel.slice(i, i + 50);
      const resForStats = await youtube.videos.list({
        part: ["statistics"],
        id: videoBatch,
      });

      const batchStats =
        resForStats?.data?.items?.map((item) => ({
          id: item.id,
          views: item?.statistics?.viewCount || "0",
          likes: item?.statistics?.likeCount || "0",
          comments: item?.statistics?.commentCount || "0",
        })) || [];

      stats.push(...batchStats);
    }

    console.log("Total Stats Processed:", stats.length);

    // 🟢 Calculate Metrics
    const engagementRate = calculateEngagementRate(stats);
    const likeToViewRatio = calculateLikeToViewRatio(stats);
    const commentRate = calculateCommentRate(stats);
    const estimateEarning = estimateEarnings(stats, 2.5);

    return json({
      channelId,
      totalVideos: videosFromChannel.length,
      stats,
      engagementRate,
      likeToViewRatio,
      commentRate,
      estimateEarning,
    });
  } catch (err) {
    console.error("Error Fetching Data:", err);
    return json({ error: "Failed to fetch and calculate metrics." });
  }
};
