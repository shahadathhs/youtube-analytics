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

const dataTypes = [
  { label: "Engagement Rate", key: "engagementRate" },
  { label: "Like-to-View", key: "likeToViewRatio" },
  { label: "Comment Rate", key: "commentRate" },
  { label: "Estimated Earnings", key: "estimatedEarnings" },
];

const durationOptions = [
  { label: "7 Days", value: 7 },
  { label: "28 Days", value: 28 },
  { label: "90 Days", value: 90 },
];

export default function Index() {
  const fetcher = useFetcher<any>();
  const [selectedDataType, setSelectedDataType] = useState(dataTypes[0].key);
  const [selectedDuration, setSelectedDuration] = useState(7);

  if (fetcher.state === "submitting") {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

  const chartData =
    fetcher.data?.progressData?.[`last${selectedDuration}Days`] || [];
  const currentData = chartData.map((item) => ({
    ...item,
    [selectedDataType]: Number(item[selectedDataType].toFixed(2)),
  }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-4xl">
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
          <div className="mt-6 space-y-6">
            {/* Note for users */}
            <div className="text-sm text-gray-500 text-center italic">
              Note: Analysis is based on videos uploaded in the last 90 days.
              Duration selection filters the displayed data from this 90-day
              period.
            </div>

            {/* Data Type Tabs */}
            <div className="flex flex-wrap gap-2">
              {dataTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setSelectedDataType(type.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedDataType === type.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Duration Tabs */}
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDuration(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedDuration === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Analytics Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      selectedDataType === "estimatedEarnings"
                        ? `$${value.toFixed(2)}`
                        : value.toFixed(2)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [
                      selectedDataType === "estimatedEarnings"
                        ? `$${Number(value).toFixed(2)}`
                        : Number(value).toFixed(2),
                      dataTypes.find((t) => t.key === selectedDataType)?.label,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedDataType}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dataTypes.map((type) => (
                <div key={type.key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">{type.label}</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {fetcher.data?.progressData?.[
                      `last${selectedDuration}Days`
                    ]?.[0]?.[type.key]?.toFixed(2) || "0.00"}
                    {type.key === "estimatedEarnings" && "$"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
