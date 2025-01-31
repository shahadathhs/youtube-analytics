import { useFetcher } from "@remix-run/react";

export default function Index() {
  // 🟢 Use the useFetcher hook to handle form submission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg">
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
              Metrics
            </h3>
            <p className="text-gray-700">
              Engagement Rate:{" "}
              <span className="font-semibold">
                {fetcher.data?.engagementRate}
              </span>
            </p>
            <p className="text-gray-700">
              Like-to-View Ratio:{" "}
              <span className="font-semibold">
                {fetcher.data?.likeToViewRatio}
              </span>
            </p>
            <p className="text-gray-700">
              Comment Rate:{" "}
              <span className="font-semibold">{fetcher.data?.commentRate}</span>
            </p>
            <p className="text-gray-700">
              Estimated Earnings:{" "}
              <span className="font-semibold">
                ${fetcher.data?.estimateEarning}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
