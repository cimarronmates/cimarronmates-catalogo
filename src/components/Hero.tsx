"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { siteConfig } from "@/lib/config";
import { buildContactoLink } from "@/lib/whatsapp";
import { ArrowDownIcon, OrnamentRule, WhatsAppIcon } from "@/components/icons";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const emblemY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const emblemOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0.25]);

  const ease = [0.16, 1, 0.3, 1] as const;
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, delay, ease },
  });

  return (
    <section
      id="inicio"
      ref={ref}
      className="surface-oscura textura-papel relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-marca-900 px-4 pb-20 pt-28 text-center sm:px-6"
    >
      {/* Sunrise behind the emblem — the one light source, echoing the mark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-[58%] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(230,198,95,0.30) 0%, rgba(45,110,62,0.22) 38%, rgba(13,33,22,0) 68%)",
        }}
      />
      {/* Ground shadow: settles the composition and stops the fold reading flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-marca-900 via-marca-900/80 to-transparent"
      />

      <motion.div style={{ y: emblemY, opacity: emblemOpacity }} className="relative">
        <motion.div {...rise(0)}>
          <Image
            src="/logo.png"
            alt={`Emblema de ${siteConfig.brandName}: un mate con bombilla sobre el campo argentino al amanecer`}
            width={786}
            height={800}
            priority
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 20rem, 23rem"
            className="mx-auto h-auto w-[min(60vw,15rem)] drop-shadow-[0_18px_45px_rgba(0,0,0,0.45)] md:w-[20rem] lg:w-[23rem]"
          />
        </motion.div>
      </motion.div>

      <motion.h1
        {...rise(0.1)}
        className="mt-8 max-w-[16ch] font-display text-[clamp(2.1rem,6vw,3.9rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-crema"
      >
        {siteConfig.tagline}
      </motion.h1>

      <motion.div {...rise(0.16)} className="mt-5 text-oro-400">
        <OrnamentRule className="mx-auto h-3 w-28" />
      </motion.div>

      <motion.p
        {...rise(0.22)}
        className="mt-5 max-w-[52ch] text-balance text-base leading-relaxed text-crema/75 sm:text-lg"
      >
        Mates, bombillas, termos y yerbas elegidos uno por uno. Escribinos y te
        respondemos al toque.
      </motion.p>

      <motion.div
        {...rise(0.3)}
        className="mt-9 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center"
      >
        <a
          href="#catalogo"
          className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-oro-500 px-7 text-base font-semibold text-marca-900 shadow-lg shadow-black/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-oro-400 active:translate-y-0"
        >
          Ver catálogo
        </a>
        <a
          href={buildContactoLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl border border-crema/30 px-7 text-base font-semibold text-crema transition-colors duration-200 hover:border-crema/60 hover:bg-white/10"
        >
          <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
          Consultar por WhatsApp
        </a>
      </motion.div>

      <motion.a
        href="#catalogo"
        aria-label="Ir al catálogo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full p-2 text-crema/50 transition-colors hover:text-crema sm:block"
      >
        <motion.span
          animate={reduce ? undefined : { y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="block"
        >
          <ArrowDownIcon className="h-5 w-5" />
        </motion.span>
      </motion.a>
    </section>
  );
}
