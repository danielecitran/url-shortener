"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Copy, Link2, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createShortLink, loginWithGoogle } from "@/lib/api-client";
import { decodeGoogleTokenPayload, getGoogleIdToken } from "@/lib/google-auth";

interface ShortenUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOMAIN_WITH_OPTIONAL_PATH_REGEX =
  /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/;
const PENDING_SHORTEN_URL_KEY = "shortr.shorten.pendingUrl";

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

function normalizeUrlInput(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function ShortenUrlModal({ isOpen, onClose }: ShortenUrlModalProps) {
  const router = useRouter();
  const titleId = useId();
  const authPromptTitleId = useId();
  const { isAuthenticated, refreshCurrentUser } = useAuth();
  const [urlInput, setUrlInput] = useState("");
  const [urlTouched, setUrlTouched] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState(false);
  const [isSubmittingShorten, setIsSubmittingShorten] = useState(false);
  const [shortenError, setShortenError] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const shouldResetOnExitRef = useRef(false);
  const previousOverflowRef = useRef<string | null>(null);
  const lastAutoShortenedUrlRef = useRef<string | null>(null);

  const isUrlValid = useMemo(() => isValidUrlInput(urlInput), [urlInput]);
  const showUrlError = urlTouched && urlInput.trim().length > 0 && !isUrlValid;
  const canSubmitShorten =
    isUrlValid && !isSubmittingShorten && !isSubmittingGoogle;

  const executeShorten = useCallback(async (rawUrl: string) => {
    setShortenError(false);
    setCopied(false);
    setIsSubmittingShorten(true);
    try {
      const normalizedUrl = normalizeUrlInput(rawUrl);
      const response = await createShortLink({ originalUrl: normalizedUrl });
      setShortenedUrl(response.shortUrl);
      setUrlInput(response.originalUrl);
      sessionStorage.removeItem(PENDING_SHORTEN_URL_KEY);
    } catch {
      setShortenError(true);
    } finally {
      setIsSubmittingShorten(false);
    }
  }, []);

  const handleClose = useCallback((options?: { clearPending?: boolean }) => {
    shouldResetOnExitRef.current = true;
    setIsSubmittingGoogle(false);
    setGoogleError(false);
    if (options?.clearPending !== false) {
      sessionStorage.removeItem(PENDING_SHORTEN_URL_KEY);
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (isAuthPromptOpen) {
        setIsAuthPromptOpen(false);
        return;
      }

      handleClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose, isAuthPromptOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (previousOverflowRef.current === null) {
      previousOverflowRef.current = document.body.style.overflow;
    }
    document.body.style.overflow = "hidden";
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUrlTouched(true);
    setShortenError(false);
    if (!canSubmitShorten) return;
    if (!isAuthenticated) {
      setGoogleError(false);
      setShortenedUrl("");
      setCopied(false);
      sessionStorage.setItem(PENDING_SHORTEN_URL_KEY, urlInput.trim());
      setIsAuthPromptOpen(true);
      return;
    }
    void executeShorten(urlInput);
  };

  const handleGoogleAuth = async () => {
    setGoogleError(false);
    setShortenError(false);
    try {
      setIsSubmittingGoogle(true);
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error("Google Client ID fehlt");
      }

      const idToken = await getGoogleIdToken(clientId);

      try {
        await loginWithGoogle({
          idToken,
          rememberMe: true,
        });
      } catch (error) {
        if (error instanceof ApiError && error.code === "PROFILE_INCOMPLETE") {
          sessionStorage.setItem("shortr.google.pendingIdToken", idToken);
          const payload = decodeGoogleTokenPayload(idToken);
          if (typeof payload.email === "string") {
            sessionStorage.setItem("shortr.google.pendingEmail", payload.email);
          }
          handleClose({ clearPending: false });
          router.push("/registrieren");
          return;
        }
        throw error;
      }

      await refreshCurrentUser();
      setIsAuthPromptOpen(false);
      const pendingUrl = sessionStorage.getItem(PENDING_SHORTEN_URL_KEY);
      if (pendingUrl) {
        setUrlInput(pendingUrl);
        setUrlTouched(false);
        await executeShorten(pendingUrl);
      }
    } catch {
      setGoogleError(true);
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  const handleCopyShortUrl = async () => {
    if (!shortenedUrl) return;
    try {
      await navigator.clipboard.writeText(shortenedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated || isSubmittingShorten) return;
    const pendingUrl = sessionStorage.getItem(PENDING_SHORTEN_URL_KEY);
    if (!pendingUrl) return;
    if (lastAutoShortenedUrlRef.current === pendingUrl) return;
    lastAutoShortenedUrlRef.current = pendingUrl;
    setUrlInput(pendingUrl);
    setUrlTouched(false);
    void executeShorten(pendingUrl);
  }, [isAuthenticated, isOpen, isSubmittingShorten, executeShorten]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (previousOverflowRef.current !== null) {
          document.body.style.overflow = previousOverflowRef.current;
          previousOverflowRef.current = null;
        }
        if (!shouldResetOnExitRef.current) return;
        setUrlInput("");
        setUrlTouched(false);
        setIsAuthPromptOpen(false);
        setShortenError(false);
        setShortenedUrl("");
        setCopied(false);
        setIsSubmittingShorten(false);
        shouldResetOnExitRef.current = false;
      }}
    >
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 md:p-6"
          aria-hidden={!isOpen}
          initial={{ opacity: 0.96 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.button
            type="button"
            aria-label="Dialog schliessen"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={() =>
              isAuthPromptOpen ? setIsAuthPromptOpen(false) : handleClose()
            }
          />
          <AnimatePresence mode="wait">
            {isAuthPromptOpen ? (
              <motion.div
                key="auth-prompt"
                role="dialog"
                aria-modal="true"
                aria-labelledby={authPromptTitleId}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-30 w-full max-w-md rounded-3xl border border-white/15 bg-[#0e0e11] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] md:p-6"
              >
                <h3
                  id={authPromptTitleId}
                  className="text-pretty text-xl font-bold tracking-tight text-white md:text-2xl"
                >
                  Bitte melde dich an, um deinen gekürzten Link zu erhalten
                </h3>

                <div className="mt-5 flex flex-col gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="cursor-pointer bg-white text-black hover:bg-white/90"
                  >
                    <Link
                      href="/registrieren"
                      onClick={() => handleClose({ clearPending: false })}
                    >
                      Registrieren
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="cursor-pointer border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link
                      href="/anmelden"
                      onClick={() => handleClose({ clearPending: false })}
                    >
                      Anmelden
                    </Link>
                  </Button>
                </div>
                <div className="my-4 relative flex items-center justify-center">
                  <span className="w-full border-t border-white/15"></span>
                  <span className="absolute bg-[#0e0e11] px-3 text-xs text-white/45">
                    oder
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleGoogleAuth();
                  }}
                  disabled={isSubmittingGoogle || isSubmittingShorten}
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-60"
                >
                  <Image
                    src="/google.svg"
                    alt=""
                    width={20}
                    height={20}
                    aria-hidden="true"
                  />
                  {isSubmittingGoogle ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Mit Google fortfahren"
                  )}
                </button>
                {googleError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <Image
                      src="/info_red.svg"
                      alt=""
                      width={14}
                      height={14}
                      aria-hidden="true"
                    />
                    Es ist ein Fehler aufgetreten, bitte versuche es später
                    erneut
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="shorten-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.985 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#0d0d0f]/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] md:p-8"
              >
                <button
                  type="button"
                  onClick={() => handleClose()}
                  className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  aria-label="Schliessen"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="dark">
                  <AnimatePresence mode="wait" initial={false}>
                    {shortenedUrl ? (
                      <motion.div
                        key="shorten-result"
                        initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="py-2"
                      >
                        <h2
                          id={titleId}
                          className="text-balance text-2xl font-bold tracking-tight text-white md:text-4xl"
                        >
                          Dein Kurzlink ist bereit
                        </h2>
                        <p className="mt-2 text-sm text-white/55 md:text-base">
                          Kopiere deinen Link oder öffne ihn direkt im Browser.
                        </p>

                        <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-3.5 md:p-4">
                          <a
                            href={shortenedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-sm font-semibold text-white underline decoration-white/35 underline-offset-4 transition-colors hover:text-white/85"
                          >
                            {shortenedUrl}
                          </a>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            size="lg"
                            onClick={() => {
                              void handleCopyShortUrl();
                            }}
                            className={`w-[170px] cursor-pointer transition-colors duration-300 ${
                              copied
                                ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-300/90"
                                : "bg-white text-black hover:bg-white/90"
                            }`}
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              {copied ? (
                                <motion.span
                                  key="copied-state"
                                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className="inline-flex items-center gap-2"
                                >
                                  <Check className="h-4 w-4" />
                                  Kopiert
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="copy-state"
                                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className="inline-flex items-center gap-2"
                                >
                                  <Copy className="h-4 w-4" />
                                  Link kopieren
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </Button>
                          <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="cursor-pointer border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                          >
                            <Link href="/dashboard" onClick={() => handleClose()}>
                              Zum Dashboard
                            </Link>
                          </Button>
                        </div>
                        <p className="mt-3 text-xs text-white/45">
                          Alle deine gekürzten Links, Statistiken und die
                          QR-Code-Erstellung findest du im Dashboard.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="shorten-form"
                        initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      >
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
                            aria-describedby={
                              showUrlError ? "url-input-error" : undefined
                            }
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
                              disabled={!canSubmitShorten}
                              className="cursor-pointer gap-2 px-7 text-base font-semibold shadow-lg shadow-black/30 transition-all duration-300 disabled:cursor-default disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none"
                            >
                              {isSubmittingShorten ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <>
                                  Kostenlosen Kurzlink erhalten
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </div>
                          {shortenError && (
                            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-400">
                              <Image
                                src="/info_red.svg"
                                alt=""
                                width={18}
                                height={18}
                                className="h-[18px] w-[18px] shrink-0"
                                aria-hidden="true"
                              />
                              Es ist ein Fehler aufgetreten, bitte versuche es
                              später erneut
                            </p>
                          )}
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
