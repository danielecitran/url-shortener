"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";

export function Header() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  const links = [
    {
      label: "Funktionen",
      href: "#features",
    },
    {
      label: "Über uns",
      href: "#ueber-uns",
    },
  ];

  React.useEffect(() => {
    if (open) {
      // Disable scroll
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable scroll
      document.body.style.overflow = "";
    }

    // Cleanup when component unmounts (important for Next.js)
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "dark overflow-hidden font-sans text-foreground bg-background/95 sticky top-0 z-50 mx-auto w-full max-w-5xl border-b border-transparent rounded-full md:border md:border-transparent md:transition-all md:ease-out after:content-[''] after:absolute after:inset-0 after:rounded-full after:p-px after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-300 after:bg-[linear-gradient(115deg,rgba(255,255,255,0.18),rgba(226,232,240,0.06),rgba(255,255,255,0.16))] after:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] after:mask-exclude",
        {
          "bg-background/95 supports-backdrop-filter:bg-background/50 border-b border-b-white/20 md:border md:border-white/15 md:after:opacity-100 backdrop-blur-lg md:top-4 md:max-w-4xl md:shadow md:shadow-black/25":
            scrolled && !open,
          "bg-background/90": open,
        },
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-2 md:h-12 md:px-1 md:transition-all md:ease-out",
        )}
      >
        <Link href="/#top" aria-label="Zur Startseite nach oben">
          <Image
            src="/shortr_header.svg"
            alt="Shortr Logo"
            width={120}
            height={28}
            className="h-6 w-auto"
            priority
          />
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {links.map((link, i) => (
            <a
              key={i}
              className={buttonVariants({ variant: "ghost" })}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
          <Button asChild variant="outline">
            <a href="/anmelden">Anmelden</a>
          </Button>
          <Button asChild>
            <Link href="/registrieren">Jetzt loslegen</Link>
          </Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Button asChild size="sm" className="h-9 rounded-full px-3 text-xs">
            <Link href="/registrieren">Jetzt loslegen</Link>
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </div>
      </nav>

      <div
        className={cn(
          "bg-background/90 fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div
          data-slot={open ? "open" : "closed"}
          className={cn(
            "data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out",
            "flex h-full w-full flex-col justify-between gap-y-2 p-4",
          )}
        >
          <div className="grid gap-y-2">
            {links.map((link) => (
              <a
                key={link.label}
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-start",
                })}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <a href="/anmelden" onClick={() => setOpen(false)}>
                Anmelden
              </a>
            </Button>
            <Button asChild className="w-full">
              <Link href="/registrieren" onClick={() => setOpen(false)}>
                Jetzt loslegen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
