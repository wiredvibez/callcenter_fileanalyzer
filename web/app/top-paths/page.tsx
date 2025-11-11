import { readJson } from "../../lib/utils";
import { getRuleTextMap } from "../../lib/rules";

export default async function Page() {
  const items = await readJson<any[]>("top_paths.json").catch(() => []);
  const ruleText = await getRuleTextMap();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Top Paths</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Count</th>
              <th className="py-2 pr-4">Path (text sequence)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-2 pr-4">{row.count}</td>
                <td className="py-2 pr-4 break-words">
                  {(row.path || [])
                    .map((id: number | string) => ruleText.get(Number(id)) ?? String(id))
                    .join(" → ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

