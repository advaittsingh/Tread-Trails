import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

type UserDetail = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  preferredVehicleSlug: string | null;
  sessionInvalidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  counts: {
    orders: number;
    bookings: number;
    wishlistProducts: number;
    savedVehicles: number;
  };
  orders: Array<{
    id: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }>;
  bookings: Array<{
    id: string;
    vehicleName: string;
    service: string;
    status: string;
    date: string;
    time: string;
    createdAt: string;
  }>;
  wishlist: Array<{
    productSlug: string;
    name: string;
    createdAt: string;
  }>;
  savedVehicles: Array<{
    vehicleSlug: string;
    name: string;
    createdAt: string;
  }>;
};

type UserDetailResponse = {
  user: UserDetail;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "suspended") return "destructive";
  return "secondary";
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200 overflow-hidden">
      <div className="border-b border-stone-200 px-4 py-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        {count != null ? (
          <span className="text-xs text-stone-500">{count}</span>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useAdminQuery<UserDetailResponse>(
    `/api/admin/users/${id ?? ""}`,
    undefined,
    { enabled: Boolean(id) }
  );

  const user = q.data?.user;
  const [role, setRole] = useState("user");

  useEffect(() => {
    if (user) setRole(user.role);
  }, [user]);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin"] });

  const actionMut = useMutation({
    mutationFn: (path: string) =>
      apiFetchJson(path, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Action completed" });
    },
    onError: (e: Error) =>
      toast({ title: "Action failed", description: e.message, variant: "destructive" }),
  });

  const roleMut = useMutation({
    mutationFn: (nextRole: string) =>
      apiFetchJson(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Role updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Role update failed", description: e.message, variant: "destructive" }),
  });

  if (!id) {
    return (
      <CardContent className="px-3 lg:px-6 pb-6">
        <p className="text-sm text-stone-600">Missing user ID.</p>
      </CardContent>
    );
  }

  if (q.isLoading) {
    return (
      <CardContent className="px-3 lg:px-6 pb-6">
        <p className="text-sm text-stone-600">Loading user…</p>
      </CardContent>
    );
  }

  if (q.error || !user) {
    return (
      <CardContent className="px-3 lg:px-6 pb-6 space-y-3">
        <Link to="/users" className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900">
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <p className="text-sm text-red-700">
          {(q.error as Error)?.message ?? "User not found."}
        </p>
      </CardContent>
    );
  }

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/users"
            className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-900">{user.name}</span>
            <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
            <Badge variant="outline">{user.role}</Badge>
          </div>
        </div>
      </CardContent>

      <CardContent className="px-3 lg:px-6 pb-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Section title="Profile">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-stone-500">Name</dt>
                  <dd className="text-stone-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Email</dt>
                  <dd className="text-stone-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Phone</dt>
                  <dd className="text-stone-900">{user.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Preferred vehicle</dt>
                  <dd className="text-stone-900">{user.preferredVehicleSlug || "—"}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Member since</dt>
                  <dd className="text-stone-900">{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">User ID</dt>
                  <dd className="font-mono text-xs text-stone-700 break-all">{user.id}</dd>
                </div>
              </dl>
            </Section>

            <Section title="Orders" count={user.counts.orders}>
              {user.orders.length === 0 ? (
                <p className="text-sm text-stone-500">No orders.</p>
              ) : (
                <div className="overflow-auto -mx-4 px-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            <Link
                              to={`/orders/${o.id}`}
                              className="font-mono text-xs text-stone-800 hover:underline"
                            >
                              {o.id.slice(0, 8)}…
                            </Link>
                          </TableCell>
                          <TableCell>{o.status}</TableCell>
                          <TableCell className="uppercase text-xs">{o.paymentMethod}</TableCell>
                          <TableCell>{formatMoney(o.total)}</TableCell>
                          <TableCell className="text-xs text-stone-500">
                            {formatDate(o.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Section>

            <Section title="Bookings" count={user.counts.bookings}>
              {user.bookings.length === 0 ? (
                <p className="text-sm text-stone-500">No bookings.</p>
              ) : (
                <div className="overflow-auto -mx-4 px-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>When</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.bookings.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>{b.vehicleName}</TableCell>
                          <TableCell>{b.service}</TableCell>
                          <TableCell className="text-xs">
                            {b.date} {b.time}
                          </TableCell>
                          <TableCell>{b.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Section>

            <Section title="Wishlist" count={user.counts.wishlistProducts}>
              {user.wishlist.length === 0 ? (
                <p className="text-sm text-stone-500">Wishlist is empty.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {user.wishlist.map((item) => (
                    <li key={item.productSlug} className="flex justify-between gap-2">
                      <span className="text-stone-900">{item.name}</span>
                      <span className="font-mono text-xs text-stone-500">{item.productSlug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Saved vehicles" count={user.counts.savedVehicles}>
              {user.savedVehicles.length === 0 ? (
                <p className="text-sm text-stone-500">No saved vehicles.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {user.savedVehicles.map((item) => (
                    <li key={item.vehicleSlug} className="flex justify-between gap-2">
                      <span className="text-stone-900">{item.name}</span>
                      <span className="font-mono text-xs text-stone-500">{item.vehicleSlug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-stone-200 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-stone-900">User actions</h2>

              {user.status === "active" ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={actionMut.isPending}
                  onClick={() => actionMut.mutate(`/api/admin/users/${id}/suspend`)}
                >
                  Suspend user
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={actionMut.isPending}
                  onClick={() => actionMut.mutate(`/api/admin/users/${id}/activate`)}
                >
                  Activate user
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full"
                disabled={actionMut.isPending}
                onClick={() => actionMut.mutate(`/api/admin/users/${id}/reset-password`)}
              >
                Send password reset email
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                disabled={actionMut.isPending}
                onClick={() => actionMut.mutate(`/api/admin/users/${id}/force-logout`)}
              >
                Force logout
              </Button>

              {user.sessionInvalidatedAt ? (
                <p className="text-xs text-stone-500">
                  Sessions invalidated {formatDate(user.sessionInvalidatedAt)}
                </p>
              ) : null}
            </section>

            <section className="rounded-lg border border-stone-200 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-stone-900">Change role</h2>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={role === user.role || roleMut.isPending}
                onClick={() => roleMut.mutate(role)}
              >
                Save role
              </Button>
              <p className="text-xs text-stone-500">
                Changing role signs the user out of all active sessions.
              </p>
            </section>
          </div>
        </div>
      </CardContent>
    </>
  );
}
