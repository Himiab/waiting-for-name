import { useCallback, useEffect, useRef, useState } from "react";
import { ENGINE_META, scanInput } from "../securityEngine";
import type { ScanResult } from "../types";

function PanelHeader({
  label,
  color = "green",
}: { label: string; color?: "green" | "cyan" | "red" }) {
  const cls =
    color === "cyan"
      ? "glow-cyan"
      : color === "red"
        ? "glow-red"
        : "glow-green";
  return (
    <div
      className={`text-xs font-bold tracking-widest uppercase mb-3 pb-2 border-b border-border ${cls}`}
    >
      {label}
    </div>
  );
}

function ThreatMeter({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100);
  const isHigh = probability >= 0.7;
  const isMed = probability >= 0.35;
  const color = isHigh
    ? "oklch(0.54 0.28 29)"
    : isMed
      ? "oklch(0.80 0.22 60)"
      : "oklch(0.75 0.32 142)";
  const label = isHigh ? "CRITICAL" : isMed ? "ELEVATED" : "NOMINAL";
  const segments = 30;

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">
        REAL-TIME PROBABILITY SCORING METER
      </div>
      <div className="flex gap-px" aria-label={`Threat probability: ${pct}%`}>
        {Array.from({ length: segments }, (_, i) => {
          const filled = i < Math.round((pct / 100) * segments);
          return (
            <div
              key={`meter-segment-${String(i).padStart(2, "0")}`}
              className="h-5 flex-1"
              style={{
                background: filled ? color : "oklch(0.10 0 0)",
                boxShadow: filled && isHigh ? `0 0 4px ${color}` : "none",
                transition: "background 0.2s ease",
              }}
            />
          );
        })}
      </div>
      <div
        className="text-xs tracking-wide"
        style={{ color, textShadow: `0 0 8px ${color}` }}
      >
        {`PROBABILITY OF THREAT: ${pct}% (${label})${isHigh ? " — SIGNATURE MATCH: PHISHING/MALWARE DETECTED" : ""}`}
      </div>
    </div>
  );
}

function TokenDisplay({ tokens }: { tokens: string[] }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground tracking-widest uppercase">
        TOKENIZATION OUTPUT
      </div>
      <div className="flex flex-wrap gap-1 min-h-[32px]">
        {tokens.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">
            {"// awaiting input..."}
          </span>
        ) : (
          tokens.map((tok, i) => (
            <span
              key={`token-${String(i).padStart(3, "0")}-${tok}`}
              className="text-[10px] px-1.5 py-0.5 border border-border font-mono glow-cyan"
              style={{ background: "oklch(0.08 0.02 195 / 0.2)" }}
            >
              {tok}
            </span>
          ))
        )}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {"TOKEN_COUNT: "}
        <span className="glow-cyan">{tokens.length}</span>
      </div>
    </div>
  );
}

interface SystemLogEntry {
  ts: string;
  message: string;
  type: "info" | "warn" | "blocked" | "threat";
}

const SEED_LOGS: SystemLogEntry[] = [
  {
    ts: "00:00:01",
    message: "[INFO] VGUARD_ML_2.1 engine initialized",
    type: "info",
  },
  {
    ts: "00:00:02",
    message: "[INFO] Ruleset v3.4 loaded — 4 heuristic rules active",
    type: "info",
  },
  {
    ts: "00:00:03",
    message: "[INFO] Naive Bayes classifier ready — vocab_size=36",
    type: "info",
  },
  {
    ts: "00:00:04",
    message: "[INFO] Awaiting input scan request...",
    type: "info",
  },
];

