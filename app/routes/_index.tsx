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
          <div className="mt-6">
            {/* Data Type Tabs */}
            {/* User can select one of the tabs  */}
            

            {/* Duration Tabs */}
            {/* User can select one of the tabs  */}
           

            {/* Analytics Chart */}
            {/* Data will be based on the selected dataType and duration */}
           
          </div>
        )}
      </div>
    </div>
  );
}
