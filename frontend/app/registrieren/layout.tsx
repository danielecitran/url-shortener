import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrieren | shortr.ch",
};

export default function RegistrierenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
