import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anmelden | shortr.ch",
};

export default function AnmeldenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
