"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function BuyMeCoffeeWidget() {
  const { isAuthenticated, status } = useAuth();
  const pathname = usePathname();

  if (status !== "authenticated") return null;
  if (!isAuthenticated) return null;
  if (pathname !== "/") return null;

  return (
    <a
      href="https://buymeacoffee.com/danielecitran"
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-[18px] right-[18px] z-70 inline-flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white text-sm font-semibold text-black shadow-[0_14px_28px_rgba(0,0,0,0.28)] transition-[width,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width] hover:w-44 hover:bg-white/90 hover:shadow-[0_16px_32px_rgba(0,0,0,0.32)] focus-visible:w-44 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-label="Buy Me a Coffee Seite öffnen"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-[58px] group-focus-visible:-translate-x-[58px]"
      >
        <Image
          src="/coffee.svg"
          alt=""
          width={30}
          height={30}
          className="h-[30px] w-[30px]"
          aria-hidden="true"
        />
      </span>
      <span className="pointer-events-none absolute left-11 right-4 whitespace-nowrap text-left opacity-0 translate-x-1 transition-[opacity,transform] duration-200 delay-100 ease-out group-hover:translate-x-0 group-focus-visible:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        Buy Me a Coffee
      </span>
    </a>
  );
}

