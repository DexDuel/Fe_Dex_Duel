function normalize(address: string): string {
  return address.trim().toLowerCase();
}

function isValidAddress(address: string): boolean {
  return address.startsWith("0x") && address.length > 2;
}

function getAllowlist(): Set<string> {
  const raw = process.env.ADMIN_ADDRESSES ?? "";
  const entries = raw
    .split(",")
    .map((value) => normalize(value))
    .filter((value) => value.length > 0 && isValidAddress(value));

  return new Set(entries);
}

export function isAdmin(address?: string | null): boolean {
  if (!address) return false;
  const allowlist = getAllowlist();
  if (allowlist.size === 0) return false;
  return allowlist.has(normalize(address));
}

export function normalizeAdminAddress(address: string): string {
  return normalize(address);
}

export function hasAdminAllowlist(): boolean {
  return getAllowlist().size > 0;
}
