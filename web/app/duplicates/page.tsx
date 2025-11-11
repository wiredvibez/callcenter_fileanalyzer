import { readJson } from "../../lib/utils";
import { getRuleTextMap } from "../../lib/rules";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const dup = await readJson<Record<string, number[]>>("duplicates_by_text.json").catch(() => ({}));
  const ruleText = await getRuleTextMap();
  const entries = Object.entries(dup);
  entries.sort((a, b) => b[1].length - a[1].length);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Duplicates by Text</h1>
      <ul className="space-y-4">
        {entries.map(([text, ids]) => (
          <li key={text} className="rounded-md border p-4">
            <div className="mb-2 text-sm font-semibold">Duplicates ({ids.length})</div>
            <div className="text-sm break-words text-muted-foreground mb-2">{text}</div>
            <div className="text-xs break-words">
              {ids.map((id) => ruleText.get(Number(id)) ?? String(id)).join(" | ")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

