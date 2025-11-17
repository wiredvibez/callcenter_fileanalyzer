"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "../components/upload/FileUpload";
import FileList from "../components/upload/FileList";
import ProgressBar from "../components/upload/ProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

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
    console.log('[DEBUG] Upload started');
    console.log('[DEBUG] Files to upload:', files.length, files.map(f => f.name));
    
    if (files.length === 0) {
      setError("אנא בחר לפחות קובץ CSV אחד");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      console.log('[DEBUG] Creating FormData with files');
      const formData = new FormData();
      files.forEach((file) => {
        console.log('[DEBUG] Adding file to FormData:', file.name, `(${file.size} bytes)`);
        formData.append("files", file);
      });

      setProgress(10);
      console.log('[DEBUG] Uploading files via /api/upload');
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log('[DEBUG] Upload response status:', uploadResponse.status);
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[DEBUG] Upload failed:', errorText);
        throw new Error("ההעלאה נכשלה");
      }

      const uploadData = await uploadResponse.json();
      console.log('[DEBUG] Upload response:', uploadData);
      const { sessionId: createdSessionId } = uploadData;
      console.log('[DEBUG] Created session ID:', createdSessionId);
      setProgress(30);

      // Start processing
      console.log('[DEBUG] Starting processing for session:', createdSessionId);
      console.log('[DEBUG] Calling POST /api/process with sessionId:', createdSessionId);
      const processResponse = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: createdSessionId }),
      });

      console.log('[DEBUG] Process response status:', processResponse.status);
      console.log('[DEBUG] Process response ok:', processResponse.ok);
      
      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('[DEBUG] Processing failed with status:', processResponse.status);
        console.error('[DEBUG] Error response:', errorText);
        throw new Error(`העיבוד נכשל: ${errorText}`);
      }

      const processData = await processResponse.json();
      console.log('[DEBUG] Processing completed:', processData);
      setProgress(100);

      // Redirect to analytics
      console.log('[DEBUG] Redirecting to analytics page:', `/analytics/${createdSessionId}`);
      setTimeout(() => {
        router.push(`/analytics/${createdSessionId}`);
      }, 500);
    } catch (err) {
      console.error('[DEBUG] Upload error caught:', err);
      console.error('[DEBUG] Error stack:', err instanceof Error ? err.stack : 'N/A');
      setError(err instanceof Error ? err.message : "אירעה שגיאה");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            ניתוח קול סנטר 
          </h1>
          <p className="text-xl text-gray-600">
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
          <Card>
            <CardContent className="py-6">
              <button
                onClick={handleUpload}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                עבד {files.length} {files.length > 1 ? "קבצים" : "קובץ"}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        {uploading && (
          <Card>
            <CardHeader>
              <CardTitle>מעבד...</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBar
                progress={progress}
                label="מעלה ומנתח את הקבצים שלך"
              />
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>דרישות</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>קבצי CSV עם נתוני אינטראקציות מוקד טלפוני</li>
              <li>עמודות נדרשות: call_id, call_date, rule_id, rule_parent_id, rule_text, popUpURL</li>
              <li>ניתן להעלות מספר קבצים</li>
              <li>הנתונים שלך יישארו בזיכרון בזמן ריצה בלבד - אם תרענן את הדף, תצטרך להעלות שוב</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
