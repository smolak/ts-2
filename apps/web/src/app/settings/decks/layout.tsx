import type { Metadata } from "next";

import { SignedInLayout } from "@/components/signed-in-layout";

export const metadata: Metadata = {
  title: "Decks Settings | LinkDeck",
  description: "Manage your decks - create, edit, and organize your curated link collections.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SignedInLayout>{children}</SignedInLayout>;
}
