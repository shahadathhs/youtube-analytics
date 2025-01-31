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
  const days = 90;

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

    // 🟢 Fetch all video IDs and their publish dates
    const videosFromChannel = [];
    let nextPageToken = null;

    do {
      const res = await youtube.search.list({
        part: ["id", "snippet"],
        channelId,
        publishedAfter,
        type: "video",
        maxResults: 50,
        pageToken: nextPageToken || undefined,
      });

      const newVideos =
        res?.data?.items?.map((video) => ({
          id: video.id.videoId,
          publishedAt: video.snippet.publishedAt, // Get published date
        })) || [];

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
        id: videoBatch.map((v) => v.id),
      });

      const batchStats =
        resForStats?.data?.items?.map((item) => {
          const video = videosFromChannel.find((v) => v.id === item.id);
          return {
            id: item.id,
            views: item?.statistics?.viewCount || "0",
            likes: item?.statistics?.likeCount || "0",
            comments: item?.statistics?.commentCount || "0",
            publishedAt: video?.publishedAt || "",
          };
        }) || [];

      stats.push(...batchStats);
    }

    console.log("Total Stats Processed:", stats.length);

    // 🟢 Group by month
    const monthlyData = stats.reduce((acc, video) => {
      const date = new Date(video.publishedAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!acc[monthKey]) {
        acc[monthKey] = { views: 0, likes: 0, comments: 0, count: 0 };
      }

      acc[monthKey].views += parseInt(video.views);
      acc[monthKey].likes += parseInt(video.likes);
      acc[monthKey].comments += parseInt(video.comments);
      acc[monthKey].count++;

      return acc;
    }, {});

    // 🟢 Calculate metrics for each month
    const progressData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      engagementRate: calculateEngagementRate([
        { views: data.views, likes: data.likes, comments: data.comments },
      ]),
      likeToViewRatio: calculateLikeToViewRatio([
        { views: data.views, likes: data.likes },
      ]),
      commentRate: calculateCommentRate([
        { views: data.views, comments: data.comments },
      ]),
      estimatedEarnings: estimateEarnings([{ views: data.views }], 2.5),
    }));
    console.log("Progress Data:", progressData);

    return json({
      channelId,
      totalVideos: videosFromChannel.length,
      data: stats, // Raw stats data
      progressData, // Data formatted for graph
    });
  } catch (err) {
    console.error("Error Fetching Data:", err);
    return json({ error: "Failed to fetch and calculate metrics." });
  }
};
