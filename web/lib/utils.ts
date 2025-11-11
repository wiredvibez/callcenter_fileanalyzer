export function analyticsPath(file: string) {
  // Resolve ../analytics relative to the Next.js project root
  return require("path").resolve(process.cwd(), "..", "analytics", file);
}

export async function readJson<T = unknown>(file: string): Promise<T> {
  const fs = await import("node:fs/promises");
  const p = analyticsPath(file);
  const data = await fs.readFile(p, "utf-8");
  return JSON.parse(data) as T;
}


