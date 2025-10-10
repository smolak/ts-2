"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { UserStoreProvider } from "@/features/user/store/user-store-provider";
import { TRPCReactProvider } from "@/trpc/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={{ cssLayerName: "clerk" }}>
      <TRPCReactProvider>
        <UserStoreProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
          </NextThemesProvider>
        </UserStoreProvider>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
