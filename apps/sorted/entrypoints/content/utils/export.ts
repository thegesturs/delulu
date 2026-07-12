/**
 * Export utilities for reel data (JSON, CSV, Excel)
 */
/** biome-ignore-all lint/performance/useTopLevelRegex: one-off regexes used only during export formatting */

// biome-ignore lint/performance/noNamespaceImport: xlsx is only available as a namespace import
import * as XLSX from "xlsx";
import type { ExportFormat, ReelData } from "../../shared/types";

interface ReelRow {
  Rank: number;
  "Reel ID": string;
  URL: string;
  "Thumbnail URL": string;
  Views: number | string;
  Likes: number | string;
  Comments: number | string;
  "Video URL": string;
  "Scraped At": string;
}

function reelsToRows(reels: ReelData[]): ReelRow[] {
  return reels.map((reel, index) => ({
    Rank: index + 1,
    "Reel ID": reel.id,
    URL: reel.url,
    "Thumbnail URL": reel.thumbnailUrl,
    Views: reel.metrics.views ?? "N/A",
    Likes: reel.metrics.likes ?? "N/A",
    Comments: reel.metrics.comments ?? "N/A",
    "Video URL": reel.videoUrl ?? "",
    "Scraped At": new Date(reel.scrapedAt).toISOString(),
  }));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getFilenameBase(): string {
  const match = window.location.pathname.match(/^\/([^/]+)/);
  const username = match ? match[1] : "reels";
  const date = new Date().toISOString().split("T")[0];
  return `sorted-${username}-${date}`;
}

function exportToJSON(reels: ReelData[]) {
  const rows = reelsToRows(reels);
  const json = JSON.stringify(rows, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, `${getFilenameBase()}.json`);
}

function exportToCSV(reels: ReelData[]) {
  const rows = reelsToRows(reels);
  if (rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]) as (keyof ReelRow)[];
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h]);
          // Escape values containing commas, quotes, or newlines
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(",")
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
  downloadBlob(blob, `${getFilenameBase()}.csv`);
}

function exportToExcel(reels: ReelData[]) {
  const rows = reelsToRows(reels);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 6 }, // Rank
    { wch: 14 }, // Reel ID
    { wch: 40 }, // URL
    { wch: 40 }, // Thumbnail URL
    { wch: 10 }, // Views
    { wch: 10 }, // Likes
    { wch: 10 }, // Comments
    { wch: 40 }, // Video URL
    { wch: 22 }, // Scraped At
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reels");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `${getFilenameBase()}.xlsx`);
}

export function handleExport(format: ExportFormat, reels: ReelData[]) {
  if (reels.length === 0) {
    return;
  }

  switch (format) {
    case "json":
      exportToJSON(reels);
      break;
    case "csv":
      exportToCSV(reels);
      break;
    case "xlsx":
      exportToExcel(reels);
      break;
    default:
      exportToJSON(reels);
      break;
  }
}
