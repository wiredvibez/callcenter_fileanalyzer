"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "../lib/cn";
import { clearAnalytics, hasAnalytics, getAnalytics, formatBytes, getAnalyticsSize } from "../lib/analytics-storage";
import { useState, useEffect } from "react";

const items = [
  { href: "/summary", label: "⭐ Summary" },
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
  const router = useRouter();
  const [dataExists, setDataExists] = useState(false);
  const [dataInfo, setDataInfo] = useState<{ files: number; size: string } | null>(null);
  
  useEffect(() => {
    const checkData = () => {
      const exists = hasAnalytics();
      setDataExists(exists);
      
      if (exists) {
        const analytics = getAnalytics();
        if (analytics) {
          setDataInfo({
            files: analytics.files_processed || 0,
            size: formatBytes(getAnalyticsSize()),
          });
        }
      } else {
        setDataInfo(null);
      }
    };
    
    checkData();
    // Re-check when window regains focus
    window.addEventListener('focus', checkData);
    return () => window.removeEventListener('focus', checkData);
  }, []);
  
  const handleClearData = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו לא ניתנת לביטול.')) {
      clearAnalytics();
      setDataExists(false);
      setDataInfo(null);
      router.push('/');
    }
  };
  
  return (
    <aside className={cn("w-64 shrink-0 border-r bg-card/40 flex flex-col")}>
      <div className="px-4 pt-4 text-xl font-bold">Analytics</div>
      <div className="px-4 py-2 text-xl font-semibold underline">Call Center Tzipi</div>
      
      {dataExists && dataInfo && (
        <div className="mx-4 mb-4 rounded-md bg-blue-50 p-3 text-xs" dir="rtl">
          <div className="font-semibold mb-1">נתונים בטאב</div>
          <div className="text-muted-foreground space-y-0.5">
            <div>{dataInfo.files} קבצים</div>
            <div>{dataInfo.size}</div>
          </div>
          <button
            onClick={handleClearData}
            className="mt-2 w-full rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200 transition-colors text-xs font-medium"
          >
            מחק נתונים
          </button>
        </div>
      )}
      
      <nav className="px-2 pb-6 flex-1 overflow-y-auto">
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
      
      {dataExists && (
        <div className="px-4 pb-4">
          <Link
            href="/"
            className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            העלה קבצים חדשים
          </Link>
        </div>
      )}
    </aside>
  );
}


