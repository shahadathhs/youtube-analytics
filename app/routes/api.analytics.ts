import { google } from "googleapis";
import { ActionFunction, json } from "@remix-run/node";
import {
  calculateCommentRate,
  calculateEngagementRate,
  calculateLikeToViewRatio,
  estimateEarnings,
} from "~/functions/functions";

/**
 * Extract a YouTube video ID from a given URL.
 * @param {string} url The URL from which to extract the video ID.
 * @returns {string|null} The video ID if found, or null otherwise.
 */
const extractVideoId = (url: string) => {
  const regex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Fetches videos from a specified YouTube channel published after a certain date.
 * Utilizes pagination to retrieve all videos by repeatedly fetching with a page token.
 * 
 * @param {any} youtube - The YouTube API client instance.
 * @param {string} channelId - The ID of the YouTube channel to fetch videos from.
 * @param {string} publishedAfter - ISO date string specifying the earliest date to fetch videos from.
 * @returns {Promise<Array<{ id: string, publishedAt: string }>>} A promise that resolves to an array of video objects, each containing video ID and published date.
 */

const fetchVideosFromChannel = async (youtube: any, channelId: string, publishedAfter: string) => {
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

    const newVideos = res?.data?.items?.map((video) => ({
      id: video.id.videoId,
      publishedAt: video.snippet.publishedAt,
    })) || [];

    videosFromChannel.push(...newVideos);
    nextPageToken = res?.data?.nextPageToken;
  } while (nextPageToken);

  return videosFromChannel;
};

const fetchVideoStats = async (youtube: any, videosFromChannel: any[]) => {
  const stats = [];
  for (let i = 0; i < videosFromChannel.length; i += 50) {
    const videoBatch = videosFromChannel.slice(i, i + 50);
    const resForStats = await youtube.videos.list({
      part: ["statistics"],
      id: videoBatch.map((v) => v.id),
    });

    const batchStats = resForStats?.data?.items?.map((item) => {
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

  return stats;
};

const groupByPeriod = (stats: any[], period: string) => {
  return stats.reduce((acc, video) => {
    const date = new Date(video.publishedAt);
    let key;

    if (period === "day") {
      key = date.toISOString().split("T")[0];
    } else if (period === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    }

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

const calculateProgressData = (data: any, period: string) => {
  return Object.entries(data).map(([key, stats]) => ({
    [`${period}`]: key,
    engagementRate: calculateEngagementRate([{ views: stats.views, likes: stats.likes, comments: stats.comments }]),
    likeToViewRatio: calculateLikeToViewRatio([{ views: stats.views, likes: stats.likes }]),
    commentRate: calculateCommentRate([{ views: stats.views, comments: stats.comments }]),
    estimatedEarnings: estimateEarnings([{ views: stats.views }], 2.5),
  }));
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const url = formData.get("url") as string;
  const days = 90;

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
    const videosFromChannel = await fetchVideosFromChannel(youtube, channelId, publishedAfter);
    console.log("Total Videos Found:", videosFromChannel.length);

    // 🟢 Fetch video stats
    const stats = await fetchVideoStats(youtube, videosFromChannel);
    console.log("Total Stats Processed:", stats.length);

    // 🟢 Group data by period (daily, weekly, monthly)
    const monthlyData = groupByPeriod(stats, "month");
    const weeklyData = groupByPeriod(stats, "week");
    const dailyData = groupByPeriod(stats, "day");

    console.log("Monthly Data:", monthlyData);
    console.log("Weekly Data:", weeklyData);
    console.log("Daily Data:", dailyData);

    // 🟢 Calculate progress data for each period
    const monthlyProgressData = calculateProgressData(monthlyData, "month");
    const weeklyProgressData = calculateProgressData(weeklyData, "week");
    const dailyProgressData = calculateProgressData(dailyData, "day");

    // 🟢 Combine all progress data
    const progressData = {
      monthly: monthlyProgressData,
      weekly: weeklyProgressData,
      daily: dailyProgressData,
    };

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
