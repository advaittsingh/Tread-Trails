"use client";

import { Download } from "lucide-react";

import { downloadCsv, rowsToCsv } from "@/lib/admin/csv";

import { Button } from "@/components/ui/button";

type Props = {
  filename: string;
  headers: string[];
  rows: unknown[][];
  disabled?: boolean;
};

export function AdminExportButton({
  filename,
  headers,
  rows,
  disabled,
}: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || rows.length === 0}
      className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
      onClick={() => downloadCsv(filename, rowsToCsv(headers, rows))}
    >
      <Download className="mr-2 size-4" />
      Export CSV
    </Button>
  );
}
