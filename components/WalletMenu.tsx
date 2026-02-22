"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useDisconnectWallet } from "@onelabs/dapp-kit";

interface WalletMenuProps {
  /** Optional: copy button on address row */
  showCopy?: boolean;
}

export function WalletMenu({ showCopy = true }: WalletMenuProps) {
  const account  = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!account) return null;

  function handleCopy() {
    navigator.clipboard.writeText(account!.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDisconnect() {
    disconnect();
    setOpen(false);
    router.push("/");
  }

  const shortAddr = `${account.address.slice(0, 6)}…${account.address.slice(-4)}`;

  return (
    <div ref={ref} className="relative">
      {/* Trigger chip */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-80 transition-all"
        style={{ backgroundColor: "#0df280", color: "#0a0a0a" }}>
        <span className="material-symbols-outlined text-sm leading-none">account_balance_wallet</span>
        {shortAddr}
        <span className="material-symbols-outlined text-sm leading-none">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-xl overflow-hidden z-[100] shadow-2xl animate-fade-in-up"
          style={{ backgroundColor: "#161b22", border: "1px solid rgba(255,255,255,0.1)" }}>

          {/* Address row */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
              Connected Wallet
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-mono text-slate-300 truncate">{shortAddr}</p>
              {showCopy && (
                <button
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-all hover:bg-white/10"
                  style={{ color: copied ? "#0df280" : "#64748b" }}>
                  <span className="material-symbols-outlined text-xs leading-none">
                    {copied ? "check" : "content_copy"}
                  </span>
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-3 flex items-center gap-2 text-sm font-bold hover:bg-white/5 transition-colors text-left">
            <span className="material-symbols-outlined text-base leading-none" style={{ color: "#ff4d4d" }}>
              logout
            </span>
            <span style={{ color: "#ff4d4d" }}>Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
}
