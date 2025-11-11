import Link from "next/link";
import { cn } from "../lib/cn";

const items = [
  { href: "/", label: "⭐ Summary" },
  { href: "/url-engagement", label: " ⭐ URL Engagement" },
  { href: "/top-paths", label: " ⭐ Top Paths" },
  { href: "/dead-ends", label: "⭐ Dead Ends" },
  { href: "/entropy", label: "⭐ Entropy & Complexity" },
  { href: "/weekday-trends", label: "Weekday Trends" },
  { href: "/path-explorer", label: "Path Explorer" },
  { href: "/top-intents", label: "Top Intents" },
  { href: "/leaf-frequency", label: "Leaf Frequency" },
  { href: "/depth-funnel", label: "Depth Funnel" },
  { href: "/node-funnel", label: "Node Funnel" },
  { href: "/anomalies", label: "Anomalies" },
  { href: "/duplicates", label: "Duplicates" },
  { href: "/unreachable", label: "Unreachable" },
  { href: "/coverage", label: "Coverage Ratio" },
];

export function Sidebar() {
  return (
    <aside className={cn("w-64 shrink-0 border-r bg-card/40")}>
      <div className="px-4 pt-4 text-xl font-bold">Analytics</div>
      <div className="px-4 py-2 text-xl font-semibold underline">Call Center Tzipi</div>
      <nav className="px-2 pb-6">
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}


