import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

const isValidEmail = (value: string) => {
  const trimmed = value.trim();
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(trimmed)) return false;
  if (trimmed.length > 254) return false;

  const [localPart, domainPart] = trimmed.split("@");
  if (!localPart || !domainPart) return false;
  if (localPart.length > 64 || domainPart.length > 253) return false;

  // Keep format strict and predictable for frontend UX.
  if (
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return false;
  }

  if (
    domainPart.startsWith("-") ||
    domainPart.endsWith("-") ||
    domainPart.includes("..")
  ) {
    return false;
  }

  if (
    domainPart
      .split(".")
      .some(
        (label) =>
          label.length === 0 ||
          label.length > 63 ||
          label.startsWith("-") ||
          label.endsWith("-"),
      )
  ) {
    return false;
  }

  const tld = domainPart.split(".").at(-1) ?? "";
  if (tld.length > 24) return false;

  return true;
};

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  submitLabel?: string;
  googleLabel?: string;
  rememberMeLabel?: string;
  secondaryPromptText?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (input: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => void | Promise<void>;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/12 bg-white/5 backdrop-blur-md transition-all focus-within:border-indigo-300/60 focus-within:bg-white/8 focus-within:shadow-[0_0_0_1px_rgba(165,180,252,0.28)]">
    {children}
  </div>
);

const TestimonialCard = ({
  testimonial,
  delay,
}: {
  testimonial: Testimonial;
  delay: string;
}) => (
  <div
    className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}
  >
    <Image
      src={testimonial.avatarSrc}
      width={40}
      height={40}
      className="h-10 w-10 object-cover rounded-2xl"
      alt="avatar"
    />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = (
    <span className="font-bold tracking-tight text-white">
      Willkommen zurück
    </span>
  ),
  description = "Melde dich an und verwalte deine Links schnell und einfach.",
  submitLabel = "Anmelden",
  googleLabel = "Mit Google fortfahren",
  rememberMeLabel = "Angemeldet bleiben",
  secondaryPromptText = "Neu bei shortr?",
  secondaryActionLabel = "Konto erstellen",
  secondaryActionHref = "/registrieren",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onCreateAccount,
}) => {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsError, setCredentialsError] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const emailHasError = emailTouched && !isValidEmail(email);
  const canSubmit =
    isValidEmail(email) && password.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCredentialsError(false);
    setBackendError(false);

    if (!canSubmit) {
      setEmailTouched(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      };

      if (onSignIn) {
        await onSignIn(payload);
      } else {
        await login(payload);
      }

      router.push("/");
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
        setCredentialsError(true);
      } else {
        setBackendError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#030303] font-sans text-white md:flex-row">
      {/* Left column: sign-in form */}
      <section className="relative flex flex-1 items-center justify-center p-6 md:p-8">
        <Link
          href="/"
          aria-label="Zur Startseite"
          className="animate-element animate-delay-50 absolute top-6 left-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:top-8 md:left-8"
        >
          <Image
            src="/arrow_back.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
        </Link>
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-white/55">
              {description}
            </p>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-white/65">
                  E-Mail
                </label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder="E-Mail-Adresse eingeben"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (credentialsError) setCredentialsError(false);
                      if (backendError) setBackendError(false);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={emailHasError}
                    className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/35 focus:outline-none"
                  />
                </GlassInputWrapper>
                {emailHasError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <Image
                      src="/info_red.svg"
                      alt=""
                      width={14}
                      height={14}
                      aria-hidden="true"
                    />
                    Bitte gib eine gültige E-Mail-Adresse ein
                  </p>
                )}
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-white/65">
                  Passwort
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Passwort eingeben"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (credentialsError) setCredentialsError(false);
                        if (backendError) setBackendError(false);
                      }}
                      className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-white placeholder:text-white/35 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-white/45 transition-[filter,opacity] hover:opacity-100 hover:filter-[brightness(1.35)]"
                    >
                      {showPassword ? (
                        <Image
                          src="/visibility_off.svg"
                          alt=""
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                      ) : (
                        <Image
                          src="/visibility.svg"
                          alt=""
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
                {credentialsError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <Image
                      src="/info_red.svg"
                      alt=""
                      width={14}
                      height={14}
                      aria-hidden="true"
                    />
                    E-Mail oder Passwort ist falsch
                  </p>
                )}
                {backendError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <Image
                      src="/info_red.svg"
                      alt=""
                      width={14}
                      height={14}
                      aria-hidden="true"
                    />
                    Es ist ein Fehler aufgetreten, bitte versuche es später erneut
                  </p>
                )}
              </div>

              <div className="animate-element animate-delay-500 flex items-center text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/30 bg-transparent accent-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-300/40 focus-visible:ring-offset-0"
                  />
                  <span className="text-white/90">{rememberMeLabel}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={`animate-element animate-delay-600 flex w-full items-center justify-center rounded-full py-4 font-semibold transition-all duration-300 ease-out ${
                  canSubmit
                    ? "cursor-pointer bg-white text-black shadow-lg shadow-black/30 hover:bg-white/90"
                    : "cursor-default bg-white/18 text-white/45 shadow-none"
                }`}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                ) : (
                  submitLabel
                )}
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-white/15"></span>
              <span className="absolute bg-[#030303] px-4 text-sm text-white/45">
                Oder
              </span>
            </div>

            <button
              onClick={onGoogleSignIn}
              className="animate-element animate-delay-800 flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 py-4 text-white transition-colors hover:bg-white/10"
            >
              <Image
                src="/google.svg"
                alt=""
                width={20}
                height={20}
                aria-hidden="true"
              />
              {googleLabel}
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-white/55">
              {secondaryPromptText}{" "}
              <Link
                href={secondaryActionHref}
                onClick={() => onCreateAccount?.()}
                className="text-indigo-300 transition-colors hover:text-rose-300 hover:underline"
              >
                {secondaryActionLabel}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="relative hidden flex-1 p-5 md:block">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-5 rounded-3xl border border-white/10 bg-cover bg-center shadow-[0_0_60px_rgba(15,23,42,0.5)]"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard
                testimonial={testimonials[0]}
                delay="animate-delay-1000"
              />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[1]}
                    delay="animate-delay-1200"
                  />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[2]}
                    delay="animate-delay-1400"
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
