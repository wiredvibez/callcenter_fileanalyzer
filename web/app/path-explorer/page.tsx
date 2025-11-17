'use client';

import { useEffect, useState } from "react";
import ExplorerClient from "./ExplorerClient";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

type BranchEntry = { child: number; count: number; text: string };
type NodeFunnel = { reach: number; transitions: number; drop_off: number };

export default function Page() {
  const [branches, setBranches] = useState<Record<string, BranchEntry[]>>({});
  const [nodeFunnel, setNodeFunnel] = useState<Record<string, NodeFunnel>>({});
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      setBranches(analytics.branch_distribution || {});
      setNodeFunnel(analytics.node_funnel || {});
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Path Explorer</h1>
      <Card>
        <CardHeader>
          <CardTitle>Drill down from the root to see usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ExplorerClient branches={branches} nodeFunnel={nodeFunnel} />
        </CardContent>
      </Card>
    </div>
  );
}


