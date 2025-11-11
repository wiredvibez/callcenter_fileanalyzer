import { readJson } from "../../lib/utils";
import { getRuleTextMap } from "../../lib/rules";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const items = await readJson<any[]>("dead_ends.json").catch(() => []);
  const ruleText = await getRuleTextMap();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dead Ends</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Text</th>
              <th className="py-2 pr-4">Has Children</th>
              <th className="py-2 pr-4">Termination Rate</th>
              <th className="py-2 pr-4">Reach</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.rule_id} className="border-t">
                <td className="py-2 pr-4 break-words">{ruleText.get(d.rule_id) ?? String(d.rule_id)}</td>
                <td className="py-2 pr-4">{d.has_children ? "Yes" : "No"}</td>
                <td className="py-2 pr-4">{(d.termination_rate * 100).toFixed(1)}%</td>
                <td className="py-2 pr-4">{d.reach_occurrences}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

