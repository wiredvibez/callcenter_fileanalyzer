import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { readJson } from "../lib/utils";
import { Suspense } from "react";
import SummaryCharts from "./summary-charts";
import ExplorerClient from "./path-explorer/ExplorerClient";

async function getSummary() {
  const summary = await readJson<any>("summary.json").catch(() => ({}));
  return summary || {};
}

type BranchEntry = { child: number; count: number; text: string };
type NodeFunnel = { reach: number; transitions: number; drop_off: number };

export default async function Page() {
  const summary = await getSummary();
  const lengths = summary.lengths_summary || {};
  const intents = summary.top_intents_top10 || [];
  const weekday = summary.weekday_trends || {};
  const branches = await readJson<Record<string, BranchEntry[]>>("branch_distribution.top10.json").catch(() => ({}));
  const nodeFunnel = await readJson<Record<string, NodeFunnel>>("node_funnel.json").catch(() => ({}));
  const totalCalls = lengths.count ?? 0;
  const topIntent = intents[0];
  const topIntentCount = topIntent?.count ?? 0;
  const topIntentPct = totalCalls ? ((topIntentCount / totalCalls) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Summary</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Calls</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{lengths.count ?? "-"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Path Length</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {lengths.avg !== undefined ? lengths.avg.toFixed(2) : "-"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold break-words">{topIntent?.text ?? "-"}</div>
            <div className="text-sm text-muted-foreground">
              {topIntentPct !== null ? `${topIntentPct}% (${topIntentCount})` : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>P95 Path Length</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{lengths.p95 ?? "-"}</CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Loading charts…</div>}>
        <SummaryCharts intents={intents} weekday={weekday} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Path Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <ExplorerClient branches={branches} nodeFunnel={nodeFunnel} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader dir="rtl">
          <CardTitle>מגבלות הניתוח</CardTitle>
        </CardHeader>
        <CardContent dir="rtl">
          <ul className="space-y-4 text-sm" dir="rtl">
            <li className="space-y-1">
              <div className="font-semibold">לא תועד בנתונים - חזרה לאחור בשיחה וכניסה למסלול אחר/מספר מסלולים באותה שיחה</div>
              <div className="text-muted-foreground pr-4">נדרש: מעקב אחר כל פעולת ניווט (קדימה/אחורה), שמירת היסטוריית מסלולים מלאה לכל שיחה, זיהוי של מסלולים מרובים באותה שיחה</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">לא כולל פירוט על בסיס שעות לאורך היממה</div>
              <div className="text-muted-foreground pr-4">נדרש: שדה זמן מדויק (שעה:דקה) לכל אירוע/מעבר, אגרגציה לפי שעות (0-23) לניתוח דפוסים יומיים</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">ללא מעקב זמנים (כמה זמן בין המעברים בין השלבים ברצף השיחה)</div>
              <div className="text-muted-foreground pr-4">נדרש: חותמת זמן (timestamp) לכל מעבר/אירוע, חישוב משך זמן בין אירועים, זיהוי נקודות עיכוב ארוכות</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">ללא מידע על תוצאות השיחה (האם נפתרה, שביעות רצון, סטטוס סיום)</div>
              <div className="text-muted-foreground pr-4">נדרש: סטטוס סיום שיחה (נפתר/לא נפתר/הועבר), דירוג שביעות רצון, סיבת סגירה, תוצאה סופית</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">ללא קישור לנתוני לקוח/מנוי (גיל, מיקום, היסטוריה קודמת)</div>
              <div className="text-muted-foreground pr-4">נדרש: מזהה לקוח/מנוי ייחודי, נתונים דמוגרפיים (גיל, מיקום), היסטוריית שיחות קודמות, סטטוס מנוי</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">ללא מעקב אחר שיחות חוזרות מאותו לקוח/מספר</div>
              <div className="text-muted-foreground pr-4">נדרש: מזהה לקוח/מספר טלפון, קישור בין שיחות מאותו מקור, ניתוח תדירות שיחות חוזרות</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">ללא ניתוח של סיבות נטישה/הפסקת שיחה באמצע</div>
              <div className="text-muted-foreground pr-4">נדרש: זיהוי נקודות נטישה (איפה בשיחה), סיבת נטישה (משתמש/טכני), זמן עד נטישה, שלב אחרון לפני נטישה</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">ללא מידע על עומס בזמן אמת או תורים/המתנה</div>
              <div className="text-muted-foreground pr-4">נדרש: זמן המתנה לפני תחילת שיחה, מספר שיחות ממתינות, זמן טיפול ממוצע, עומס מערכת בזמן אמת</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">ללא קישור לנתוני ביצועים של נציגים/מפעילים</div>
              <div className="text-muted-foreground pr-4">נדרש: מזהה נציג/מפעיל לכל שיחה, זמן טיפול, מספר שיחות, דירוג ביצועים, סוג טיפול</div>
            </li>
            <li className="space-y-1">
              <div className="font-semibold">ללא ניתוח של שגיאות טכניות או בעיות במערכת</div>
              <div className="text-muted-foreground pr-4">נדרש: לוג שגיאות, זיהוי תקלות טכניות, זמן השבתה, סוגי שגיאות, השפעה על זרימת השיחה</div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


