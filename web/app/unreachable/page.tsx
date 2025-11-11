import { readJson } from "../../lib/utils";

export default async function Page() {
  const items = await readJson<any[]>("unreachable_nodes.json").catch(() => []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Unreachable Nodes</h1>
      <ul className="space-y-2 text-sm">
        {items.map((n) => (
          <li key={n.rule_id} className="rounded border p-2">
            <span className="font-semibold">{n.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

