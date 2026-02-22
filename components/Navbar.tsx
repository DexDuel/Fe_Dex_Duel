"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton, useCurrentAccount } from "@onelabs/dapp-kit";
import { Zap, BarChart2, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { shortenAddress } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/arena", label: "Arena", icon: Zap },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart2 },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const account = useCurrentAccount();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07]" style={{ background: "rgba(7,8,15,0.85)", backdropFilter: "blur(20px)" }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg group-hover:shadow-violet-500/30 transition-shadow">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight">
            DexDuel
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {account ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {shortenAddress(account.address)}
              </div>
              <ConnectButton />
            </div>
          ) : (
            <ConnectButton />
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg glass-hover text-gray-400"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] px-4 py-3 space-y-1 animate-fade-in">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
