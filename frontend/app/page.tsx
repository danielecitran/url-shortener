import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { GlowingEffectFeatures } from "@/components/glowing-effect-featutes";
import { BGPattern } from "@/components/bg-pattern";

export default function Home() {
  return (
    <main className="bg-[#030303]">
      <HeroGeometric />
      <section
        id="features"
        className="dark mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-20 md:scroll-mt-28 md:px-6"
      >
        <GlowingEffectFeatures />
      </section>
      <section
        id="ueber-uns"
        className="dark relative w-full min-h-88 scroll-mt-32 overflow-hidden pb-24 md:scroll-mt-36"
      >
        <div className="relative min-h-88">
          <BGPattern
            variant="grid"
            mask="fade-edges"
            fill="rgba(229,231,235,0.16)"
            className="z-0"
          />
          <div className="relative z-10 mx-auto flex min-h-88 w-full max-w-6xl items-center justify-center px-4 md:px-6">
            <div className="max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Über uns
              </h2>
              <p className="text-base leading-relaxed text-white/70 md:text-lg">
                shortr.ch ist im Rahmen eines Schulprojekts entstanden. Die
                Plattform ist bewusst einfach gehalten, kostenlos nutzbar und
                soll lange Links schnell und unkompliziert kürzen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
