import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

type CartRow = {
  sessionId: string;
  itemCount: number;
  subtotalHint: number;
  userEmail: string | null;
  customerName: string | null;
  lastPath: string;
  updatedAt: string;
  lines: Array<{ name: string; quantity: number; unitPrice: number | null }>;
  recovery: {
    sentAt: string | null;
    recovered: boolean;
    converted: boolean;
    convertedAt: string | null;
  };
  lastActivityMinutes: number;
};

type CartsResponse = {
  carts: CartRow[];
  total: number;
  page: number;
  totalPages: number;
};

export default function CartsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");
  const [selected, setSelected] = useState<CartRow | null>(null);

  const q = useAdminQuery<CartsResponse>("/api/admin/carts", {
    page,
    limit: 25,
    search: search || undefined,
    view: view === "all" ? undefined : view,
  });

  const recoverMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetchJson<{ whatsappUrl?: string }>("/api/admin/carts/recover", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Recovery action completed" });
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank");
    },
    onError: (e: Error) =>
      toast({ title: "Recovery failed", description: e.message, variant: "destructive" }),
  });

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search email, name, session…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select value={view} onValueChange={(v) => { setView(v); setPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All carts</SelectItem>
              <SelectItem value="recoverable">Recoverable</SelectItem>
              <SelectItem value="emailed">Emailed</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardContent className="px-3 lg:px-6 pb-6 space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-stone-600">Loading…</p>
        ) : (q.data?.carts ?? []).length === 0 ? (
          <p className="text-sm text-stone-600">No abandoned carts.</p>
        ) : (
          q.data!.carts.map((cart) => (
            <button
              key={cart.sessionId}
              type="button"
              onClick={() => setSelected(cart)}
              className="w-full text-left rounded-lg border border-stone-200 p-4 hover:bg-stone-50"
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">
                  {cart.customerName ?? cart.userEmail ?? cart.sessionId.slice(0, 12)}
                </span>
                <Badge variant="secondary">{cart.itemCount} items</Badge>
              </div>
              <p className="text-sm text-stone-600">
                ₹{cart.subtotalHint.toLocaleString()} · {cart.lastActivityMinutes}m ago
              </p>
              {cart.recovery.sentAt ? (
                <Badge className="mt-1">Recovery emailed</Badge>
              ) : null}
            </button>
          ))
        )}
      </CardContent>

      {q.data ? (
        <AdminPagination
          page={q.data.page}
          totalPages={q.data.totalPages}
          total={q.data.total}
          onPageChange={setPage}
        />
      ) : null}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Cart recovery</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <p><span className="text-stone-500">Customer:</span> {selected.customerName ?? "—"}</p>
                <p><span className="text-stone-500">Email:</span> {selected.userEmail ?? "—"}</p>
                <p><span className="text-stone-500">Session:</span> {selected.sessionId}</p>
                <p><span className="text-stone-500">Last path:</span> {selected.lastPath}</p>

                <ul className="border rounded-md divide-y">
                  {selected.lines.map((line, i) => (
                    <li key={i} className="p-2 flex justify-between">
                      <span>{line.name} × {line.quantity}</span>
                      {line.unitPrice != null ? (
                        <span>₹{line.unitPrice.toLocaleString()}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!selected.userEmail || recoverMut.isPending}
                    onClick={() =>
                      recoverMut.mutate({
                        sessionId: selected.sessionId,
                        action: "email",
                        template: "cart_waiting",
                      })
                    }
                  >
                    Send recovery email
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={recoverMut.isPending}
                    onClick={() =>
                      recoverMut.mutate({
                        sessionId: selected.sessionId,
                        action: "whatsapp",
                      })
                    }
                  >
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={recoverMut.isPending}
                    onClick={() =>
                      recoverMut.mutate({
                        sessionId: selected.sessionId,
                        action: "mark_recovered",
                      })
                    }
                  >
                    Mark recovered
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
