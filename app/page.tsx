"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@onelabs/dapp-kit";
import { CryptoIcon3D } from "@/components/CryptoIcon3D";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  type Variants,
} from "framer-motion";

/* ─── Animation constants ─────────────────────────────────────── */
const EASE_EXPO = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden:  { opacity: 0, y: 52, filter: "blur(6px)" },
  show:    { opacity: 1, y:  0, filter: "blur(0px)" },
};
const fadeLeft = {
  hidden:  { opacity: 0, x: -56, filter: "blur(4px)" },
  show:    { opacity: 1, x:   0, filter: "blur(0px)" },
};
const fadeRight = {
  hidden:  { opacity: 0, x: 56, filter: "blur(4px)" },
  show:    { opacity: 1, x:  0, filter: "blur(0px)" },
};
const scaleIn = {
  hidden:  { opacity: 0, scale: 0.93, filter: "blur(4px)" },
  show:    { opacity: 1, scale: 1,    filter: "blur(0px)" },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.10 } },
};

/* ─── Scroll-reveal wrapper ───────────────────────────────────── */
function Reveal({
  children,
  variant  = fadeUp,
  delay    = 0,
  duration = 0.75,
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variants;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variant}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      transition={{ duration, delay, ease: EASE_EXPO }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stagger container ───────────────────────────────────────── */
function StaggerReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Parallax horizontal banner (like the video) ────────────── */
function ParallaxBanner({ words, accent }: { words: string[]; accent: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Row 1 moves left, Row 2 moves right
  const rawX1 = useTransform(scrollYProgress, [0, 1], ["2%", "-6%"]);
  const rawX2 = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const x1 = useSpring(rawX1, { stiffness: 60, damping: 30 });
  const x2 = useSpring(rawX2, { stiffness: 60, damping: 30 });

  const row = words.join("  ·  ") + "  ·  " + words.join("  ·  ");

  return (
    <div
      ref={ref}
      className="relative overflow-hidden py-6 select-none"
      style={{
        borderTop:    "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Top row — moves left */}
      <motion.div
        style={{ x: x1 }}
        className="whitespace-nowrap font-black uppercase leading-none mb-1"
        aria-hidden
      >
        {[row, row].map((r, i) => (
          <span key={i} style={{ fontSize: "clamp(3.5rem,6vw,6rem)", letterSpacing: "-0.03em" }}>
            {r.split("·").map((word, j) => (
              <span key={j}>
                <span style={{ color: j % 3 === 0 ? accent : "rgba(255,255,255,0.04)" }}>
                  {word.trim()}
                </span>
                {j < r.split("·").length - 1 && (
                  <span style={{ color: "rgba(255,255,255,0.08)", margin: "0 0.4em" }}>·</span>
                )}
              </span>
            ))}
          </span>
        ))}
      </motion.div>

      {/* Bottom row — moves right, half-opacity */}
      <motion.div
        style={{ x: x2 }}
        className="whitespace-nowrap font-black uppercase leading-none opacity-40"
        aria-hidden
      >
        <span style={{ fontSize: "clamp(2rem,3.5vw,3.5rem)", letterSpacing: "-0.02em", color: "rgba(255,255,255,0.06)" }}>
          {row}
        </span>
      </motion.div>
    </div>
  );
}

/* ─── Isometric Arena Graphic ─────────────────────────────────── */
function ArenaGraphic() {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(59,130,246,0.14) 0%, transparent 70%)"
      }} />
      <svg width="420" height="320" viewBox="0 0 420 320"
        style={{ filter: "drop-shadow(0 0 28px rgba(59,130,246,0.38))" }}>
        <defs>
          <linearGradient id="isoTop"   x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1e40af" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient>
          <linearGradient id="isoLeft"  x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1e3a8a" /><stop offset="100%" stopColor="#1d4ed8" /></linearGradient>
          <linearGradient id="isoRight" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#172554" /><stop offset="100%" stopColor="#1e3a8a" /></linearGradient>
        </defs>
        <polygon points="210,280 60,200 210,120 360,200" fill="rgba(30,58,138,0.25)" stroke="rgba(59,130,246,0.35)" strokeWidth="1" />
        <polygon points="130,155 80,183 80,235 130,207"  fill="url(#isoLeft)"  opacity="0.75" />
        <polygon points="130,155 180,183 180,235 130,207" fill="url(#isoRight)" opacity="0.75" />
        <polygon points="80,183 130,155 180,183 130,211"  fill="url(#isoTop)"   opacity="0.75" />
        <polygon points="80,183 130,155 180,183 130,211"  fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
        <polygon points="210,130 160,158 160,220 210,192" fill="url(#isoLeft)"  opacity="0.95" />
        <polygon points="210,130 260,158 260,220 210,192" fill="url(#isoRight)" opacity="0.95" />
        <polygon points="160,158 210,130 260,158 210,186" fill="url(#isoTop)"   opacity="0.95" />
        <polygon points="160,158 210,130 260,158 210,186" fill="none" stroke="#60a5fa" strokeWidth="1.2" />
        <polygon points="290,155 240,183 240,235 290,207" fill="url(#isoLeft)"  opacity="0.75" />
        <polygon points="290,155 340,183 340,235 290,207" fill="url(#isoRight)" opacity="0.75" />
        <polygon points="240,183 290,155 340,183 290,211" fill="url(#isoTop)"   opacity="0.75" />
        <polygon points="240,183 290,155 340,183 290,211" fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
        <line x1="210" y1="130" x2="210" y2="88" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.7" />
        <circle cx="210" cy="83" r="6" fill="#3b82f6" opacity="0.85" />
        <circle cx="210" cy="83" r="14" fill="rgba(59,130,246,0.18)" />
        <line x1="130" y1="155" x2="130" y2="118" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,4" opacity="0.5" />
        <circle cx="130" cy="113" r="4" fill="#60a5fa" opacity="0.7" />
        <line x1="290" y1="155" x2="290" y2="118" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,4" opacity="0.5" />
        <circle cx="290" cy="113" r="4" fill="#60a5fa" opacity="0.7" />
        <line x1="178" y1="178" x2="160" y2="188" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3,3" opacity="0.45" />
        <line x1="242" y1="178" x2="260" y2="188" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3,3" opacity="0.45" />
        <line x1="210" y1="186" x2="210" y2="220" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" opacity="0.35" />
      </svg>
    </div>
  );
}

/* ─── Ticker ──────────────────────────────────────────────────── */
function TickerContent() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Total Value Locked</span>
        <span className="font-black text-xl" style={{ color: "#3b82f6" }}>$2,450,892.00</span>
      </div>
      <div className="w-1 h-1 rounded-full bg-slate-700" />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Active Rounds</span>
        <span className="text-slate-100 font-black text-xl">14 Live</span>
      </div>
      <div className="w-1 h-1 rounded-full bg-slate-700" />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Total Yield Distributed</span>
        <span className="font-black text-xl" style={{ color: "#0df280" }}>450.22 ETH</span>
      </div>
      <div className="w-1 h-1 rounded-full bg-slate-700" />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">OneChain Status</span>
        <span className="font-black text-xl flex items-center gap-1" style={{ color: "#0df280" }}>
          Online
          <span className="material-symbols-outlined text-sm leading-none">check_circle</span>
        </span>
      </div>
      <div className="w-1 h-1 rounded-full bg-slate-700" />
    </>
  );
}

