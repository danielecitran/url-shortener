import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import {
  ApiError,
  checkEmailAvailability,
  loginWithGoogle,
  register as registerRequest,
} from "@/lib/api-client";
import { decodeGoogleTokenPayload, getGoogleIdToken } from "@/lib/google-auth";
import { useAuth } from "@/lib/auth-context";

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignUp?: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => void | Promise<void>;
  onGoogleSignUp?: () => void;
  onSignInLinkClick?: () => void;
}

const isValidEmail = (value: string) => {
  const trimmed = value.trim();
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(trimmed)) return false;
  if (trimmed.length > 254) return false;

  const [localPart, domainPart] = trimmed.split("@");
  if (!localPart || !domainPart) return false;
  if (localPart.length > 64 || domainPart.length > 253) return false;

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

const getNameValidationError = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return "Mindestens 2 Zeichen erforderlich";
  }
  if (trimmed.length > 50) {
    return "Maximal 50 Zeichen erlaubt";
  }
  if (!/^(?!.*[ -]{2})[\p{L}]+(?:[ -][\p{L}]+)*$/u.test(trimmed)) {
    return "Nur Buchstaben, Leerzeichen und Bindestriche erlaubt";
  }
  return null;
};

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
    className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl border border-white/10 bg-card/40 p-5 w-64 backdrop-blur-xl dark:bg-zinc-800/40`}
  >
    <Image
      src={testimonial.avatarSrc}
      width={40}
      height={40}
      className="h-10 w-10 rounded-2xl object-cover"
      alt="avatar"
    />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = (
    <span className="font-bold tracking-tight text-white">Willkommen</span>
  ),
  description = "Erstelle dein Konto und verwalte deine Links schnell und einfach.",
  heroImageSrc,
  testimonials = [],
  onSignUp,
  onGoogleSignUp,
  onSignInLinkClick,
}) => {
  const router = useRouter();
  const { login, refreshCurrentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imageShifted, setImageShifted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordFieldActive, setIsPasswordFieldActive] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailInUse, setEmailInUse] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [backendCheckError, setBackendCheckError] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [registrationBackendError, setRegistrationBackendError] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null);
  const [isGoogleProfileCompletion, setIsGoogleProfileCompletion] = useState(false);
  const successRedirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const emailHasError = emailTouched && !isValidEmail(email);
  const hasMinLength = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const passwordTooLong = passwordTouched && password.length > 100;
  const firstNameError = getNameValidationError(firstName);
  const lastNameError = getNameValidationError(lastName);
  const firstNameHasError = firstNameTouched && firstNameError !== null;
  const lastNameHasError = lastNameTouched && lastNameError !== null;
  const canContinueStepOne =
    isValidEmail(email) &&
    hasMinLength &&
    hasUpperLower &&
    password.length <= 100 &&
    !emailInUse &&
    !isSubmittingGoogle &&
    !isCheckingEmail;
  const canSubmitStepTwo =
    !firstNameError &&
    !lastNameError &&
    !isSubmittingRegistration &&
    !isSubmittingGoogle;

  useEffect(() => {
    return () => {
      if (successRedirectTimeoutRef.current) {
        clearTimeout(successRedirectTimeoutRef.current);
      }
    };
  }, []);

  const moveToGoogleNameStep = (idToken: string) => {
    const payload = decodeGoogleTokenPayload(idToken);
    const tokenEmail =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

    setGoogleIdToken(idToken);
    setIsGoogleProfileCompletion(true);
    setEmail(tokenEmail);
    // New Google users should actively enter names in step 2.
    setFirstName("");
    setLastName("");
    setFirstNameTouched(false);
    setLastNameTouched(false);
    setImageShifted(true);
    setStep(2);
  };

  useEffect(() => {
    const pendingGoogleToken = sessionStorage.getItem("shortr.google.pendingIdToken");
    if (!pendingGoogleToken) return;

    sessionStorage.removeItem("shortr.google.pendingIdToken");
    moveToGoogleNameStep(pendingGoogleToken);
  }, []);

  const handleStepOneSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailTouched(true);
    setEmailInUse(false);
    setBackendCheckError(false);
    if (!isValidEmail(email) || !hasMinLength || !hasUpperLower || password.length > 100) return;

    try {
      setIsCheckingEmail(true);
      const availability = await checkEmailAvailability(email.trim().toLowerCase());
      if (!availability.available) {
        setEmailInUse(true);
        return;
      }

      setImageShifted(true);
      setStep(2);
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_ALREADY_EXISTS") {
        setEmailInUse(true);
        return;
      }
      setBackendCheckError(true);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleFinalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFirstNameTouched(true);
    setLastNameTouched(true);
    setRegistrationBackendError(false);
    if (!canSubmitStepTwo) return;

    try {
      if (isGoogleProfileCompletion && googleIdToken) {
        setIsSubmittingGoogle(true);
        await loginWithGoogle({
          idToken: googleIdToken,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          rememberMe: true,
        });
        await refreshCurrentUser();
      } else {
        setIsSubmittingRegistration(true);
        const payload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        };
        if (onSignUp) {
          await onSignUp(payload);
        } else {
          await registerRequest(payload);
        }

        // Registration creates the account, then we sign in so header/auth state updates.
        await login({
          email: payload.email,
          password: payload.password,
        });
      }

      setStep(3);
      successRedirectTimeoutRef.current = setTimeout(() => {
        router.push("/");
      }, 2300);
    } catch {
      setRegistrationBackendError(true);
    } finally {
      setIsSubmittingRegistration(false);
      setIsSubmittingGoogle(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setRegistrationBackendError(false);
    setBackendCheckError(false);
    setEmailInUse(false);
    setIsGoogleProfileCompletion(false);

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

        await refreshCurrentUser();
        setStep(3);
        successRedirectTimeoutRef.current = setTimeout(() => {
          router.push("/");
        }, 2300);
      } catch (error) {
        if (error instanceof ApiError && error.code === "PROFILE_INCOMPLETE") {
          moveToGoogleNameStep(idToken);
          return;
        }
        throw error;
      }
    } catch {
      setBackendCheckError(true);
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#030303] font-sans text-white md:flex-row">
      <section className="relative z-20 flex flex-1 items-center justify-center p-6 md:p-8">
        <button
          type="button"
          aria-label={
            step === 2 ? "Zurück zum ersten Schritt" : "Zur Startseite"
          }
          onClick={() => {
            if (step === 2) {
              setImageShifted(false);
              setStep(1);
              setIsGoogleProfileCompletion(false);
              setGoogleIdToken(null);
              return;
            }
            router.push("/");
          }}
          className="animate-element animate-delay-50 absolute top-6 left-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:top-8 md:left-8"
        >
          <Image
            src="/arrow_back.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
        </button>
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 ? (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                      {title}
                    </h1>
                    <p className="text-white/55">{description}</p>
                  </div>

                  <form
                    className="space-y-5"
                    onSubmit={handleStepOneSubmit}
                    noValidate
                  >
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
                            if (emailInUse) setEmailInUse(false);
                            if (backendCheckError) setBackendCheckError(false);
                          }}
                          onBlur={() => setEmailTouched(true)}
                          aria-invalid={emailHasError || emailInUse}
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
                      {!emailHasError && emailInUse && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                          <Image
                            src="/info_red.svg"
                            alt=""
                            width={14}
                            height={14}
                            aria-hidden="true"
                          />
                          Diese E-Mail ist bereits vergeben.{" "}
                          <Link
                            href="/anmelden"
                            className="text-indigo-300 transition-colors hover:text-rose-300 hover:underline"
                          >
                            Möchtest du dich anmelden?
                          </Link>
                        </p>
                      )}
                    </div>

                    <div className="animate-element animate-delay-400">
                      <label className="text-sm font-medium text-white/65">
                        Passwort
                      </label>
                      <div
                        className="relative"
                        onFocusCapture={() => setIsPasswordFieldActive(true)}
                        onBlurCapture={(event) => {
                          const next = event.relatedTarget as Node | null;
                          if (!event.currentTarget.contains(next)) {
                            setIsPasswordFieldActive(false);
                          }
                        }}
                      >
                        <GlassInputWrapper>
                          <div className="relative">
                            <input
                              name="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Passwort eingeben"
                              value={password}
                              onChange={(event) => {
                                setPassword(event.target.value);
                                if (backendCheckError) setBackendCheckError(false);
                              }}
                              onBlur={() => setPasswordTouched(true)}
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

                        {password.length > 0 && isPasswordFieldActive && (
                          <div className="pointer-events-none absolute top-1/2 left-[calc(100%+0.75rem)] z-20 hidden w-72 -translate-y-1/2 rounded-2xl border border-white/12 bg-[#101010] p-4 text-sm text-white/75 shadow-[10px_12px_30px_rgba(0,0,0,0.45)] md:block">
                            <span
                              aria-hidden="true"
                              className="absolute -left-[8px] top-1/2 -translate-y-1/2"
                            >
                              <svg
                                width="8"
                                height="14"
                                viewBox="0 0 8 14"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M8 0 L0 7 L8 14 Z" fill="#101010" />
                                <path
                                  d="M8 0 L0 7 L8 14"
                                  fill="none"
                                  stroke="rgba(255,255,255,0.12)"
                                  strokeWidth="1"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </span>
                            <p className="mb-2.5 font-medium text-white/85">
                              Passwort muss enthalten:
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                                    hasMinLength
                                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                                      : "border-white/35 text-transparent"
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-white/85">
                                  Mindestens 8 Zeichen
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                                    hasUpperLower
                                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                                      : "border-white/35 text-transparent"
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-white/85">
                                  Gross- und Kleinbuchstaben
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {passwordTooLong && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                          <Image
                            src="/info_red.svg"
                            alt=""
                            width={14}
                            height={14}
                            aria-hidden="true"
                          />
                          Maximal 100 Zeichen erlaubt
                        </p>
                      )}

                      {backendCheckError && (
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

                      {password.length > 0 && isPasswordFieldActive && (
                        <div className="mt-3 rounded-2xl border border-white/12 bg-[#101010] p-3.5 text-xs text-white/75 md:hidden">
                          <p className="mb-2 font-medium text-white/85">
                            Passwort muss enthalten:
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`shrink-0 flex h-4 w-4 items-center justify-center rounded-full border ${
                                  hasMinLength
                                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                                    : "border-white/35 text-transparent"
                                }`}
                              >
                                <Check className="h-3 w-3" />
                              </span>
                              <span>Mindestens 8 Zeichen</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`shrink-0 flex h-4 w-4 items-center justify-center rounded-full border ${
                                  hasUpperLower
                                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                                    : "border-white/35 text-transparent"
                                }`}
                              >
                                <Check className="h-3 w-3" />
                              </span>
                              <span>Gross- und Kleinbuchstaben</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!canContinueStepOne}
                      className={`animate-element animate-delay-500 flex w-full items-center justify-center rounded-full py-4 font-semibold transition-all duration-300 ease-out ${
                        canContinueStepOne
                          ? "cursor-pointer bg-white text-black shadow-lg shadow-black/30 hover:bg-white/90"
                          : "cursor-default bg-white/18 text-white/45 shadow-none"
                      }`}
                    >
                      {isCheckingEmail ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </span>
                      ) : (
                        "Weiter"
                      )}
                    </button>
                  </form>

                  <div className="animate-element animate-delay-600 relative flex items-center justify-center">
                    <span className="w-full border-t border-white/15"></span>
                    <span className="absolute bg-[#030303] px-4 text-sm text-white/45">
                      Oder
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleGoogleSignUp();
                      onGoogleSignUp?.();
                    }}
                    disabled={isSubmittingGoogle}
                    className="animate-element animate-delay-700 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 py-4 text-white transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-60"
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

                  <p className="animate-element animate-delay-800 text-center text-sm text-white/55">
                    Hast du bereits ein Konto?{" "}
                    <Link
                      href="/anmelden"
                      onClick={() => onSignInLinkClick?.()}
                      className="text-indigo-300 transition-colors hover:text-rose-300 hover:underline"
                    >
                      Anmelden
                    </Link>
                  </p>
                </motion.div>
              ) : step === 2 ? (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
                  className="space-y-6"
                >
                  <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                    Wie können wir dich nennen?
                  </h1>

                  <form
                    className="space-y-5"
                    onSubmit={handleFinalSubmit}
                    noValidate
                  >
                    <div className="animate-element animate-delay-300">
                      <label className="text-sm font-medium text-white/65">
                        Vorname
                      </label>
                      <GlassInputWrapper>
                        <input
                          name="firstName"
                          type="text"
                          placeholder="Vornamen eingeben"
                          value={firstName}
                          onChange={(event) => {
                            setFirstName(event.target.value);
                            if (registrationBackendError) {
                              setRegistrationBackendError(false);
                            }
                          }}
                          onBlur={() => setFirstNameTouched(true)}
                          aria-invalid={firstNameHasError}
                          className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/35 focus:outline-none"
                        />
                      </GlassInputWrapper>
                      {firstNameHasError && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                          <Image
                            src="/info_red.svg"
                            alt=""
                            width={14}
                            height={14}
                            aria-hidden="true"
                          />
                          {firstNameError}
                        </p>
                      )}
                    </div>

                    <div className="animate-element animate-delay-400">
                      <label className="text-sm font-medium text-white/65">
                        Nachname
                      </label>
                      <GlassInputWrapper>
                        <input
                          name="lastName"
                          type="text"
                          placeholder="Nachnamen eingeben"
                          value={lastName}
                          onChange={(event) => {
                            setLastName(event.target.value);
                            if (registrationBackendError) {
                              setRegistrationBackendError(false);
                            }
                          }}
                          onBlur={() => setLastNameTouched(true)}
                          aria-invalid={lastNameHasError}
                          className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-white/35 focus:outline-none"
                        />
                      </GlassInputWrapper>
                      {lastNameHasError && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                          <Image
                            src="/info_red.svg"
                            alt=""
                            width={14}
                            height={14}
                            aria-hidden="true"
                          />
                          {lastNameError}
                        </p>
                      )}
                      {registrationBackendError && (
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
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmitStepTwo}
                      className={`animate-element animate-delay-500 flex w-full items-center justify-center rounded-full py-4 font-semibold transition-all duration-300 ease-out ${
                        canSubmitStepTwo
                          ? "cursor-pointer bg-white text-black shadow-lg shadow-black/30 hover:bg-white/90"
                          : "cursor-default bg-white/18 text-white/45 shadow-none"
                      }`}
                    >
                      {isSubmittingRegistration || isSubmittingGoogle ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </span>
                      ) : (
                        "Registrieren"
                      )}
                    </button>

                    <p className="mt-3 text-center text-[11px] leading-relaxed text-white/40">
                      Mit Klick auf &quot;Registrieren&quot; stimmst du unserer{" "}
                      <Link
                        href="/datenschutz"
                        className="text-indigo-300/80 transition-colors hover:text-rose-300 hover:underline"
                      >
                        Datenschutzerklärung
                      </Link>{" "}
                      zu.
                    </p>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
                  className="flex min-h-[320px] items-center justify-center"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{
                      opacity: [0, 1, 1],
                      scale: [0.9, 1.02, 1],
                      y: [10, 0, 0],
                    }}
                    transition={{
                      duration: 0.62,
                      times: [0, 0.62, 1],
                      ease: [0.22, 0.61, 0.36, 1],
                    }}
                  >
                    <motion.svg
                      width="96"
                      height="96"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <motion.path
                        d="M20 6L9 17L4 12"
                        stroke="rgb(110 231 183)"
                        strokeWidth="2.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                        transition={{
                          pathLength: {
                            duration: 0.72,
                            ease: [0.22, 0.61, 0.36, 1],
                            delay: 0.12,
                          },
                          opacity: {
                            duration: 2.2,
                            times: [0, 0.2, 0.92, 1],
                            ease: [0.22, 0.61, 0.36, 1],
                          },
                        }}
                      />
                    </motion.svg>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {heroImageSrc && (
        <section className="relative z-10 hidden flex-1 p-5 md:block">
          <motion.div
            className="animate-slide-right animate-delay-300 absolute inset-5 rounded-3xl border border-white/10 bg-cover bg-center shadow-[0_0_60px_rgba(15,23,42,0.5)]"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
            initial={false}
            animate={
              imageShifted
                ? {
                    filter:
                      "saturate(1.45) hue-rotate(155deg) contrast(1.08) brightness(0.96)",
                    scale: 1.01,
                  }
                : {
                    filter:
                      "saturate(1) hue-rotate(0deg) contrast(1) brightness(1)",
                    scale: 1,
                  }
            }
            transition={{
              duration: imageShifted ? 0.9 : 0.25,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          ></motion.div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
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
