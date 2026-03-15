"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

export function GlowingEffectFeatures() {
  return (
    <ul className="dark grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-136 xl:grid-cols-11 xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={
          <Image
            src="/dashboard.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
        }
        title="Einfaches Link-Management"
        description="Behalte alle gekürzten Links zentral im Blick und verwalte sie schnell an einem Ort."
      />
      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={
          <Image
            src="/bolt.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
        }
        title="Schnelles Kürzen in wenigen Sekunden"
        description="Lange Links einfügen, kurz machen und direkt teilen, und das ohne komplizierten Workflow."
      />
      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={
          <Image
            src="/shield.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
        }
        title="Sichere Verwaltung"
        description="Lösche deine gekürzten Links jederzeit und behalte die volle Kontrolle."
      />
      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/12]"
        icon={
          <Image
            src="/query_stats.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
        }
        title="Klick-Analysen in Echtzeit"
        description="Sieh sofort, wie oft deine Kurzlinks geöffnet werden und welche Links am besten performen."
      />
      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/12]"
        icon={
          <Image
            src="/qr_code.svg"
            alt=""
            width={16}
            height={16}
            aria-hidden="true"
          />
        }
        title="QR-Codes für jeden Link"
        description="Generiere automatisch passende QR-Codes für Print, Events oder Social Media."
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={cn("min-h-56 list-none", area)}>
      <div
        className="relative h-full rounded-[1.25rem] border-[0.75px] p-2 md:rounded-[1.5rem] md:p-3"
        style={{
          borderColor: "rgba(255,255,255,0.15)",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      >
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div
          className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] p-6 shadow-[0px_0px_27px_0px_rgba(0,0,0,0.35)] md:p-6"
          style={{
            borderColor: "rgba(255,255,255,0.1)",
            backgroundColor: "#0b0b0f",
          }}
        >
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div
              className="w-fit rounded-lg border-[0.75px] p-2"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {icon}
            </div>
            <div className="space-y-3">
              <h3
                className="pt-0.5 text-xl leading-5.5 font-semibold font-sans tracking-[-0.04em] text-balance md:text-2xl md:leading-7.5"
                style={{ color: "#ffffff" }}
              >
                {title}
              </h3>
              <h2
                className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-4.5 md:text-base md:leading-5.5"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
