"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const desktopProfileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const mobileProfileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const scrolled = useScroll(10);
  const { user, isAuthenticated } = useAuth();
  const dashboardHref = "/dashboard";

  const userInitials = React.useMemo(() => {
    if (!user) return "SC";
    const first = user.firstName?.trim().charAt(0) ?? "";
    const last = user.lastName?.trim().charAt(0) ?? "";
    const initials = `${first}${last}`.toUpperCase();
    return initials || "SC";
  }, [user]);

  const links = [
    {
      label: "Funktionen",
      href: "/#features",
    },
    {
      label: "Über uns",
      href: "/#ueber-uns",
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

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedDesktopMenu =
        desktopProfileMenuRef.current?.contains(target) ?? false;
      const clickedMobileMenu =
        mobileProfileMenuRef.current?.contains(target) ?? false;

      if (!clickedDesktopMenu && !clickedMobileMenu) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    setOpen(false);
    window.location.assign("/abmelden");
  };

  return (
    <header
      className={cn(
        "dark overflow-visible font-sans text-foreground bg-background/95 sticky top-0 z-50 mx-auto w-full max-w-5xl border-b border-transparent rounded-full md:border md:border-transparent md:transition-all md:ease-out after:content-[''] after:absolute after:inset-0 after:rounded-full after:p-px after:pointer-events-none after:opacity-0 after:transition-opacity after:duration-300 after:bg-[linear-gradient(115deg,rgba(255,255,255,0.18),rgba(226,232,240,0.06),rgba(255,255,255,0.16))] after:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] after:mask-exclude",
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
          {!isAuthenticated &&
            links.map((link, i) => (
              <a
                key={i}
                className={buttonVariants({ variant: "ghost" })}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          {isAuthenticated && user ? (
            <>
              <Button asChild>
                <Link href={dashboardHref} className="inline-flex items-center gap-1.5">
                  <Image
                    src="/arrow_outward.svg"
                    alt=""
                    width={16}
                    height={16}
                    aria-hidden="true"
                  />
                  Zum Dashboard
                </Link>
              </Button>
              <div ref={desktopProfileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,rgba(17,24,39,0.95),rgba(55,65,81,0.9)_55%,rgba(71,85,105,0.88))] px-2.5 text-xs font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_20px_rgba(0,0,0,0.42)] transition-[filter] duration-250 hover:filter-[brightness(1.22)_contrast(1.12)_saturate(1.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/50"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-label="Profilmenü öffnen"
                >
                  <span>{userInitials}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-white/70 transition-transform duration-200 group-hover:-translate-y-0.5",
                      profileMenuOpen && "rotate-180",
                    )}
                  />
                </button>
                {profileMenuOpen && (
                  <div className="absolute top-[calc(100%+0.5rem)] right-0 z-70 w-44 rounded-2xl border border-white/12 bg-[#0d0d0d]/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <Image
                        src="/settings.svg"
                        alt=""
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                      Einstellungen
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-white/8 hover:text-rose-300"
                    >
                      <Image
                        src="/logout.svg"
                        alt=""
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                      Abmelden
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/anmelden">Anmelden</Link>
              </Button>
              <Button asChild>
                <Link href="/registrieren">Jetzt loslegen</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && user ? (
            <>
              <Button asChild size="sm" className="h-9 rounded-full px-3 text-xs">
                <Link href={dashboardHref} className="inline-flex items-center gap-1.5">
                  <Image
                    src="/arrow_outward.svg"
                    alt=""
                    width={14}
                    height={14}
                    aria-hidden="true"
                  />
                  Zum Dashboard
                </Link>
              </Button>
              <div ref={mobileProfileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="group inline-flex h-9 items-center gap-1 rounded-full bg-[linear-gradient(135deg,rgba(17,24,39,0.95),rgba(55,65,81,0.9)_55%,rgba(71,85,105,0.88))] px-2 text-[11px] font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_7px_18px_rgba(0,0,0,0.42)] transition-[filter] duration-250 hover:filter-[brightness(1.22)_contrast(1.12)_saturate(1.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/50"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-label="Profilmenü öffnen"
                >
                  <span>{userInitials}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-white/70 transition-transform duration-200 group-hover:-translate-y-0.5",
                      profileMenuOpen && "rotate-180",
                    )}
                  />
                </button>
                {profileMenuOpen && (
                  <div className="absolute top-[calc(100%+0.5rem)] right-0 z-70 w-44 rounded-2xl border border-white/12 bg-[#0d0d0d]/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <Image
                        src="/settings.svg"
                        alt=""
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                      Einstellungen
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-white/8 hover:text-rose-300"
                    >
                      <Image
                        src="/logout.svg"
                        alt=""
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                      Abmelden
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button asChild size="sm" className="h-9 rounded-full px-3 text-xs">
              <Link href="/registrieren">Jetzt loslegen</Link>
            </Button>
          )}
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
            {!isAuthenticated &&
              links.map((link) => (
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
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Button asChild className="w-full">
                  <Link
                    href={dashboardHref}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Image
                      src="/arrow_outward.svg"
                      alt=""
                      width={16}
                      height={16}
                      aria-hidden="true"
                    />
                    Zum Dashboard
                  </Link>
                </Button>
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold tracking-wide text-white">
                  {userInitials}
                </div>
              </div>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/anmelden" onClick={() => setOpen(false)}>
                    Anmelden
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/registrieren" onClick={() => setOpen(false)}>
                    Jetzt loslegen
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
