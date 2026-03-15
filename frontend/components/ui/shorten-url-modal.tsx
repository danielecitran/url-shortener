"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Link2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ShortenUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOMAIN_WITH_OPTIONAL_PATH_REGEX =
  /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/;

function isValidUrlInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsedUrl = new URL(trimmed);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;
      return DOMAIN_WITH_OPTIONAL_PATH_REGEX.test(
        `${parsedUrl.hostname}${parsedUrl.port ? `:${parsedUrl.port}` : ""}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`,
      );
    } catch {
      return false;
    }
  }

  return DOMAIN_WITH_OPTIONAL_PATH_REGEX.test(trimmed);
}

export function ShortenUrlModal({ isOpen, onClose }: ShortenUrlModalProps) {
  const titleId = useId();
  const [urlInput, setUrlInput] = useState("");
  const [urlTouched, setUrlTouched] = useState(false);

  const isUrlValid = useMemo(() => isValidUrlInput(urlInput), [urlInput]);
  const showUrlError = urlTouched && urlInput.trim().length > 0 && !isUrlValid;
  const handleClose = useCallback(() => {
    setUrlInput("");
    setUrlTouched(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUrlTouched(true);
    if (!isUrlValid) return;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 md:p-6"
          aria-hidden={!isOpen}
        >
          <motion.button
            type="button"
            aria-label="Dialog schliessen"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={handleClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#0d0d0f]/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] md:p-8"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.16),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(244,63,94,0.13),transparent_42%)]" />

            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Schliessen"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="dark">
              <div className="mb-7 pr-12 md:mb-9">
                <h2
                  id={titleId}
                  className="text-balance text-2xl font-bold tracking-tight text-white md:text-4xl"
                >
                  Kürze einen langen Link
                </h2>
                <p className="mt-2 text-sm text-white/55 md:text-base">
                  Unkompliziert, schnell und ohne Kreditkarte.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <label
                  htmlFor="url-input"
                  className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/85 md:text-base"
                >
                  <Link2 className="h-4 w-4 text-indigo-300/90" />
                  Füge deinen langen Link hier ein
                </label>
                <input
                  id="url-input"
                  type="text"
                  placeholder="https://beispiel.com/meine-lange-url"
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  onBlur={() => setUrlTouched(true)}
                  autoComplete="off"
                  inputMode="url"
                  aria-invalid={showUrlError}
                  aria-describedby={showUrlError ? "url-input-error" : undefined}
                  className="h-13 w-full rounded-2xl border border-white/20 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/40 shadow-inner shadow-black/20 outline-none transition-colors focus:border-indigo-300/75 focus:ring-2 focus:ring-indigo-300/30 aria-invalid:border-rose-400/80 aria-invalid:focus:ring-rose-400/25"
                />
                {showUrlError && (
                  <p
                    id="url-input-error"
                    className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-400"
                  >
                    <Image
                      src="/info_red.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] shrink-0"
                      aria-hidden="true"
                    />
                    Bitte gib einen gültigen Link ein
                  </p>
                )}

                <div className="mt-5 md:mt-6">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!isUrlValid}
                    className="cursor-pointer gap-2 px-7 text-base font-semibold shadow-lg shadow-black/30 transition-all duration-300 disabled:cursor-default disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none"
                  >
                    Kostenlosen Kurzlink erhalten
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
