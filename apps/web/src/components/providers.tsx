"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { TRPCReactProvider } from "@/trpc/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={{ cssLayerName: "clerk" }}>
      <TRPCReactProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
        </NextThemesProvider>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
