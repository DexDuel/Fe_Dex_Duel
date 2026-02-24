"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton, useCurrentAccount } from "@onelabs/dapp-kit";
import { WalletMenu } from "./WalletMenu";
import { FaucetButton } from "./FaucetButton";
import { useUSDTBalance } from "@/hooks/useUSDTBalance";
import { useState, useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const account = useCurrentAccount();
  const { balance, refetch: refetchBalance } = useUSDTBalance(account?.address);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const navLinks = [
    { href: "/tournaments", label: "Tournaments" },
    { href: "/arena", label: "Create Tournaments" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/profile", label: "My Arena" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 glass-panel bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-3xl transition-transform group-hover:rotate-12" style={{ color: "#0df280" }}>
              swords
            </span>
            <div className="flex flex-col leading-none">
              <h1 className="text-sm font-black tracking-tighter uppercase italic text-white">
                GameFi
              </h1>
              <h1 className="text-sm font-black tracking-tighter uppercase italic" style={{ color: "#0df280" }}>
                Arena
              </h1>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all relative py-1 ${
                    active ? "text-[#0df280]" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-[#0df280] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {account && mounted && (
            <div className="hidden sm:flex items-center gap-3">
              {/* Balance */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="material-symbols-outlined text-sm leading-none" style={{ color: "#0df280" }}>
                  toll
                </span>
                <span className="text-slate-300">
                  {balance ? `${balance.formatted} USDT` : "..."}
                </span>
              </div>

              {/* Faucet */}
              <FaucetButton address={account.address} onSuccess={refetchBalance} />
            </div>
          )}

          {/* Wallet Section */}
          <div className="flex items-center gap-2">
            {account ? <WalletMenu /> : <ConnectButton />}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#0a0a0a] px-4 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    active 
                      ? "bg-[#0df280]/10 text-[#0df280] border border-[#0df280]/20" 
                      : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          
          {account && (
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="px-4 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                <span>Balance</span>
                <span className="text-[#0df280]">
                  {balance ? `${balance.formatted} USDT` : "..."}
                </span>
              </div>
              <div className="px-4">
                <FaucetButton address={account.address} onSuccess={refetchBalance} />
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
