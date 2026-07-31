"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { siteConfig } from "@/lib/config";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section id="inicio" ref={ref} className="relative flex h-screen items-center justify-center overflow-hidden bg-marca-700">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-marca-400/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-marca-blush/30 blur-3xl" />

      <motion.div style={{ y }} className="relative z-10 flex flex-col items-center gap-6 px-4 text-center text-white">
        <Image src="/logo.png" alt={siteConfig.brandName} width={220} height={220} className="h-auto w-40 md:w-56" priority />
        <p className="font-heading text-xl md:text-2xl">{siteConfig.tagline}</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80"
        aria-hidden
      >
        ↓
      </motion.div>
    </section>
  );
}