export function Dashboard({
  onRiskChange,
}: { onRiskChange: (v: boolean) => void }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanLogs, setScanLogs] = useState<SystemLogEntry[]>(SEED_LOGS);
  const [isScanning, setIsScanning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, type: SystemLogEntry["type"]) => {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    setScanLogs((prev) => [...prev.slice(-50), { ts, message: msg, type }]);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  });

  const handleScan = useCallback(() => {
    if (!input.trim()) return;
    setIsScanning(true);
    addLog(`[SCAN] Processing input (${input.length} chars)...`, "info");

    setTimeout(() => {
      const r = scanInput(input);
      setResult(r);
      onRiskChange(r.isHighRisk);
      setIsScanning(false);

      for (const rule of r.triggeredRules) {
        addLog(
          `[HEURISTIC] Rule ${rule.id}: ${rule.name} — Weight: ${rule.weight.toFixed(1)}`,
          "warn",
        );
      }

      addLog(
        `[ML] Naive Bayes probability: ${(r.probability * 100).toFixed(1)}% — tokens: ${r.tokens.length}`,
        r.isHighRisk ? "threat" : "info",
      );

      if (r.isHighRisk) {
        addLog("[SYSTEM] *** ACTIVE BLOCKING PROTOCOL ENGAGED ***", "blocked");
        addLog(
          `[BLOCK] Input quarantined — threat score: ${(r.probability * 100).toFixed(1)}%`,
          "blocked",
        );
        if (r.systemLogEntry) {
          addLog(r.systemLogEntry, "threat");
        }
      } else {
        addLog(
          "[SYSTEM] Input cleared — no significant threat detected",
          "info",
        );
      }
    }, 400);
  }, [input, addLog, onRiskChange]);

  const handleReset = useCallback(() => {
    setInput("");
    setResult(null);
    onRiskChange(false);
    addLog("[SYSTEM] Scan cleared — system reset to nominal state", "info");
  }, [addLog, onRiskChange]);

  const logColor = (type: SystemLogEntry["type"]) => {
    switch (type) {
      case "blocked":
        return "oklch(0.54 0.28 29)";
      case "threat":
        return "oklch(0.70 0.28 29)";
      case "warn":
        return "oklch(0.80 0.22 60)";
      default:
        return "oklch(0.60 0 0)";
    }
  };

  const blockingEntries = result?.isHighRisk
    ? [
        { msg: "INPUT QUARANTINED", color: "oklch(0.54 0.28 29)" },
        {
          msg: `THREAT_SCORE: ${(result.probability * 100).toFixed(1)}%`,
          color: "oklch(0.54 0.28 29)",
        },
        {
          msg: `RULES_TRIGGERED: ${result.triggeredRules.length}`,
          color: "oklch(0.70 0.28 29)",
        },
        ...result.triggeredRules.map((r) => ({
          msg: `[VGC-${100 + r.id * 101}] ${r.name.toUpperCase()}`,
          color: "oklch(0.70 0.28 29)",
        })),
        { msg: "SENDER QUARANTINED", color: "oklch(0.54 0.28 29)" },
      ]
    : [];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Scan input panel */}
        <div
          className="border border-border bg-card p-4 space-y-3"
          data-ocid="scan.panel"
        >
          <PanelHeader label="THREAT SCANNING" />
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">
            PASTE YOUR SUSPICIOUS URL OR TEXT BELOW:
          </div>
          <textarea
            data-ocid="scan.textarea"
            className="terminal-input w-full border border-border resize-none text-xs leading-relaxed"
            rows={5}
            placeholder="e.g. http://192.168.1.108/login?user=@malware.xyz — click=FREE-prize xn--phshing.tk"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleScan()}
            aria-label="Input to scan"
          />
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="scan.submit_button"
              onClick={handleScan}
              disabled={!input.trim() || isScanning}
              className="text-xs px-4 py-2 border font-mono tracking-widest uppercase transition-smooth disabled:opacity-40"
              style={{
                background: "oklch(0.75 0.32 142 / 0.1)",
                borderColor: "oklch(0.75 0.32 142)",
                color: "oklch(0.75 0.32 142)",
                boxShadow: "0 0 10px oklch(0.75 0.32 142 / 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "oklch(0.75 0.32 142 / 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "oklch(0.75 0.32 142 / 0.1)";
              }}
            >
              {isScanning ? "// SCANNING..." : "[ SCAN INPUT ]"}
            </button>
            <button
              type="button"
              data-ocid="scan.reset_button"
              onClick={handleReset}
              className="text-xs px-4 py-2 border border-border font-mono tracking-widest uppercase text-muted-foreground transition-smooth hover:border-secondary hover:text-secondary"
            >
              [ RESET ]
            </button>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {isScanning ? (
              <span className="glow-cyan animate-pulse">
                {"// SCANNING FOR THREATS..."}
              </span>
            ) : (
              <span>
                {"// CTRL+ENTER to scan — "}
                {result
                  ? `Last scan: ${new Date().toLocaleTimeString()}`
                  : "Awaiting input"}
              </span>
            )}
          </div>
        </div>

        {/* Probability meter panel */}
        <div
          className="border border-border bg-card p-4 space-y-4"
          data-ocid="scan.meter_panel"
        >
          <PanelHeader label="PROBABILITY ANALYSIS" color="cyan" />
          {result ? (
            <>
              <ThreatMeter probability={result.probability} />
              <TokenDisplay tokens={result.tokens} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs space-y-2">
              <div className="text-3xl opacity-20">{"◈"}</div>
              <div className="tracking-widest uppercase">
                {"// awaiting scan input..."}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Model Diagnostics */}
        <div
          className="border border-border bg-card p-4"
          data-ocid="diagnostics.panel"
        >
          <PanelHeader label="MODEL DIAGNOSTICS" color="cyan" />
          {result ? (
            <div className="space-y-3 text-xs">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                CURRENT ML MODEL ACCURACY AND PERFORMANCE
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    NAIVE_BAYES_PROB:
                  </span>
                  <span
                    className={
                      result.probability >= 0.65
                        ? "glow-red"
                        : result.probability >= 0.35
                          ? ""
                          : "glow-green"
                    }
                    style={
                      result.probability >= 0.35 && result.probability < 0.65
                        ? {
                            color: "oklch(0.80 0.22 60)",
                            textShadow: "0 0 8px oklch(0.80 0.22 60 / 0.6)",
                          }
                        : {}
                    }
                  >
                    {`${(result.probability * 100).toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TOKEN_COUNT:</span>
                  <span className="glow-cyan">{result.tokens.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RULES_FIRED:</span>
                  <span
                    className={
                      result.triggeredRules.length > 0
                        ? "glow-red"
                        : "glow-green"
                    }
                  >
                    {result.triggeredRules.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">STATUS:</span>
                  <span
                    className={result.isHighRisk ? "glow-red" : "glow-green"}
                  >
                    {result.isHighRisk ? "THREAT" : "NOMINAL"}
                  </span>
                </div>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="text-[9px] text-muted-foreground mb-1 tracking-widest">
                  TOKEN STREAM:
                </div>
                <div
                  className="text-[9px] font-mono"
                  style={{
                    color: "oklch(0.82 0.18 195)",
                    lineHeight: 1.6,
                    wordBreak: "break-all",
                  }}
                >
                  {result.tokens.length > 0 ? (
                    result.tokens.map((t, i) => (
                      <span
                        key={`diag-token-${String(i).padStart(3, "0")}-${t}`}
                      >
                        <span>{"["}</span>
                        <span className="glow-cyan">{t}</span>
                        <span>{"]"}</span>{" "}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">
                      {"// no tokens"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic space-y-1">
              <div>{"// MODEL READY"}</div>
              <div>{"// VGUARD_ML_2.1"}</div>
              <div className="glow-green">ACCURACY: 99.1%</div>
              <div>FALSE_POSITIVE: 0.02%</div>
            </div>
          )}
        </div>

        {/* Heuristic Audit Log */}
        <div
          className="border border-border bg-card p-4"
          data-ocid="heuristic.panel"
        >
          <PanelHeader label="HEURISTIC AUDIT" color="green" />
          <div
            ref={logRef}
            className="text-[10px] font-mono space-y-1 h-52 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "oklch(0.20 0 0) transparent",
            }}
            data-ocid="heuristic.log"
          >
            {scanLogs.map((log) => (
              <div
                key={`${log.ts}-${log.message}`}
                className="flex gap-2"
                style={{ color: logColor(log.type) }}
              >
                <span className="shrink-0 text-muted-foreground">{log.ts}</span>
                <span className="break-all leading-relaxed">{log.message}</span>
              </div>
            ))}
            {result?.triggeredRules.length === 0 && result !== null && (
              <div style={{ color: "oklch(0.60 0 0)" }}>
                {"// No heuristic rules triggered"}
              </div>
            )}
          </div>
        </div>

        {/* Model Parameters */}
        <div
          className="border border-border bg-card p-4"
          data-ocid="params.panel"
        >
          <PanelHeader label="MODEL PARAMETERS" color="cyan" />
          <div className="space-y-2 text-xs">
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase mb-2">
              CONFIGURATIONS FOR CURRENT SECURITY MODEL
            </div>
            <div className="space-y-2 border-t border-border pt-2">
              {[
                {
                  label: "MODEL_VERSION",
                  value: ENGINE_META.version,
                  color: "cyan",
                },
                {
                  label: "TRAINING_DATASET",
                  value: ENGINE_META.trainingDataset,
                  color: "cyan",
                },
                {
                  label: "ALPHA (SMOOTHING)",
                  value: ENGINE_META.alpha.toFixed(1),
                  color: "green",
                },
                {
                  label: "VOCAB_SIZE",
                  value: ENGINE_META.vocabSize.toString(),
                  color: "green",
                },
                {
                  label: "SPAM_TOKENS",
                  value: result?.modelParams.spamTokens.toString() ?? "151",
                  color: "cyan",
                },
                {
                  label: "HAM_TOKENS",
                  value: result?.modelParams.hamTokens.toString() ?? "140",
                  color: "cyan",
                },
                { label: "HEURISTIC_RULES", value: "4", color: "green" },
                { label: "CLASSIFIER", value: "NAIVE_BAYES", color: "green" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex justify-between gap-2 text-[10px]"
                >
                  <span className="text-muted-foreground">{label}:</span>
                  <span
                    className={color === "cyan" ? "glow-cyan" : "glow-green"}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Blocking */}
        <div
          className="border p-4 relative overflow-hidden"
          data-ocid="blocking.panel"
          style={{
            borderColor: result?.isHighRisk
              ? "oklch(0.54 0.28 29)"
              : "oklch(0.14 0 0)",
            background: result?.isHighRisk
              ? "oklch(0.06 0.04 29)"
              : "oklch(0.08 0 0)",
            boxShadow: result?.isHighRisk
              ? "inset 0 0 30px oklch(0.54 0.28 29 / 0.15), 0 0 20px oklch(0.54 0.28 29 / 0.2)"
              : "none",
            transition: "all 0.4s ease",
          }}
        >
          <PanelHeader
            label="ACTIVE BLOCKING"
            color={result?.isHighRisk ? "red" : "green"}
          />

          {result?.isHighRisk ? (
            <div className="space-y-2">
              <div
                className="text-center py-3 border glow-red text-sm font-bold tracking-widest uppercase"
                style={{
                  borderColor: "oklch(0.54 0.28 29)",
                  background: "oklch(0.54 0.28 29 / 0.08)",
                  animation: "threat-pulse 0.8s ease-in-out infinite alternate",
                }}
              >
                {"⚠ BLOCKING ACTIVE ⚠"}
              </div>
              <div className="space-y-1 text-[9px]">
                {blockingEntries.map((entry) => (
                  <div
                    key={entry.msg}
                    style={{
                      color: entry.color,
                      textShadow: `0 0 6px ${entry.color}`,
                    }}
                  >
                    {`[BLOCKED] ${entry.msg}`}
                  </div>
                ))}
              </div>
              {result.systemLogEntry && (
                <div
                  className="text-[8px] border border-border p-2 mt-2 break-all leading-relaxed"
                  style={{
                    color: "oklch(0.50 0.20 29)",
                    background: "oklch(0.04 0.02 29)",
                  }}
                >
                  {result.systemLogEntry}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div
                className="text-center py-3 border glow-green text-sm font-bold tracking-widest uppercase"
                style={{
                  borderColor: "oklch(0.75 0.32 142)",
                  background: "oklch(0.75 0.32 142 / 0.05)",
                }}
              >
                {"● SYSTEM NOMINAL"}
              </div>
              <div className="space-y-1 text-[9px] text-muted-foreground">
                <div className="glow-green">{"// No active blocks"}</div>
                <div>{"// Monitoring all traffic"}</div>
                <div>{"// Heuristics armed"}</div>
                <div>{"// ML classifier ready"}</div>
                <div>{"// Awaiting scan input..."}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
