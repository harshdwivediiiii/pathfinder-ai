"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        padding: "20px",
        borderBottom: "1px solid #333",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Pathfinder AI
      </h1>

      <nav style={{ display: "flex", gap: "20px" }}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    </header>
  );
}

