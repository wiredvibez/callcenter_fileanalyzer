import { readJson } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import TopIntentsChart from "./top-intents-chart";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await readJson<any[]>("top_intents.json").catch(() => []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Top Intents</h1>
      <Card>
        <CardHeader>
          <CardTitle>Most frequent intents</CardTitle>
        </CardHeader>
        <CardContent>
          <TopIntentsChart data={data.slice(0, 50)} />
        </CardContent>
      </Card>
      <div className="text-sm text-muted-foreground">Showing top 50 by frequency.</div>
    </div>
  );
}


