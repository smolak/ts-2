import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@repo/ui/global.css";
import { Providers } from "@/components/providers";
import { CheckUserOnboarding } from "@/features/user-profile/ui/check-user-onboarding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkDeck - Discover, Organize & Share Links Socially",
  description:
    "Discover, organize, and share links socially. Follow curated decks and build your personal link library.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} background-background min-h-full antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <CheckUserOnboarding>{children}</CheckUserOnboarding>
        </Providers>
      </body>
    </html>
  );
}
