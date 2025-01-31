import { useFetcher } from "@remix-run/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function Index() {
  const fetcher = useFetcher<any>();

  if (fetcher.state === "submitting") {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

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
          <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Monthly Analytics Progress
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fetcher.data?.progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="engagementRate" stroke="#8884d8" name="Engagement Rate" />
                <Line type="monotone" dataKey="likeToViewRatio" stroke="#82ca9d" name="Like/View Ratio" />
                <Line type="monotone" dataKey="commentRate" stroke="#ffc658" name="Comment Rate" />
                <Line type="monotone" dataKey="estimatedEarnings" stroke="#ff7300" name="Estimated Earnings" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