/* ─── Arena Portal: network visual (Ithaca-style) ────────────── */
function ArenaPortal() {
  const RCX = 278;
  const RCY = 228;
  const R   = 95;

  return (
    <div className="hidden lg:block relative h-[580px]">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 55% 50% at 46% 40%, rgba(59,130,246,0.14) 0%, transparent 72%)`,
      }} />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 600 580"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <filter id="glowDot" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx={RCX} cy={RCY} r="118" fill="none"
          stroke="rgba(59,130,246,0.13)" strokeWidth="1" strokeDasharray="8 16">
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${RCX} ${RCY}`} to={`360 ${RCX} ${RCY}`} dur="22s" repeatCount="indefinite"/>
        </circle>
        <circle cx={RCX} cy={RCY} r="106" fill="none"
          stroke="rgba(59,130,246,0.20)" strokeWidth="1" strokeDasharray="4 12">
          <animateTransform attributeName="transform" type="rotate"
            from={`360 ${RCX} ${RCY}`} to={`0 ${RCX} ${RCY}`} dur="14s" repeatCount="indefinite"/>
        </circle>
        <path d="M 10,195 Q 140,170 248,218" fill="none" stroke="rgba(59,130,246,0.09)" strokeWidth="1"/>
        <path d="M 10,310 Q 120,295 248,242" fill="none" stroke="rgba(59,130,246,0.07)" strokeWidth="1"/>
        <path d="M 590,145 Q 470,195 325,218" fill="none" stroke="rgba(59,130,246,0.07)" strokeWidth="1"/>
        <path id="ap-btc" d={`M ${RCX+R*0.64},${RCY-R*0.77} C 400,135 455,105 490,85`}
          fill="none" stroke="rgba(59,130,246,0.50)" strokeWidth="1.4"
          strokeDasharray="7,11" style={{ animation: "flowDash 2.4s linear infinite" }}/>
        <path id="ap-btc-m" d={`M ${RCX+R*0.64},${RCY-R*0.77} C 400,135 455,105 490,85`} fill="none" stroke="none"/>
        <circle r="3.5" fill="#3b82f6" filter="url(#glowDot)">
          <animateMotion dur="2.4s" repeatCount="indefinite"><mpath xlinkHref="#ap-btc-m"/></animateMotion>
        </circle>
        <path id="ap-eth" d={`M ${RCX+R},${RCY+R*0.08} C 435,255 465,270 490,285`}
          fill="none" stroke="rgba(6,182,212,0.45)" strokeWidth="1.4"
          strokeDasharray="7,11" style={{ animation: "flowDash 3.1s linear infinite" }}/>
        <path id="ap-eth-m" d={`M ${RCX+R},${RCY+R*0.08} C 435,255 465,270 490,285`} fill="none" stroke="none"/>
        <circle r="3.5" fill="#06b6d4" filter="url(#glowDot)">
          <animateMotion dur="3.1s" repeatCount="indefinite"><mpath xlinkHref="#ap-eth-m"/></animateMotion>
        </circle>
        <path id="ap-pool" d={`M ${RCX-R*0.77},${RCY+R*0.64} C 160,355 115,395 80,425`}
          fill="none" stroke="rgba(6,182,212,0.35)" strokeWidth="1.4"
          strokeDasharray="7,11" style={{ animation: "flowDash 3.6s linear infinite reverse" }}/>
        <path id="ap-pool-m" d={`M ${RCX-R*0.77},${RCY+R*0.64} C 160,355 115,395 80,425`} fill="none" stroke="none"/>
        <circle r="3.5" fill="#06b6d4" filter="url(#glowDot)">
          <animateMotion dur="3.6s" repeatCount="indefinite"><mpath xlinkHref="#ap-pool-m"/></animateMotion>
        </circle>
        <path id="ap-wr" d={`M ${RCX+R*0.32},${RCY+R} C 340,390 435,440 500,468`}
          fill="none" stroke="rgba(13,242,128,0.38)" strokeWidth="1.4"
          strokeDasharray="7,11" style={{ animation: "flowDash 2.8s linear infinite" }}/>
        <path id="ap-wr-m" d={`M ${RCX+R*0.32},${RCY+R} C 340,390 435,440 500,468`} fill="none" stroke="none"/>
        <circle r="3.5" fill="#0df280" filter="url(#glowDot)">
          <animateMotion dur="2.8s" repeatCount="indefinite"><mpath xlinkHref="#ap-wr-m"/></animateMotion>
        </circle>
        <circle cx="490" cy="85"  r="5" fill="rgba(59,130,246,0.25)" stroke="rgba(59,130,246,0.6)" strokeWidth="1"/>
        <circle cx="490" cy="285" r="5" fill="rgba(6,182,212,0.20)"  stroke="rgba(6,182,212,0.55)"  strokeWidth="1"/>
        <circle cx="80"  cy="425" r="5" fill="rgba(6,182,212,0.20)"  stroke="rgba(6,182,212,0.55)"  strokeWidth="1"/>
        <circle cx="500" cy="468" r="5" fill="rgba(13,242,128,0.18)" stroke="rgba(13,242,128,0.55)" strokeWidth="1"/>
      </svg>
      <div className="absolute" style={{ top: 133, left: 183, width: 190, height: 190 }}>
        <div className="absolute inset-0 rounded-full animate-ring-glow" style={{
          border: "2px solid rgba(59,130,246,0.88)",
          background: "radial-gradient(ellipse at 35% 22%, rgba(59,130,246,0.12) 0%, transparent 65%)",
        }}>
          <div className="absolute rounded-full" style={{ inset: 18, border: "1px dashed rgba(59,130,246,0.32)" }}/>
          <div className="absolute inset-0 rounded-full" style={{
            background: "conic-gradient(from 200deg, rgba(59,130,246,0.08) 0deg, transparent 60deg, transparent 360deg)",
          }}/>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.28em" }}>DexDuel</span>
            <span style={{ fontWeight: 900, color: "#ffffff", fontSize: 17, letterSpacing: "0.06em", lineHeight: 1.15 }}>ARENA</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3b82f6", display: "inline-block" }}/>
              <span style={{ fontSize: 8, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.25em" }}>LIVE</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute z-20 px-3 py-2 rounded-xl flex items-center gap-2"
        style={{ top: 55, right: 10, background: "rgba(0,180,255,0.10)", border: "1px solid rgba(0,180,255,0.28)", backdropFilter: "blur(12px)" }}>
        <CryptoIcon3D symbol="BTC" size={44}/>
        <div>
          <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">BTC / USD</div>
          <div className="text-white font-black text-base leading-tight">$64,281.50</div>
          <div className="text-green-400 text-[9px] font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>trending_up</span>+2.48%
          </div>
        </div>
      </div>
      <div className="absolute z-20 px-3 py-2 rounded-xl flex items-center gap-2"
        style={{ top: 255, right: 10, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.24)", backdropFilter: "blur(12px)" }}>
        <CryptoIcon3D symbol="ETH" size={44}/>
        <div>
          <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">ETH / USD</div>
          <div className="text-white font-black text-base leading-tight">$3,421.12</div>
          <div className="text-red-400 text-[9px] font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>trending_down</span>-0.82%
          </div>
        </div>
      </div>
      <div className="absolute z-20 px-3 py-2 rounded-xl flex items-center gap-2"
        style={{ bottom: 108, left: 5, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.22)", backdropFilter: "blur(12px)" }}>
        <CryptoIcon3D symbol="ETH" size={44}/>
        <div>
          <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Prize Pool</div>
          <div className="text-cyan-400 font-black text-base leading-tight">1.42 ETH</div>
          <div className="text-slate-500 text-[9px]">Yield only · Safe</div>
        </div>
      </div>
      <div className="absolute z-20 px-3 py-2 rounded-xl"
        style={{ bottom: 58, right: 10, background: "rgba(13,242,128,0.07)", border: "1px solid rgba(13,242,128,0.20)", backdropFilter: "blur(12px)" }}>
        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Win Rate</div>
        <div className="font-black text-xl leading-tight" style={{ color: "#0df280" }}>68%</div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const account = useCurrentAccount();
  const router  = useRouter();

  useEffect(() => {
    if (account) router.push("/tournaments");
  }, [account, router]);

  return (
    <div className="relative z-10 text-slate-100 antialiased overflow-x-hidden min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center px-6 overflow-hidden">
        <div className="absolute inset-0 blue-cyber-grid z-0" />
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[
            [8,12],[22,38],[44,7],[63,22],[79,58],[14,73],[34,88],[53,48],[89,18],[4,53],
            [68,78],[46,32],[81,43],[19,63],[58,9],[37,70],[87,28],[11,36],[51,83],[77,14],
            [30,5],[55,62],[72,33],[6,45],[91,67],[42,20],[26,80],[60,55],[85,10],[17,50],
          ].map(([left, top], i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                left: `${left}%`, top: `${top}%`,
                width: i % 5 === 0 ? "2px" : "1px",
                height: i % 5 === 0 ? "2px" : "1px",
                backgroundColor: i % 7 === 0 ? "rgba(59,130,246,0.4)" : "rgba(148,163,184,0.18)",
              }}
            />
          ))}
        </div>
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
          style={{ background: "rgba(59,130,246,0.07)", filter: "blur(120px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full z-0 pointer-events-none"
          style={{ background: "rgba(6,182,212,0.05)", filter: "blur(80px)" }} />

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-20 pb-32">
          {/* Left — copy: staggered entrance on load */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: EASE_EXPO }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.28)", color: "#60a5fa" }}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">World&apos;s First Lossless Arena</span>
            </motion.div>

            {/* H1 — line by line */}
            <motion.h1
              variants={stagger}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[1.05]"
            >
              {["Unleashing", "the Power", "of"].map((line, i) => (
                <motion.span
                  key={i}
                  variants={fadeUp}
                  transition={{ duration: 0.7, ease: EASE_EXPO }}
                  style={{ display: "block" }}
                >
                  {line}
                </motion.span>
              ))}
              <motion.span
                variants={fadeUp}
                transition={{ duration: 0.7, ease: EASE_EXPO }}
                style={{ display: "block" }}
              >
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}>
                  DexDuel
                </span>
              </motion.span>
            </motion.h1>

            {/* Paragraph */}
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7, ease: EASE_EXPO }}
              className="text-lg text-slate-400 max-w-lg mb-10 leading-relaxed"
            >
              Transforming trading with secure, lossless, and transparent prediction markets. Stake, predict, and win the yield — powered by OneChain.
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={stagger}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: EASE_EXPO }}>
                <Link href="/tournaments"
                  className="px-8 py-4 rounded-lg font-black text-sm uppercase tracking-wider transition-all text-center hover:brightness-110 active:scale-95 block"
                  style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)", color: "#fff", boxShadow: "0 0 24px rgba(59,130,246,0.35)" }}>
                  Enter Arena
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: EASE_EXPO }}>
                <Link href="/tournaments"
                  className="px-8 py-4 rounded-lg font-black text-sm uppercase tracking-wider transition-all text-center hover:bg-white/10 active:scale-95 block"
                  style={{ border: "1px solid rgba(255,255,255,0.18)", color: "#cbd5e1" }}>
                  Discover How It Works
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right — Arena Portal (no entrance animation, it's WebGL-driven) */}
          <ArenaPortal />
        </div>

        {/* Live ticker */}
        <div className="absolute bottom-0 left-0 right-0 z-10 py-4 overflow-hidden whitespace-nowrap"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(2,8,23,0.85)", backdropFilter: "blur(6px)" }}>
          <div className="flex items-center gap-12 animate-marquee">
            <TickerContent />
            <TickerContent />
          </div>
        </div>
      </section>

      {/* ── Why DexDuel? ──────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "rgba(59,130,246,0.05)", filter: "blur(100px)" }} />
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Why{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                DexDuel?
              </span>
            </h2>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
              DexDuel is redefining yield in the digital world. Here&apos;s why it matters.
            </p>
          </Reveal>

          {/* Cards — staggered */}
          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "security",  title: "Zero Risk",        desc: "Your principal is always protected. Losers get 100% of their stake back instantly." },
              { icon: "bolt",      title: "Instant Payouts",  desc: "Yield distributed the moment each round closes. No waiting, no delays." },
              { icon: "bar_chart", title: "Transparency",     desc: "Every round, stake, and outcome is fully verifiable on-chain. No black boxes." },
              { icon: "speed",     title: "Efficiency",       desc: "5-minute rounds on OneChain. The fastest prediction market alive." },
            ].map(({ icon, title, desc }) => (
              <motion.div key={title}
                variants={scaleIn}
                transition={{ duration: 0.65, ease: EASE_EXPO }}
                className="p-6 rounded-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)" }}>
                  <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>{icon}</span>
                </div>
                <h3 className="font-black text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── Parallax Banner 1 ─────────────────────────────────────── */}
      <ParallaxBanner
        words={["Lossless", "Yield Only", "Predict & Win", "OneChain", "Zero Risk"]}
        accent="#3b82f6"
      />

      {/* ── How DexDuel Works / Matters ───────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="absolute left-12 top-16 select-none pointer-events-none"
          style={{ color: "rgba(59,130,246,0.2)", fontSize: "2rem", fontWeight: 100 }}>+</span>
        <span className="absolute right-16 bottom-12 select-none pointer-events-none"
          style={{ color: "rgba(59,130,246,0.2)", fontSize: "2rem", fontWeight: 100 }}>+</span>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left — slides in from left */}
          <Reveal variant={fadeLeft} duration={0.85}>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              Why DexDuel{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                Matters
              </span>
            </h2>
            <p className="text-slate-400 mb-10 leading-relaxed max-w-md">
              DexDuel is revolutionizing how we handle trading and yield. By eliminating principal loss and creating secure, transparent systems, we&apos;re laying the foundation for a fairer financial future.
            </p>
            <Link href="/tournaments"
              className="inline-block px-8 py-4 rounded-lg font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)", color: "#fff", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>
              Enter Arena
            </Link>
          </Reveal>

          {/* Right — slides in from right */}
          <Reveal variant={fadeRight} duration={0.85} delay={0.1} className="hidden lg:flex items-center justify-center">
            <ArenaGraphic />
          </Reveal>
        </div>
      </section>

      {/* ── Parallax Banner 2 ─────────────────────────────────────── */}
      <ParallaxBanner
        words={["BTC", "ETH", "SOL", "Stake", "Predict", "Win the Yield", "Arena"]}
        accent="#06b6d4"
      />

      {/* ── Live Battles ──────────────────────────────────────────── */}
      <section className="py-28 px-6 relative max-w-7xl mx-auto">
        <Reveal className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              Live{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                Battles
              </span>
            </h2>
            <p className="text-slate-500 font-medium mt-1">Predict the next 5-minute price movement</p>
          </div>
          <Link href="/tournaments"
            className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
            style={{ color: "#3b82f6" }}>
            All Markets
            <span className="material-symbols-outlined leading-none">arrow_forward</span>
          </Link>
        </Reveal>

        <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ── BTC ── */}
          <motion.div
            variants={scaleIn}
            transition={{ duration: 0.65, ease: EASE_EXPO }}
            className="p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(59,130,246,0.2)", borderLeft: "4px solid #3b82f6" }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic">BTC / USD</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Round #48,291</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">$64,281.50</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#3b82f6" }}>Locked Price</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(13,242,128,0.08)", border: "1px solid rgba(13,242,128,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span><span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#3b82f6" }}>1.42 ETH</span>
                  <span className="text-lg font-black">04:12</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── ETH ── */}
          <motion.div
            variants={scaleIn}
            transition={{ duration: 0.65, ease: EASE_EXPO }}
            className="p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,77,77,0.2)", borderLeft: "4px solid #ff4d4d" }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic">ETH / USD</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Round #12,834</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">$3,421.12</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#ff4d4d" }}>Locked Price</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(13,242,128,0.08)", border: "1px solid rgba(13,242,128,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span><span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#3b82f6" }}>8.15 ETH</span>
                  <span className="text-lg font-black">02:45</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── SOL ── */}
          <motion.div
            variants={scaleIn}
            transition={{ duration: 0.65, ease: EASE_EXPO }}
            className="p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(6,182,212,0.2)", borderLeft: "4px solid #06b6d4" }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic">SOL / USD</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Round #9,402</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">$145.82</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#06b6d4" }}>Locked Price</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(13,242,128,0.08)", border: "1px solid rgba(13,242,128,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span><span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#06b6d4" }}>24.5 ETH</span>
                  <span className="text-lg font-black">00:58</span>
                </div>
              </div>
            </div>
          </motion.div>
        </StaggerReveal>
      </section>

      {/* ── Parallax Banner 3 ─────────────────────────────────────── */}
      <ParallaxBanner
        words={["Arena Legends", "Top Traders", "Win Rate", "Yield Champions", "Compete"]}
        accent="#3b82f6"
      />

      {/* ── Arena Legends & Community ─────────────────────────────── */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Leaderboard — slides from left */}
          <Reveal variant={fadeLeft} duration={0.85}>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>workspace_premium</span>
              Arena Legends
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <table className="w-full text-left">
                <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <tr style={{ backgroundColor: "rgba(59,130,246,0.06)" }}>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Player</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Win Rate</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Yield Won</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: "01", addr: "0x7a...E921", rate: "82%", yield: "12.4 ETH", gold: true },
                    { rank: "02", addr: "0xf1...3B2a", rate: "76%", yield: "8.1 ETH",  gold: false },
                    { rank: "03", addr: "0x98...C11d", rate: "71%", yield: "5.9 ETH",  gold: false },
                  ].map(({ rank, addr, rate, yield: y, gold }) => (
                    <tr key={rank}
                      className="transition-colors"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ backgroundColor: gold ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.08)" }}>
                            {rank}
                          </div>
                          <span className="font-bold text-sm tracking-tight">{addr}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: "#3b82f6" }}>{rate}</td>
                      <td className="px-6 py-4 text-sm font-black text-right">{y}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* Community CTA — slides from right */}
          <Reveal variant={fadeRight} duration={0.85} delay={0.1} className="flex flex-col justify-center">
            <div className="p-8 rounded-2xl relative overflow-hidden group"
              style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: "7.5rem", color: "#3b82f6" }}>hub</span>
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-4">Join the Collective</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Join 50,000+ players in the Arena Discord. Get real-time alerts, market insights,
                and participate in governance voting for the next OneChain features.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all text-white hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)", boxShadow: "0 0 16px rgba(59,130,246,0.3)" }}>
                  Join Discord
                </button>
                <button className="px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all text-white hover:bg-white/20"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Follow @DexDuel
                </button>
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <Reveal duration={0.6}>
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <span className="material-symbols-outlined text-2xl" style={{ color: "#3b82f6" }}>swords</span>
              <span className="text-sm font-black tracking-tighter uppercase italic">DexDuel</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-slate-500"
              style={{ letterSpacing: "0.2em" }}>
              {["Audit Report", "Privacy Policy", "Terms of Service", "OneChain Explorer"].map((l) => (
                <a key={l} href="#" className="hover:text-blue-400 transition-colors">{l}</a>
              ))}
            </div>
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              © 2025 DexDuel. All rights reserved.
            </div>
          </div>
        </footer>
      </Reveal>

    </div>
  );
}
