import { useFetcher } from "@remix-run/react";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Index() {
  const fetcher = useFetcher<any>();
  const [dataType, setDataType] = useState<string>("engagementRate"); // Default to Engagement Rate
  const [duration, setDuration] = useState<string>("daily"); // Default to 7 Days

  const handleDataTypeChange = (type: string) => {
    setDataType(type);
  };

  const handleDurationChange = (period: string) => {
    setDuration(period);
  };

  if (fetcher.state === "submitting") {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

  // Filtered data based on selected dataType and duration
  const progressData = fetcher.data?.progressData?.[duration] || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          YouTube Channel Analytics
        </h1>

        <fetcher.Form
          method="post"
          action="/api/analytics"
          className="space-y-4"
        >
          <input
            name="url"
            type="text"
            placeholder="Enter video URL"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Analytics
          </button>
        </fetcher.Form>

        {fetcher.data && (
          <div className="mt-6">
            {/* Data Type Tabs */}
            <div className="flex justify-between mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDataTypeChange("engagementRate")}
                  className={`px-4 py-2 rounded-lg ${
                    dataType === "engagementRate"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Engagement Rate
                </button>
                <button
                  onClick={() => handleDataTypeChange("likeToViewRatio")}
                  className={`px-4 py-2 rounded-lg ${
                    dataType === "likeToViewRatio"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Like/View Ratio
                </button>
                <button
                  onClick={() => handleDataTypeChange("commentRate")}
                  className={`px-4 py-2 rounded-lg ${
                    dataType === "commentRate"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Comment Rate
                </button>
                <button
                  onClick={() => handleDataTypeChange("estimatedEarnings")}
                  className={`px-4 py-2 rounded-lg ${
                    dataType === "estimatedEarnings"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Estimated Earnings
                </button>
              </div>
            </div>

            {/* Duration Tabs */}
            <div className="flex justify-between mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDurationChange("daily")}
                  className={`px-4 py-2 rounded-lg ${
                    duration === "daily"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handleDurationChange("weekly")}
                  className={`px-4 py-2 rounded-lg ${
                    duration === "weekly"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Last 1 Month
                </button>
                <button
                  onClick={() => handleDurationChange("monthly")}
                  className={`px-4 py-2 rounded-lg ${
                    duration === "monthly"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Last 3 Months
                </button>
              </div>
            </div>

            {/* Analytics Chart */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Analytics Progress for {dataType} over {duration}
              </h3>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={dataType}
                    stroke="#8884d8"
                    name={dataType.replace(/([A-Z])/g, " $1")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
