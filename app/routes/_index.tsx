import { useFetcher } from "@remix-run/react";
import { useState } from "react";

export default function Index() {
  const [days, setDays] = useState(7);
  const fetcher = useFetcher<any>();
  console.log(fetcher);
  if (fetcher.state === "submitting") {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <fetcher.Form method="post" action="/api/analytics">
        <h1>YouTube Channel Analytics</h1>
        <input name="url" type="text" placeholder="Enter video URL" required />
        <select
          name="days"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 Days</option>
          <option value={28}>Last 28 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
        <button type="submit">Get Analytics</button>
      </fetcher.Form>
      {fetcher.data && (
        <div>
          <h3>Metrics</h3>
          <p>Engagement Rate: {fetcher.data?.engagementRate}</p>
          <p>Like-to-View Ratio: {fetcher.data?.likeToViewRatio}</p>
          <p>Comment Rate: {fetcher.data?.commentRate}</p>
          <p>Estimated Earnings: ${fetcher.data?.estimateEarning}</p>
        </div>
      )}
    </div>
  );
}
