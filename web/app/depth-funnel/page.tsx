import { readJson } from "../../lib/utils";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await readJson<Record<string, number>>("depth_funnel.json").catch(() => ({}));
  const rows = Object.entries(data).map(([depth, count]) => ({ depth: Number(depth), count }));
  rows.sort((a, b) => a.depth - b.depth);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Depth Funnel</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Depth</th>
              <th className="py-2 pr-4">Calls reaching</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.depth} className="border-t">
                <td className="py-2 pr-4">{r.depth}</td>
                <td className="py-2 pr-4">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


