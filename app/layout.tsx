import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shuttle Tracker Beta",
  description: "Crowdsourced Bellville <-> D6 shuttle tracking beta"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="container nav">
            <h1>Shuttle Tracker Beta</h1>
            <nav>
              <Link href="/">Home</Link>
              <Link href="/map">Map</Link>
              <Link href="/contributors">Contributors</Link>
              <Link href="/reporter">Reporter</Link>
              <Link href="/admin">Admin</Link>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
