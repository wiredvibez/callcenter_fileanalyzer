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
      // Generate a unique session ID for this upload batch
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('[DEBUG] Generated session ID:', sessionId);
      
      // Check if we're in production (has BLOB_READ_WRITE_TOKEN)
      const isProduction = typeof window !== 'undefined' && 
        window.location.hostname !== 'localhost';
      
      console.log('[DEBUG] Environment:', isProduction ? 'Production' : 'Development');
      console.log('[DEBUG] Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');

      let uploadedFiles;

      if (isProduction) {
        console.log('[DEBUG] Using production upload (direct to Blob)');
        // Production: Use client-side direct upload to Vercel Blob
        setProgress(5);
        
        // Import the upload function dynamically
        const { upload } = await import('@vercel/blob/client');
        console.log('[DEBUG] Loaded @vercel/blob/client');
        
        // Upload files directly to Blob storage
        const uploadPromises = files.map(async (file, index) => {
          console.log(`[DEBUG] Uploading file ${index + 1}/${files.length}: ${file.name}`);
          const blob = await upload(`${sessionId}/${file.name}`, file, {
            access: 'public',
            handleUploadUrl: '/api/upload-token',
          });
          console.log(`[DEBUG] File ${file.name} uploaded to:`, blob.url);

          // Update progress based on file upload completion
          setProgress(10 + (index + 1) * (20 / files.length));

          return {
            name: file.name,
            url: blob.url,
            size: file.size,
          };
        });

        uploadedFiles = await Promise.all(uploadPromises);
        console.log('[DEBUG] All files uploaded:', uploadedFiles);
        setProgress(30);

        // Create session with uploaded file metadata
        console.log('[DEBUG] Creating session with file metadata');
        const sessionResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ files: uploadedFiles }),
        });

        console.log('[DEBUG] Session creation response status:', sessionResponse.status);
        if (!sessionResponse.ok) {
          const errorText = await sessionResponse.text();
          console.error('[DEBUG] Session creation failed:', errorText);
          throw new Error("יצירת הסשן נכשלה");
        }

        const sessionData = await sessionResponse.json();
        console.log('[DEBUG] Session created:', sessionData);
        const { sessionId: createdSessionId } = sessionData;
        
        // Start processing
        console.log('[DEBUG] Starting processing for session:', createdSessionId);
        const processResponse = await fetch("/api/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: createdSessionId }),
        });

        console.log('[DEBUG] Process response status:', processResponse.status);
        if (!processResponse.ok) {
          const errorText = await processResponse.text();
          console.error('[DEBUG] Processing failed:', errorText);
          throw new Error("העיבוד נכשל");
        }

        const processData = await processResponse.json();
        console.log('[DEBUG] Processing completed:', processData);
        setProgress(100);

        // Redirect to analytics
        console.log('[DEBUG] Redirecting to analytics page');
        setTimeout(() => {
          router.push(`/analytics/${createdSessionId}`);
        }, 500);
      } else {
        console.log('[DEBUG] Using development upload (FormData)');
        // Development: Use FormData upload (for small files in dev)
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
      }
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
              <li>הנתונים שלך יעובדו במקום ולא נשמרים לטווח הארוך</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

