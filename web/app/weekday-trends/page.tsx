import { readJson } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import WeekdayChart from "./weekday-chart";

export default async function Page() {
  const wd = await readJson<Record<string, number>>("weekday_trends.json").catch(() => ({}));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Weekday Trends</h1>
      <Card>
        <CardHeader>
          <CardTitle>Calls by weekday (1=Mon .. 7=Sun)</CardTitle>
        </CardHeader>
        <CardContent>
          <WeekdayChart data={wd} />
        </CardContent>
      </Card>
    </div>
  );
}


