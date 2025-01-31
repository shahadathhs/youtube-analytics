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
  const days = Number(formData.get("days")) || 7;

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
    part: [
      "contentDetails",
      "id",
      "liveStreamingDetails",
      "snippet",
      "statistics",
      "status",
    ],
    id: [videoId],
  });
  const channelId = videoResponse?.data?.items[0]?.snippet?.channelId;

  if (!channelId) {
    return json({ error: "Channel ID is required." });
  }
  // * Fetch and calculate metrics
  const response = await youtube.channels.list({
    part: ["snippet", "contentDetails", "statistics"],
    id: [channelId],
  });
  // console.log("response", response);

  const channelData = response.data.items?.[0];
  // console.log("channelData", channelData);
  if (!channelData) {
    return json({ error: "Channel not found." });
  }
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const publishedAfter = dateFrom.toISOString();

    const res = await youtube.search.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ["snippet"],
      channelId,
      publishedAfter,
      type: "video",
    });

    const videosFromChannel = res?.data?.items;
    // console.log("videosFromChannel", videosFromChannel);
    const videoIds = videosFromChannel.map((video) => video.id.videoId);

    const resForStats = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ["statistics"],
      id: videoIds.join(","),
    });

    const stats = resForStats?.data?.items?.map((item) => ({
      id: item.id,
      views: item?.statistics?.viewCount,
      likes: item?.statistics?.likeCount,
      comments: item?.statistics?.commentCount,
    }));
    console.log("stats", stats);

    // Calculate metrics
    const engagementRate = calculateEngagementRate(stats);
    const likeToViewRatio = calculateLikeToViewRatio(stats);
    const commentRate = calculateCommentRate(stats);
    const estimateEarning = estimateEarnings(stats, 2.5);

    return json({
      channelData,
      videosFromChannel,
      stats,
      engagementRate,
      likeToViewRatio,
      commentRate,
      estimateEarning,
    });
  } catch (err) {
    return json({ error: "Failed to fetch and calculate metrics." });
  }
};
