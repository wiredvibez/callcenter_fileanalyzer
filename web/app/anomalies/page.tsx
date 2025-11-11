import { readJson } from "../../lib/utils";
import { getRuleTextMap } from "../../lib/rules";

export default async function Page() {
  const edges = await readJson<any[]>("anomalies.json").catch(() => []);
  const ruleText = await getRuleTextMap();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Anomalies (Edges not in tree)</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">From</th>
              <th className="py-2 pr-4">To</th>
              <th className="py-2 pr-4">Count</th>
            </tr>
          </thead>
          <tbody>
            {edges.map((e, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-2 pr-4 break-words">
                  {Array.isArray(e.from)
                    ? e.from.map((id: number | string) => ruleText.get(Number(id)) ?? String(id)).join(", ")
                    : ruleText.get(Number(e.from)) ?? String(e.from)}
                </td>
                <td className="py-2 pr-4 break-words">
                  {Array.isArray(e.to)
                    ? e.to.map((id: number | string) => ruleText.get(Number(id)) ?? String(id)).join(", ")
                    : ruleText.get(Number(e.to)) ?? String(e.to)}
                </td>
                <td className="py-2 pr-4">{e.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

