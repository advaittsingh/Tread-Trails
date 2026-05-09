"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { SavedVehiclesProvider } from "@/contexts/saved-vehicles-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { CartTelemetrySync } from "@/components/telemetry/cart-telemetry-sync";
import { SiteTelemetry } from "@/components/telemetry/site-telemetry";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <CartTelemetrySync />
        <WishlistProvider>
          <SavedVehiclesProvider>
            <SiteTelemetry />
            {children}
          </SavedVehiclesProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
