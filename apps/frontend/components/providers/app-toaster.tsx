"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "border-border bg-card text-foreground shadow-card backdrop-blur-sm",
          title: "font-medium text-foreground",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
