'use client';

import { useEffect, useState } from "react";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

type Ent = { entropy_bits: number; perplexity: number; branching_factor: number; rule_id: number; text?: string };

export default function Page() {
  const [rows, setRows] = useState<Ent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [minEntropy, setMinEntropy] = useState(0);
  const [maxEntropy, setMaxEntropy] = useState(0);
  const [entropyRange, setEntropyRange] = useState(0);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      const entropyData = analytics.entropy_complexity_top20 || [];
      // Sort by entropy_bits descending
      const sortedRows = [...entropyData].sort((a, b) => b.entropy_bits - a.entropy_bits);
      setRows(sortedRows);
      
      // Calculate global min/max for consistent color scaling
      const entropyValues = sortedRows.map((r) => r.entropy_bits);
      const min = Math.min(...entropyValues);
      const max = Math.max(...entropyValues);
      const range = max - min;
      setMinEntropy(min);
      setMaxEntropy(max);
      setEntropyRange(range);
      
      setHasData(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">טוען...</div>;
  }

  if (!hasData) {
    return <NoDataMessage />;
  }
  
  const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const entropyBg = (entropyBits: number) => {
    // Normalize to 0-1 based on global min/max
    const t = entropyRange > 0 ? clamp01((entropyBits - minEntropy) / entropyRange) : 0;
    const hue = Math.round((1 - t) * 120); // 120=green → 0=red
    return `hsl(${hue}, 70%, 85%)`;
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Entropy & Complexity</h1>
      <div className="overflow-x-auto" dir="rtl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right">
              <th className="py-2 pl-4">Text</th>
              <th className="py-2 pl-4 text-center">Entropy (bits)</th>
              <th className="py-2 pl-4 text-center">Perplexity</th>
              <th className="py-2 pl-4 text-center">Branching Factor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const bgColor = entropyBg(r.entropy_bits);
              return (
                <tr key={r.rule_id} className="border-t">
                  <td className="py-2 pl-4 break-words text-right">{r.text ?? String(r.rule_id)}</td>
                  <td
                    className="py-2 pl-4 text-center"
                    style={{ backgroundColor: bgColor }}
                    title={`Raw entropy: ${r.entropy_bits.toFixed(3)} bits`}
                  >
                    {r.entropy_bits.toFixed(3)}
                  </td>
                  <td className="py-2 pl-4 text-center">{r.perplexity.toFixed(3)}</td>
                  <td className="py-2 pl-4 text-center">{r.branching_factor.toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

