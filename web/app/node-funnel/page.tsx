import { readJson } from "../../lib/utils";
import { getRuleTextMap } from "../../lib/rules";

export default async function Page() {
  const data = await readJson<Record<string, { reach: number; transitions: number; drop_off: number }>>(
    "node_funnel.json"
  ).catch(() => ({}));
  const rows = Object.entries(data).map(([rid, v]) => ({ rule_id: Number(rid), ...v }));
  rows.sort((a, b) => b.drop_off - a.drop_off);
  const ruleText = await getRuleTextMap();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Node Funnel</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Text</th>
              <th className="py-2 pr-4">Reach</th>
              <th className="py-2 pr-4">Transitions</th>
              <th className="py-2 pr-4">Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rule_id} className="border-t">
                <td className="py-2 pr-4 break-words">{ruleText.get(r.rule_id) ?? String(r.rule_id)}</td>
                <td className="py-2 pr-4">{r.reach}</td>
                <td className="py-2 pr-4">{r.transitions}</td>
                <td className="py-2 pr-4">{r.drop_off}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

