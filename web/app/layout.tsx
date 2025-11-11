import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";
import { Suspense } from "react";

const rubik = Rubik({ 
  subsets: ["latin", "hebrew"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "לוח בקרת ניתוח שיחות",
  description: "לוח בקרת ניתוח עץ החלטות"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" className={rubik.className}>
      <body>
        <div className="flex min-h-screen">
          <Suspense fallback={<div className="w-64 border-r" />}>
            <Sidebar />
          </Suspense>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}



