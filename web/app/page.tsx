"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "../components/upload/FileUpload";
import FileList from "../components/upload/FileList";
import ProgressBar from "../components/upload/ProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { saveAnalytics } from "../lib/analytics-storage";

export default function HomePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    console.log('[UPLOAD] Upload started');
    console.log('[UPLOAD] Files to upload:', files.length, files.map(f => f.name));
    
    if (files.length === 0) {
      setError("אנא בחר לפחות קובץ CSV אחד");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      console.log('[UPLOAD] Creating FormData with files');
      const formData = new FormData();
      files.forEach((file) => {
        console.log('[UPLOAD] Adding file:', file.name, `(${file.size} bytes)`);
        formData.append("files", file);
      });

      setProgress(10);
      console.log('[UPLOAD] Calling combined API: /api/upload-and-process');
      
      const response = await fetch("/api/upload-and-process", {
        method: "POST",
        body: formData,
      });

      setProgress(50);
      console.log('[UPLOAD] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[UPLOAD] Processing failed:', errorData);
        throw new Error(errorData.error || "העיבוד נכשל");
      }

      const { analytics, summary } = await response.json();
      console.log('[UPLOAD] Processing completed successfully');
      console.log('[UPLOAD] Summary:', summary);
      
      setProgress(80);

      // Store analytics in browser sessionStorage (tab-specific)
      console.log('[UPLOAD] Storing analytics in sessionStorage');
      try {
        saveAnalytics(analytics);
        setProgress(100);
        console.log('[UPLOAD] Analytics saved to sessionStorage');

        // Redirect to summary page (no session ID needed!)
        console.log('[UPLOAD] Redirecting to summary page');
        setTimeout(() => {
          router.push('/summary');
        }, 500);
      } catch (storageError) {
        // Storage failed - show error and stay on upload page
        console.error('[UPLOAD] Failed to store analytics:', storageError);
        setError('הנתונים גדולים מדי. אנא נסה להעלות פחות קבצים.');
        setUploading(false);
      }
      
    } catch (err) {
      console.error('[UPLOAD] Error:', err);
      console.error('[UPLOAD] Error stack:', err instanceof Error ? err.stack : 'N/A');
      setError(err instanceof Error ? err.message : "אירעה שגיאה");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            ניתוח קול סנטר 
          </h1>
          <p className="text-gray-600">
            העלו קבצי CSV לניתוח אינטראקציות במוקד הטלפוני
          </p>
        </div>

        {/* Upload Area */}
        <FileUpload onFilesSelected={handleFilesSelected} />

        {/* File List */}
        {files.length > 0 && (
          <FileList files={files} onRemove={handleRemoveFile} />
        )}

        {/* Upload Button */}
        {files.length > 0 && !uploading && (
          <button
            onClick={handleUpload}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            עבד {files.length} {files.length > 1 ? "קבצים" : "קובץ"}
          </button>
        )}

        {/* Progress */}
        {uploading && (
          <Card>
            <CardContent className="py-4">
              <ProgressBar
                progress={progress}
                label="מעבד..."
              />
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="py-3">
              <p className="text-red-700 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Compact Info */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>הנתונים נשמרים בטאב הנוכחי בלבד וימחקו בסגירתו</p>
          <p>עמודות נדרשות: call_id, call_date, rule_id, rule_parent_id, rule_text</p>
        </div>
      </div>
    </div>
  );
}
