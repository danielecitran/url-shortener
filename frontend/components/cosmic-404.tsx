"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const GLOBE_CONFIG: COBEOptions = {
  width: 600,
  height: 600,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [
    { location: [41.0082, 28.9784], size: 0.06 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [-23.5505, -46.6333], size: 0.1 },
  ],
};

export interface GlobeProps {
  className?: string;
  config?: COBEOptions;
}

export function Globe({ className, config = GLOBE_CONFIG }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const widthRef = useRef(0);

  const onRender = useCallback((state: Record<string, any>) => {
    phiRef.current += 0.005; 
    state.phi = phiRef.current;
    state.width = widthRef.current * 2;
    state.height = widthRef.current * 2;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      widthRef.current = canvas.offsetWidth;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const globe = createGlobe(canvas, {
      ...config,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      onRender,
    });

   

    return () => {
      globe.destroy();
      window.removeEventListener("resize", handleResize);
    };
  }, [config, onRender]);

  return (
    <div className={cn("relative aspect-square w-full max-w-md", className)}>
      <canvas
        ref={canvasRef}
        className="size-full contain-[layout_paint_size]"
      />
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
};

const globeVariants = {
  hidden: { scale: 0.85, opacity: 0, y: 10 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: "easeOut" },
  },
  floating: {
    y: [-4, 4],
    transition: {
      duration: 5,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse" as const,
    },
  },
};

export interface NotFoundProps {
  title?: string;
  description?: string;
  backText?: string;
  onBack?: () => void;
}

export default function NotFound({
  title = "Seite nicht gefunden",
  description = "Die angeforderte Seite existiert nicht oder wurde verschoben.",
  backText = "Zur Startseite",
  onBack,
}: NotFoundProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.push("/");
  };

  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-[#030303] px-4 text-white">
      <AnimatePresence mode="wait">
        <motion.div
          className="translate-y-1 text-center md:translate-y-2"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={fadeUp}
        >
          <div className="mb-10 flex items-center justify-center gap-6">
            <motion.span
              className="select-none text-7xl font-bold text-white/80 md:text-8xl"
              variants={fadeUp}
            >
              4
            </motion.span>

            <motion.div
              className="relative h-24 w-24 md:h-32 md:w-32"
              variants={globeVariants}
              animate={["visible", "floating"]}
            >
              <Globe />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.08)_0%,transparent_70%)]" />
            </motion.div>

            <motion.span
              className="select-none text-7xl font-bold text-white/80 md:text-8xl"
              variants={fadeUp}
            >
              4
            </motion.span>
          </div>

          <motion.h1
            className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-5xl"
            variants={fadeUp}
          >
            {title}
          </motion.h1>

          <motion.p
            className="mx-auto mb-10 max-w-md text-base text-white/55 md:text-lg"
            variants={fadeUp}
          >
            {description}
          </motion.p>

          <motion.div variants={fadeUp}>
            <Button
              className="cursor-pointer gap-2"
              onClick={handleBack}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              {backText}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
