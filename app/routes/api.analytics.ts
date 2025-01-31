import { google } from "googleapis";
import { ActionFunction, json } from "@remix-run/node";
import {
  calculateCommentRate,
  calculateEngagementRate,
  calculateLikeToViewRatio,
  estimateEarnings,
} from "~/functions/functions";

// Utility function to extract video ID from URL
const extractVideoId = (url: string): string | null => {
  const regex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Fetch all videos from a channel within a specific time range
const fetchVideosFromChannel = async (
  youtube: any,
  channelId: string,
  publishedAfter: string
): Promise<any[]> => {
  const videosFromChannel = [];
  let nextPageToken = null;

  try {
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
          publishedAt: video.snippet.publishedAt,
        })) || [];

      videosFromChannel.push(...newVideos);
      nextPageToken = res?.data?.nextPageToken;
    } while (nextPageToken);
  } catch (error) {
    console.error("Error fetching videos from channel:", error);
    throw new Error("Failed to fetch videos from channel.");
  }

  return videosFromChannel;
};

// Fetch statistics for a batch of videos
const fetchVideoStats = async (
  youtube: any,
  videosFromChannel: any[]
): Promise<any[]> => {
  const stats = [];

  try {
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
  } catch (error) {
    console.error("Error fetching video statistics:", error);
    throw new Error("Failed to fetch video statistics.");
  }

  return stats;
};

// Group video statistics by day
const groupByPeriod = (stats: any[]): Record<string, any> => {
  return stats.reduce((acc, video) => {
    const date = new Date(video.publishedAt);
    const key = date.toISOString().split("T")[0];

    if (!acc[key]) {
      acc[key] = { views: 0, likes: 0, comments: 0, count: 0 };
    }

    acc[key].views += parseInt(video.views);
    acc[key].likes += parseInt(video.likes);
    acc[key].comments += parseInt(video.comments);
    acc[key].count++;

    return acc;
  }, {});
};

// Calculate progress data for a specific period
const calculateProgressData = (
  data: any,
  period: string,
  limit: number
): any[] => {
  return Object.entries(data)
    .slice(-limit) // Get the last 'limit' days
    .map(([key, stats]) => ({
      [`${period}`]: key,
      engagementRate: calculateEngagementRate([
        { views: stats.views, likes: stats.likes, comments: stats.comments },
      ]),
      likeToViewRatio: calculateLikeToViewRatio([
        { views: stats.views, likes: stats.likes },
      ]),
      commentRate: calculateCommentRate([
        { views: stats.views, comments: stats.comments },
      ]),
      estimatedEarnings: estimateEarnings([{ views: stats.views }], 2.5),
    }));
};

// * Main action function
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const url = formData.get("url") as string;

  if (!url) {
    return json({ error: "URL is required." }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return json({ error: "Invalid YouTube URL." }, { status: 400 });
  }

  const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
  });

  try {
    // Fetch video details to get the channel ID
    const videoResponse = await youtube.videos.list({
      part: ["snippet"],
      id: [videoId],
    });

    const channelId = videoResponse?.data?.items?.[0]?.snippet?.channelId;
    if (!channelId) {
      return json({ error: "Channel ID not found." }, { status: 404 });
    }

    // Calculate the date 90 days ago
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 90);
    const publishedAfter = dateFrom.toISOString();

    // Fetch all videos from the channel
    const videosFromChannel = await fetchVideosFromChannel(
      youtube,
      channelId,
      publishedAfter
    );

    // Fetch statistics for all videos
    const stats = await fetchVideoStats(youtube, videosFromChannel);

    // Group statistics by day
    const dailyData = groupByPeriod(stats);

    // Calculate progress data for 7, 28, and 90 days
    const progressData = {
      last7Days: calculateProgressData(dailyData, "day", 7),
      last28Days: calculateProgressData(dailyData, "day", 28),
      last90Days: calculateProgressData(dailyData, "day", 90),
    };

    return json({
      channelId,
      totalVideos: videosFromChannel.length,
      data: stats, // Raw stats data
      progressData, // Data formatted for graph
    });
  } catch (error) {
    console.error("Error in action function:", error);
    return json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
};
