"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AbmeldenPage() {
  const { logout } = useAuth();

  useEffect(() => {
    const run = async () => {
      try {
        await logout();
      } finally {
        window.location.assign("/");
      }
    };

    void run();
  }, [logout]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
      <div className="inline-flex items-center gap-2 text-sm text-white/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        Abmeldung wird durchgeführt...
      </div>
    </main>
  );
}
