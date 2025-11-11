import { readJson } from "../../lib/utils";
import { getRuleTextMap } from "../../lib/rules";

type Cov = { top1_coverage: number; top2_coverage: number };

export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await readJson<Record<string, Cov>>("coverage_ratio.json").catch(() => ({}));
  const rows = Object.entries(data).map(([rid, v]) => ({ rule_id: Number(rid), ...v }));
  rows.sort((a, b) => b.top1_coverage - a.top1_coverage);
  const ruleText = await getRuleTextMap();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Coverage Ratio</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Text</th>
              <th className="py-2 pr-4">Top-1 Coverage</th>
              <th className="py-2 pr-4">Top-2 Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rule_id} className="border-t">
                <td className="py-2 pr-4 break-words">{ruleText.get(r.rule_id) ?? String(r.rule_id)}</td>
                <td className="py-2 pr-4">{(r.top1_coverage * 100).toFixed(1)}%</td>
                <td className="py-2 pr-4">{(r.top2_coverage * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

