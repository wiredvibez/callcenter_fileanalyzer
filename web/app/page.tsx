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
    if (files.length === 0) {
      setError("Please select at least one CSV file");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Generate a unique session ID for this upload batch
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if we're in production (has BLOB_READ_WRITE_TOKEN)
      const isProduction = typeof window !== 'undefined' && 
        window.location.hostname !== 'localhost';

      let uploadedFiles;

      if (isProduction) {
        // Production: Use client-side direct upload to Vercel Blob
        setProgress(5);
        
        // Import the upload function dynamically
        const { upload } = await import('@vercel/blob/client');
        
        // Upload files directly to Blob storage
        const uploadPromises = files.map(async (file, index) => {
          const blob = await upload(`${sessionId}/${file.name}`, file, {
            access: 'public',
            handleUploadUrl: '/api/upload-token',
          });

          // Update progress based on file upload completion
          setProgress(10 + (index + 1) * (20 / files.length));

          return {
            name: file.name,
            url: blob.url,
            size: file.size,
          };
        });

        uploadedFiles = await Promise.all(uploadPromises);
        setProgress(30);

        // Create session with uploaded file metadata
        const sessionResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ files: uploadedFiles }),
        });

        if (!sessionResponse.ok) {
          throw new Error("Session creation failed");
        }

        const { sessionId: createdSessionId } = await sessionResponse.json();
        
        // Start processing
        const processResponse = await fetch("/api/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: createdSessionId }),
        });

        if (!processResponse.ok) {
          throw new Error("Processing failed");
        }

        setProgress(100);

        // Redirect to analytics
        setTimeout(() => {
          router.push(`/analytics/${createdSessionId}`);
        }, 500);
      } else {
        // Development: Use FormData upload (for small files in dev)
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });

        setProgress(10);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        const { sessionId: createdSessionId } = await uploadResponse.json();
        setProgress(30);

        // Start processing
        const processResponse = await fetch("/api/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: createdSessionId }),
        });

        if (!processResponse.ok) {
          throw new Error("Processing failed");
        }

        setProgress(100);

        // Redirect to analytics
        setTimeout(() => {
          router.push(`/analytics/${createdSessionId}`);
        }, 500);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Call Center Analytics
          </h1>
          <p className="text-xl text-gray-600">
            Upload your CSV files to analyze call center interactions
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
                Process {files.length} file{files.length > 1 ? "s" : ""}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        {uploading && (
          <Card>
            <CardHeader>
              <CardTitle>Processing...</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBar
                progress={progress}
                label="Uploading and analyzing your files"
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
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>CSV files with call center interaction data</li>
              <li>Required columns: call_id, call_date, rule_id, rule_parent_id, rule_text, popUpURL</li>
              <li>Multiple files are supported</li>
              <li>Your data will be processed and stored securely</li>
              <li>You'll receive a shareable link to your analytics</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

