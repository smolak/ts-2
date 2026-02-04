import { SignedInLayout } from "@/components/signed-in-layout";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SignedInLayout>{children}</SignedInLayout>;
}
