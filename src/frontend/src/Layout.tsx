import { type ReactNode, useEffect, useState } from "react";

interface LayoutProps {
  children: ReactNode;
  isHighRisk?: boolean;
}

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Layout({ children, isHighRisk = false }: LayoutProps) {
  const time = useClock();
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(
      () => setUptime(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });
  const latency = 8 + Math.floor(Math.random() * 6);

  return (
    <div
      className={`min-h-screen font-mono flex flex-col relative overflow-hidden ${
        isHighRisk ? "bg-[oklch(0.04_0.04_29)]" : "bg-background"
      }`}
      style={{ transition: "background-color 0.4s ease" }}
    >
      {/* Scanline overlay */}
      <div
        className="scanline pointer-events-none fixed inset-0 z-50 opacity-30"
        aria-hidden="true"
      />

      {/* CRT vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Threat border pulse */}
      {isHighRisk && (
        <div
          className="pointer-events-none fixed inset-0 z-30 border-2 border-destructive"
          style={{
            animation: "threat-pulse 0.6s ease-in-out infinite alternate",
            boxShadow:
              "inset 0 0 40px oklch(0.54 0.28 29 / 0.3), 0 0 40px oklch(0.54 0.28 29 / 0.3)",
          }}
          aria-hidden="true"
        />
      )}

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header
        className={`relative z-10 border-b px-6 py-3 flex items-center justify-between ${
          isHighRisk
            ? "border-destructive bg-[oklch(0.06_0.04_29)]"
            : "border-primary bg-card"
        }`}
        style={
          isHighRisk
            ? { boxShadow: "0 2px 20px oklch(0.54 0.28 29 / 0.4)" }
            : { boxShadow: "0 2px 20px oklch(0.75 0.32 142 / 0.15)" }
        }
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <polygon
              points="14,2 26,8 26,20 14,26 2,20 2,8"
              stroke={
                isHighRisk ? "oklch(0.54 0.28 29)" : "oklch(0.75 0.32 142)"
              }
              strokeWidth="1.5"
              fill="none"
              style={{
                filter: isHighRisk
                  ? "drop-shadow(0 0 4px oklch(0.54 0.28 29))"
                  : "drop-shadow(0 0 4px oklch(0.75 0.32 142))",
              }}
            />
            <polygon
              points="14,6 22,10 22,18 14,22 6,18 6,10"
              fill={
                isHighRisk
                  ? "oklch(0.54 0.28 29 / 0.15)"
                  : "oklch(0.75 0.32 142 / 0.1)"
              }
              stroke={
                isHighRisk
                  ? "oklch(0.54 0.28 29 / 0.6)"
                  : "oklch(0.75 0.32 142 / 0.6)"
              }
              strokeWidth="0.5"
            />
          </svg>
          <div>
            <div
              className={`text-lg font-bold tracking-[0.25em] uppercase ${isHighRisk ? "glow-red" : "glow-green"}`}
              style={{ letterSpacing: "0.25em" }}
            >
              VANGUARD CYBER
            </div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">
              {isHighRisk
                ? "// THREAT ACTIVE — SYSTEM ALERT //"
                : "// THREAT DETECTION SYSTEM v2.1 //"}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>
            UP_TIME:{" "}
            <span className={isHighRisk ? "glow-red" : "glow-green"}>
              {formatUptime(uptime)}
            </span>
          </span>
          <span>
            LATENCY: <span className="glow-cyan">{latency}ms</span>
          </span>
          <span>
            TIME: <span className="text-foreground">{timeStr}</span>
          </span>
          <span className="flex items-center gap-1.5">
            ML_NODE:{" "}
            <span
              className={`flex items-center gap-1 ${isHighRisk ? "glow-red" : "glow-green"}`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: isHighRisk
                    ? "oklch(0.54 0.28 29)"
                    : "oklch(0.75 0.32 142)",
                  boxShadow: isHighRisk
                    ? "0 0 6px oklch(0.54 0.28 29)"
                    : "0 0 6px oklch(0.75 0.32 142)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              {isHighRisk ? "THREAT_DETECTED" : "ONLINE"}
            </span>
          </span>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 overflow-auto">{children}</main>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border bg-card px-6 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {"© "}
          {new Date().getFullYear()}
          {" // VANGUARD CYBER DEFENSE SYSTEM // ALL RIGHTS RESERVED"}
        </span>
        <span>
          Built with{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:glow-green transition-colors"
          >
            caffeine.ai
          </a>
        </span>
      </footer>
    </div>
  );
}
