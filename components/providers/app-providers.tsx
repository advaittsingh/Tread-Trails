"use client";

import type { ReactNode } from "react";

import { ConfirmationProvider } from "@/contexts/confirmation-context";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { SavedVehiclesProvider } from "@/contexts/saved-vehicles-context";
import { SelectedVehicleProvider } from "@/contexts/selected-vehicle-context";
import { CompareProvider } from "@/contexts/compare-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { CartTelemetrySync } from "@/components/telemetry/cart-telemetry-sync";
import { SiteTelemetry } from "@/components/telemetry/site-telemetry";
import { AppToaster } from "@/components/providers/app-toaster";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ConfirmationProvider>
        <AppToaster />
        <CartProvider>
          <CartTelemetrySync />
          <WishlistProvider>
            <CompareProvider>
              <SavedVehiclesProvider>
                <SelectedVehicleProvider>
                  <SiteTelemetry />
                  {children}
                </SelectedVehicleProvider>
              </SavedVehiclesProvider>
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </ConfirmationProvider>
    </AuthProvider>
  );
}
