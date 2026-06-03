import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = Record<string, unknown>;

function stringify(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return v.toISOString();
  return JSON.stringify(v);
}

export function AdminDataTable({
  rows,
  columns,
  emptyText = "No records.",
  onRowClick,
}: {
  rows: Row[];
  columns: Array<{ key: string; label: string }>;
  emptyText?: string;
  onRowClick?: (row: Row) => void;
}) {
  return (
    <CardContent className="px-3 lg:px-6 pb-6">
      {rows.length === 0 ? (
        <div className="text-sm text-stone-600">{emptyText}</div>
      ) : (
        <div className="overflow-auto rounded-lg border border-stone-200">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow
                  key={idx}
                  className={onRowClick ? "cursor-pointer hover:bg-stone-50" : undefined}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} className="whitespace-nowrap">
                      {stringify(r[c.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  );
}

