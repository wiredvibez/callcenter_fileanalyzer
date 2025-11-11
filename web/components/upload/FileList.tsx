"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface FileListProps {
  files: File[];
  onRemove?: (index: number) => void;
}

export default function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Files ({files.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded border p-2"
            >
              <div className="flex-1">
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatSize(file.size)}
                </div>
              </div>
              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="ml-2 rounded p-1 hover:bg-red-100 text-red-600"
                  title="Remove file"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

