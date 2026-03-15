"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ShortenUrlModal } from "@/components/ui/shorten-url-modal";

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-linear-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/15",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]",
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function HeroGeometric({
  title1 = "Deine URL ist zu lang?",
  title2 = "Jetzt kostenlos kürzen",
}: {
  title1?: string;
  title2?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const [isShortenModalOpen, setIsShortenModalOpen] = useState(false);
  const fadeUpEase: [number, number, number, number] = [0.25, 0.4, 0.25, 1];
  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: fadeUpEase,
      },
    }),
  };
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour <= 11) return "Guten Morgen,";
    if (hour >= 12 && hour <= 13) return "Guten Tag,";
    if (hour >= 14 && hour <= 17) return "Schönen Nachmittag,";
    if (hour >= 18 && hour <= 23) return "Guten Abend,";
    return "Gute Nacht,";
  };

  const resolvedTitle1 =
    isAuthenticated && user ? getTimeBasedGreeting() : title1;
  const resolvedTitle2 =
    isAuthenticated && user?.firstName?.trim() ? user.firstName.trim() : title2;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-rose-500/5 blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 container mx-auto flex min-h-[calc(100vh-3.5rem)] items-center px-4 md:px-6">
        <div
          className={cn(
            "max-w-3xl mx-auto text-center",
            isAuthenticated
              ? "-translate-y-5 md:-translate-y-7"
              : "translate-y-4 md:translate-y-6",
          )}
        >
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.05] mb-6 md:mb-8 tracking-tight">
              <span className="bg-clip-text text-transparent bg-linear-to-b from-white to-white/80">
                {resolvedTitle1}
              </span>
              <br />
              <span
                className={cn(
                  "bg-clip-text text-transparent bg-linear-to-r from-indigo-300 via-white/90 to-rose-300 ",
                )}
              >
                {resolvedTitle2}
              </span>
            </h1>
          </motion.div>

          {!isAuthenticated && (
            <motion.div
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                Kürze lange Links in Sekunden und teile sie einfach mit deinem
                Team, Kunden oder deiner Community.
              </p>
            </motion.div>
          )}

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "dark",
              isAuthenticated
                ? "mb-2 flex items-center justify-center gap-3"
                : "",
            )}
          >
            <Button
              type="button"
              size="lg"
              className="cursor-pointer gap-2 px-7 text-base font-semibold shadow-lg shadow-black/30"
              onClick={() => setIsShortenModalOpen(true)}
            >
              <Image
                src="/scissors.svg"
                alt=""
                width={15}
                height={15}
                className="h-[15px] w-[15px]"
                aria-hidden="true"
              />
              URL kürzen
            </Button>
            {isAuthenticated && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 border-white/20 bg-white/5 px-7 text-base font-semibold text-white hover:bg-white/12 hover:text-white"
              >
                <Link href="/dashboard">
                  <Image
                    src="/arrow_outward_white.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] opacity-90"
                    aria-hidden="true"
                  />
                  Zum Dashboard
                </Link>
              </Button>
            )}
          </motion.div>

          {!isAuthenticated && (
            <motion.a
              custom={4}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              href="#features"
              aria-label="Zu den Funktionen scrollen"
              className="mt-8 inline-flex items-center justify-center rounded-full p-2 text-white/45 transition-colors hover:text-white/75"
            >
              <motion.span
                animate={{
                  opacity: [0.45, 0.85, 0.45],
                  filter: [
                    "drop-shadow(0 0 0px rgba(255,255,255,0))",
                    "drop-shadow(0 0 8px rgba(255,255,255,0.28))",
                    "drop-shadow(0 0 0px rgba(255,255,255,0))",
                  ],
                }}
                transition={{
                  duration: 2.1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <ChevronDown className="size-6" />
              </motion.span>
            </motion.a>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-linear-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
      <ShortenUrlModal
        isOpen={isShortenModalOpen}
        onClose={() => setIsShortenModalOpen(false)}
      />
    </div>
  );
}

export { HeroGeometric };
