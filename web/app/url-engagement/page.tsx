import { readJson } from "../../lib/utils";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const items = await readJson<any[]>("url_engagement.json").catch(() => []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">URL Engagement</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">URL</th>
              <th className="py-2 pr-4">Count</th>
            </tr>
          </thead>
          <tbody>
            {items.map(([url, count], idx) => (
              <tr key={idx} className="border-t">
                <td className="py-2 pr-4 break-all">{url}</td>
                <td className="py-2 pr-4">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


