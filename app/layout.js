"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/collection", label: "Collection" },
  { href: "/browse",     label: "Browse"     },
  { href: "/scan",       label: "Scan"       },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavShell />
        <main>{children}</main>
      </body>
    </html>
  );
}

function NavShell() {
  const path = usePathname();
  return (
    <nav style={{
      background: "var(--bg-nav)",
      borderBottom: "1px solid var(--border)",
      height: 52,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 0,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display:"flex", alignItems:"center", gap:8, marginRight:32, textDecoration:"none" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: "linear-gradient(135deg, #f59e0b, #ef4444)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-pixel)", fontSize: 9, color: "#000",
        }}>V</div>
        <span style={{ fontFamily:"var(--font-pixel)", fontSize:10, color:"var(--accent-gold)" }}>VAULT</span>
        <span style={{ fontSize:9, background:"#1e3a5f", color:"#60a5fa", padding:"2px 5px", borderRadius:3, fontWeight:700 }}>BETA</span>
      </Link>

      {/* Nav links */}
      {NAV.map(({ href, label }) => {
        const active = path?.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            padding: "0 16px",
            height: 52,
            display: "flex",
            alignItems: "center",
            fontSize: 13,
            fontWeight: 500,
            color: active ? "var(--accent-gold)" : "var(--text-muted)",
            borderBottom: active ? "2px solid var(--accent-amber)" : "2px solid transparent",
            textDecoration: "none",
            transition: "color 0.15s",
          }}>{label}</Link>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* CARDEX badge */}
      <span style={{ fontFamily:"var(--font-pixel)", fontSize:9, color:"#8b5cf6" }}>CARDEX</span>
    </nav>
  );
}
