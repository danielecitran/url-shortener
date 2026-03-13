import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="dark w-full border-t border-white/10 bg-[#050505] px-4 py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <Link href="/#top" aria-label="Zur Startseite nach oben">
          <Image
            src="/shortr_header.svg"
            alt="shortr.ch"
            width={124}
            height={28}
            className="h-7 w-auto"
          />
        </Link>

        <p className="mt-5 text-sm font-medium text-white/60">Kontakt:</p>
        <a
          href="mailto:daniele.citran@student.ksh.ch"
          className="mt-1 text-sm text-white/70 transition-colors hover:text-white"
        >
          daniele.citran@student.ksh.ch
        </a>

        <nav className="mt-9 flex flex-col items-center gap-3 text-sm font-semibold tracking-[0.08em] uppercase text-white/78">
          <a href="#features" className="transition-colors hover:text-white">
            Funktionen
          </a>
          <a href="#ueber-uns" className="transition-colors hover:text-white">
            Über uns
          </a>
        </nav>

        <nav className="mt-6 flex items-center gap-4 text-sm text-white/55">
          <a href="/impressum" className="transition-colors hover:text-white/80">
            Impressum
          </a>
          <span aria-hidden="true" className="text-white/25">
            |
          </span>
          <a
            href="/datenschutz"
            className="transition-colors hover:text-white/80"
          >
            Datenschutz
          </a>
        </nav>
      </div>
    </footer>
  );
}
