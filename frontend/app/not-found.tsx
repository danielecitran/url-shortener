import type { Metadata } from "next";
import CosmicNotFound from "@/components/cosmic-404";

export const metadata: Metadata = {
  title: "404 Fehler: Seite nicht gefunden | shortr.ch",
};

export default function NotFoundPage() {
  return (
    <>
      <style>{`
        header, footer {
          display: none !important;
        }
      `}</style>
      <div className="dark min-h-screen bg-[#030303] text-white">
        <CosmicNotFound />
      </div>
    </>
  );
}
