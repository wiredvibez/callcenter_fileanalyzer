import { readJson } from "../../lib/utils";
import ExplorerClient from "./ExplorerClient";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

type BranchEntry = { child: number; count: number; text: string };
type NodeFunnel = { reach: number; transitions: number; drop_off: number };

export default async function Page() {
  // Load the precomputed top-10 branch distribution per node
  const branches = await readJson<Record<string, BranchEntry[]>>("branch_distribution.top10.json").catch(() => ({}));
  const nodeFunnel = await readJson<Record<string, NodeFunnel>>("node_funnel.json").catch(() => ({}));
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


