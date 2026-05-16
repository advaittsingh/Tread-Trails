"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { Car, Product } from "@/data/types";
import { useProductCatalog } from "@/contexts/product-catalog-context";
import { getCarBySlug } from "@/lib/vehicle";
import { formatInr } from "@/lib/format";
import { useSavedVehicles } from "@/contexts/saved-vehicles-context";
import { useWishlist } from "@/contexts/wishlist-context";

import { ProductCard } from "@/components/marketing/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { AccountChangePassword } from "@/components/account/account-change-password";
import { AccountProfileSettings } from "@/components/account/account-profile-settings";

type ApiOrder = {
  id: string;
  total: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  createdAt?: string;
  itemSummary: string;
  itemCount: number;
};

type ApiBooking = {
  id: string;
  service: string;
  vehicleName: string;
  date: string;
  time: string;
  status: string;
  createdAt?: string;
};

export function AccountDashboard() {
  const { getProductBySlug } = useProductCatalog();
  const {
    slugs: wishSlugs,
    isRemoteHydrating: wishlistHydrating,
    isMutationPending: wishlistMutationPending,
    remoteError: wishlistRemoteError,
    clearRemoteError: clearWishlistError,
  } = useWishlist();
  const { slugs: savedSlugs } = useSavedVehicles();

  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[] | null>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    setLedgerError(null);
    try {
      const [oRes, bRes] = await Promise.all([
        fetch("/api/orders/user", { credentials: "include" }),
        fetch("/api/bookings/user", { credentials: "include" }),
      ]);

      if (oRes.status === 401 || bRes.status === 401) {
        setLedgerError("Session expired — sign in again.");
        setOrders([]);
        setBookings([]);
        return;
      }

      if (!oRes.ok || !bRes.ok) {
        setLedgerError("Could not load orders or bookings.");
        setOrders([]);
        setBookings([]);
        return;
      }

      const oJson = (await oRes.json()) as { orders: ApiOrder[] };
      const bJson = (await bRes.json()) as { bookings: ApiBooking[] };
      setOrders(oJson.orders);
      setBookings(bJson.bookings);
    } catch {
      setLedgerError("Network error loading dashboard data.");
      setOrders([]);
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const wishlistProducts = wishSlugs
    .map((s) => getProductBySlug(s))
    .filter(Boolean) as Product[];

  const savedCars = savedSlugs
    .map((s) => getCarBySlug(s))
    .filter(Boolean)
    .slice(0, 12) as Car[];

  return (
    <Tabs defaultValue="profile" className="gap-8">
      <TabsList
        variant="line"
        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
      >
        <TabsTrigger
          value="profile"
          className="rounded-full border border-transparent px-4 py-2 data-active:border-primary/35 data-active:bg-primary/8"
        >
          Profile
        </TabsTrigger>
        <TabsTrigger
          value="orders"
          className="rounded-full border border-transparent px-4 py-2 data-active:border-primary/35 data-active:bg-primary/8"
        >
          Orders
        </TabsTrigger>
        <TabsTrigger
          value="bookings"
          className="rounded-full border border-transparent px-4 py-2 data-active:border-primary/35 data-active:bg-primary/8"
        >
          Bookings
        </TabsTrigger>
        <TabsTrigger
          value="vehicles"
          className="rounded-full border border-transparent px-4 py-2 data-active:border-primary/35 data-active:bg-primary/8"
        >
          Saved vehicles
        </TabsTrigger>
        <TabsTrigger
          value="wishlist"
          className="rounded-full border border-transparent px-4 py-2 data-active:border-primary/35 data-active:bg-primary/8"
        >
          Wishlist
        </TabsTrigger>
      </TabsList>

      {ledgerError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {ledgerError}
        </p>
      ) : null}

      <TabsContent value="profile" className="space-y-8">
        <p className="text-sm text-muted-foreground">
          Keep contact details current for studio confirmations and receipts. Preferred vehicle powers the global chassis selector when you&apos;re signed in.
        </p>
        <AccountProfileSettings />
        <AccountChangePassword />
      </TabsContent>

      <TabsContent value="orders" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Stripe-paid and COD requests tied to your login — synced from Neon (Postgres).
        </p>
        {orders === null ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
            No orders yet — explore{" "}
            <Link href="/products" className="text-primary underline-offset-4 hover:underline">
              products
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map((o) => (
              <Card key={o.id} className="border-border/70 shadow-card">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle as="h2" className="font-heading text-lg tracking-tight">
                    {o.id.slice(-8).toUpperCase()}
                  </CardTitle>
                  <Badge variant="secondary" className="rounded-full capitalize">
                    {o.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{o.itemSummary}</p>
                  <p className="font-medium text-foreground tabular-nums">
                    {formatInr(o.total)}
                  </p>
                  <p className="text-xs uppercase tracking-wide">
                    {o.paymentMethod === "cod"
                      ? "Cash on delivery"
                      : o.paymentMethod === "stripe"
                        ? "Stripe Checkout"
                        : o.paymentMethod}
                  </p>
                  {o.createdAt ? (
                    <p className="text-xs">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="bookings" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Installation requests captured via the booking wizard — studio confirmation follows separately.
        </p>
        {bookings === null ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
            No bookings — schedule a bay via{" "}
            <Link href="/booking" className="text-primary underline-offset-4 hover:underline">
              booking
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bookings.map((b) => (
              <Card key={b.id} className="border-border/70 shadow-card">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle as="h2" className="font-heading text-lg tracking-tight">
                    {b.service}
                  </CardTitle>
                  <Badge variant="outline" className="rounded-full border-primary/25 capitalize">
                    {b.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p className="text-foreground">
                    {b.date} · {b.time}
                  </p>
                  <p>{b.vehicleName}</p>
                  {b.createdAt ? (
                    <p className="text-xs">
                      Requested {new Date(b.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="vehicles" className="space-y-6">
        {savedCars.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
            Save platforms while browsing{" "}
            <Link href="/vehicles" className="text-primary underline-offset-4 hover:underline">
              vehicles
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedCars.map((c) => (
              <Link
                key={c.slug}
                href={`/vehicle/${c.slug}`}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-card transition hover:border-primary/35 hover:shadow-card-hover"
              >
                <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
                  {c.category}
                </p>
                <p className="mt-2 font-heading text-xl tracking-tight">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="wishlist" className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Saved items sync to your account when signed in — guests keep a device-only list until login merges it.
        </p>

        {wishlistRemoteError ? (
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span>{wishlistRemoteError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/35 text-destructive hover:bg-destructive/15"
              onClick={() => clearWishlistError()}
            >
              Dismiss
            </Button>
          </div>
        ) : null}

        {wishlistHydrating ? (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-[380px] rounded-2xl" />
            <Skeleton className="h-[380px] rounded-2xl sm:block hidden" />
            <Skeleton className="h-[380px] rounded-2xl xl:block hidden" />
          </div>
        ) : wishlistProducts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
            Tap the heart on any product card to curate your upgrade shortlist.
            {wishlistMutationPending ? (
              <span className="mt-2 block text-xs text-muted-foreground/90">
                Updating…
              </span>
            ) : null}
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {wishlistProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
