'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface NoDataMessageProps {
  message?: string;
}

/**
 * Component shown when no analytics data is available
 * Prompts user to upload CSV files
 */
export default function NoDataMessage({ message }: NoDataMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">אין נתונים זמינים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <svg
              className="w-20 h-20 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-muted-foreground" dir="rtl">
              {message || 'אנא העלה קבצי CSV כדי לצפות בניתוחים'}
            </p>
          </div>
          
          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              העלה קבצים
            </Link>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground text-center" dir="rtl">
              💡 הנתונים נשמרים רק בטאב הנוכחי ונמחקים בסגירתו
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

