import { readJson } from "../../lib/utils";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const items = await readJson<any[]>("leaf_frequency.json").catch(() => []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leaf Frequency</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Text</th>
              <th className="py-2 pr-4">Count</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.rule_id} className="border-t">
                <td className="py-2 pr-4 break-words">{i.text}</td>
                <td className="py-2 pr-4">{i.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

