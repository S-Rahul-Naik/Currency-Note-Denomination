import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  Repeat,
  History as HistoryIcon,
  Volume2,
  Wifi,
  WifiOff,
  Cpu,
  ChevronRight,
  Sparkles,
  BarChart2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/base/PageHeader";
import { StatusPill } from "@/components/base/StatusPill";
import { useApp } from "@/context/AppProvider";
import { useVoice } from "@/context/VoiceProvider";
import { getCurrency, formatAmount } from "@/constants/currencies";
import { MOCK_HISTORY } from "@/mocks/history";
import { isOpenScanCommand, listenForVoiceCommand } from "@/services/voice/voiceCommands";
import type { DetectionStatus } from "@/types";

// ─── Today’s Stats Banner ───────────────────────────────────────────────────

function TodayStatsBanner() {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (MOCK_HISTORY.length === 0) return null;
    // Find the most recent date in history — treat as "today" for demo
    const mostRecent = MOCK_HISTORY.map((r) => r.createdAt.slice(0, 10)).sort().reverse()[0];
    const todayItems = MOCK_HISTORY.filter((r) => r.createdAt.startsWith(mostRecent));
    if (todayItems.length === 0) return null;

    const regularScans = todayItems.filter((r) => r.source !== "counterfeit_check");
    const successCount = regularScans.filter((r) => r.status === "success").length;
    const successRate = regularScans.length > 0 ? Math.round((successCount / regularScans.length) * 100) : 100;
    const cfItems = todayItems.filter((r) => r.source === "counterfeit_check");
    const flagged = cfItems.filter((r) => r.counterfeitVerdict === "suspicious" || r.counterfeitVerdict === "counterfeit");

    return {
      date: new Date(mostRecent + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      total: todayItems.length,
      successRate,
      flaggedCount: flagged.length,
      flaggedVerdict: flagged[0]?.counterfeitVerdict ?? null,
    };
  }, []);

  if (!stats) return null;

  const hasFlagged = stats.flaggedCount > 0;
  const FlagIcon = stats.flaggedVerdict === "counterfeit" ? ShieldX : ShieldAlert;
  const flagColor = stats.flaggedVerdict === "counterfeit" ? "text-red-600" : "text-accent-700";
  const flagBg   = stats.flaggedVerdict === "counterfeit" ? "bg-red-50 ring-red-200" : "bg-accent-50 ring-accent-200";

  return (
    <button
      onClick={() => navigate("/history")}
      aria-label="View today’s detection statistics"
      className="surface w-full cursor-pointer overflow-hidden rounded-2xl text-left transition-colors hover:bg-background-100"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500" aria-hidden="true" />

      <div className="flex items-center gap-4 px-4 py-4">
        {/* Icon */}
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
        </span>

        {/* Title + date */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground-950">Today’s Stats</p>
          <p className="text-xs text-foreground-500">{stats.date}</p>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-foreground-400" aria-hidden="true" />
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-px bg-background-200 border-t border-background-200">
        {/* Total scans */}
        <div className="flex flex-col items-center bg-background-50 py-3 px-2">
          <span className="text-2xl font-bold text-foreground-950">{stats.total}</span>
          <span className="mt-0.5 text-[10px] font-semibold text-foreground-500">Scans today</span>
        </div>

        {/* Success rate */}
        <div className="flex flex-col items-center bg-background-50 py-3 px-2">
          <span className={`text-2xl font-bold ${
            stats.successRate >= 90 ? "text-primary-700" :
            stats.successRate >= 70 ? "text-accent-700" :
            "text-foreground-700"
          }`}>{stats.successRate}%</span>
          <span className="mt-0.5 text-[10px] font-semibold text-foreground-500">Success rate</span>
        </div>

        {/* Flagged */}
        <div className="flex flex-col items-center bg-background-50 py-3 px-2">
          {hasFlagged ? (
            <>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 ${flagBg}`}>
                <FlagIcon className={`h-4 w-4 ${flagColor}`} aria-hidden="true" />
              </span>
              <span className="mt-1 text-[10px] font-semibold text-foreground-500">{stats.flaggedCount} flagged</span>
            </>
          ) : (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 ring-1 ring-primary-200">
                <ShieldCheck className="h-4 w-4 text-primary-600" aria-hidden="true" />
              </span>
              <span className="mt-1 text-[10px] font-semibold text-foreground-500">All clear</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Recent Detections mini-list ────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function statusVisuals(status: DetectionStatus): {
  icon: typeof CheckCircle2;
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case "success":
      return {
        icon: CheckCircle2,
        bg: "bg-primary-50 text-primary-700",
        text: "text-primary-700",
        label: "Success",
      };
    case "low_confidence":
      return {
        icon: AlertTriangle,
        bg: "bg-accent-50 text-accent-800",
        text: "text-accent-800",
        label: "Low conf.",
      };
    case "wrong_currency":
      return {
        icon: AlertTriangle,
        bg: "bg-secondary-50 text-secondary-700",
        text: "text-secondary-700",
        label: "Mismatch",
      };
    default:
      return {
        icon: XCircle,
        bg: "bg-background-100 text-foreground-600",
        text: "text-foreground-600",
        label: "Error",
      };
  }
}

function RecentDetections() {
  const navigate = useNavigate();
  const recent = MOCK_HISTORY.slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <section aria-label="Recent detections">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground-950">
          <HistoryIcon aria-hidden="true" className="h-4 w-4 text-foreground-500" />
          Recent Detections
        </h2>
        <button
          onClick={() => navigate("/history")}
          className="flex cursor-pointer items-center gap-1 text-xs font-bold text-primary-700 transition-colors hover:text-primary-900"
        >
          View all
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Items */}
      <ul className="space-y-2.5">
        {recent.map((item) => {
          const cur = getCurrency(item.currency);
          const vis = statusVisuals(item.status);
          const Icon = vis.icon;
          const conf = Math.round(item.confidence * 100);
          return (
            <li key={item.id}>
              <button
                onClick={() => navigate("/history")}
                className="surface flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-background-100"
              >
                {/* Flag avatar */}
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background-100 text-2xl ring-1 ring-background-200"
                >
                  {cur.flag}
                </span>

                {/* Meta */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground-950">
                    {formatAmount(item.currency, item.denomination)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-500">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${vis.text}`}
                    >
                      <Icon aria-hidden="true" className="h-3 w-3" />
                      {vis.label}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{conf}% conf.</span>
                    <span aria-hidden="true">·</span>
                    <span>{timeAgo(item.createdAt)}</span>
                  </p>
                </div>

                {/* Status badge */}
                <span
                  aria-label={vis.label}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${vis.bg}`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface StatusRow {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "ok" | "warn" | "off" | "info";
}

export default function Home() {
  const navigate = useNavigate();
  const { preferences } = useApp();
  const { supported, selectedVoice, settings, speak } = useVoice();
  const greeted = useRef(false);
  const commandListening = useRef(false);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const listenForScanCommand = async () => {
      if (commandListening.current) return;
      commandListening.current = true;
      if (settings.autoSpeak) {
        await speak("Home. Say hey, open scan currency, to start scanning.", "confirmation");
      }
      const command = await listenForVoiceCommand("en-IN", 15000);
      commandListening.current = false;
      if (isOpenScanCommand(command)) navigate("/scan");
    };
    void listenForScanCommand();
    if (settings.vibration) {
      try {
        navigator.vibrate?.([60, 60, 60]);
      } catch {
        /* ignore */
      }
    }
  }, [navigate, settings.autoSpeak, settings.vibration, speak]);

  const online = window.navigator.onLine;
  const currency = getCurrency(preferences.detectionCurrency);
  const modeLabel =
    preferences.detectionMode === "single"
      ? "Single"
      : preferences.detectionMode === "multiple"
        ? "Multiple"
        : "Automatic";

  const statusRows: StatusRow[] = [
    {
      icon: Volume2,
      label: "Voice",
      value: supported ? `${selectedVoice.name} · ${selectedVoice.family}` : "Not supported",
      tone: supported ? "ok" : "off",
    },
    {
      icon: online ? Wifi : WifiOff,
      label: "Network",
      value: online ? "Online" : "Offline",
      tone: online ? "ok" : "warn",
    },
    {
      icon: Cpu,
      label: "AI Model",
      value: preferences.offlineModel ? "Offline · On-device" : "Online (demo)",
      tone: preferences.offlineModel ? "info" : "off",
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Home"
        subtitle="DhanDrishti is ready to help you identify currency."
      />

      <div className="space-y-5 px-5 py-6 md:px-8 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6 lg:space-y-0">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          {/* HERO SCAN card */}
          <section
            className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-6 md:p-8 lg:p-10"
            aria-label="Scan a currency"
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-primary-400/10 blur-2xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-background-50/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-100 ring-1 ring-background-50/15">
                  Smart Recognition
                </span>
                <Sparkles aria-hidden="true" className="h-5 w-5 text-accent-400" />
              </div>

              <p className="mt-6 max-w-lg font-heading text-3xl font-bold leading-tight text-background-50 md:text-4xl lg:text-5xl">
                Point, scan, and <span className="text-gradient-gold">hear your money.</span>
              </p>
              <p className="mt-3 text-sm text-primary-100/80 md:text-base">
                {currency.flag} Detecting <strong className="text-primary-100">{currency.name} ({currency.code})</strong> · {modeLabel} mode.
              </p>

              <div className="relative mt-6 h-px w-full overflow-hidden rounded-full bg-background-50/15" aria-hidden="true">
                <span
                  className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-accent-400/80 to-transparent"
                  style={{ backgroundSize: "40% 100%", backgroundRepeat: "no-repeat" }}
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/scan")}
                  aria-label="Scan currency now"
                  className="flex min-h-16 flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl bg-background-50 px-6 py-4 text-primary-800 transition-colors hover:bg-primary-50 active:scale-[0.99]"
                >
                  <ScanLine aria-hidden="true" className="h-7 w-7" strokeWidth={2.5} />
                  <span className="font-heading text-xl font-bold tracking-wide">SCAN CURRENCY</span>
                </button>
                <button
                  onClick={() => navigate("/history")}
                  aria-label="View detection history"
                  className="hidden items-center justify-center gap-2 rounded-xl border border-background-50/20 bg-background-50/10 px-6 py-4 text-background-50 transition-colors hover:bg-background-50/20 sm:flex"
                >
                  <HistoryIcon aria-hidden="true" className="h-5 w-5" />
                  <span className="font-semibold">History</span>
                </button>
              </div>
            </div>
          </section>

          {/* Status indicators */}
          <section aria-label="System status" className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {statusRows.map((row) => {
              const Icon = row.icon;
              const dotColor =
                row.tone === "ok"
                  ? "bg-primary-500"
                  : row.tone === "warn"
                    ? "bg-accent-500"
                    : row.tone === "info"
                      ? "bg-secondary-500"
                      : "bg-background-400";
              const iconBg =
                row.tone === "ok"
                  ? "bg-primary-50 text-primary-700"
                  : row.tone === "warn"
                    ? "bg-accent-50 text-accent-800"
                    : row.tone === "info"
                      ? "bg-secondary-50 text-secondary-700"
                      : "bg-background-100 text-foreground-600";
              return (
                <div key={row.label} className="surface flex flex-col gap-2.5 overflow-hidden rounded-2xl p-3.5 sm:p-4">
                  {/* Icon + status dot row */}
                  <div className="flex items-center justify-between">
                    <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${iconBg}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  </div>
                  {/* Text */}
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium text-foreground-500 sm:text-xs">{row.label}</p>
                    <p className="truncate text-xs font-bold text-foreground-950 sm:text-sm">{row.value}</p>
                  </div>
                  {/* Pill — hidden on mobile, visible on sm+ */}
                  <div className="hidden sm:block">
                    <StatusPill
                      icon={<span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />}
                      label={row.tone === "ok" ? "Ready" : row.tone === "warn" ? "Check" : "Info"}
                      tone={row.tone}
                    />
                  </div>
                </div>
              );
            })}
          </section>

          {/* Today's stats banner */}
          <TodayStatsBanner />

          {/* Recent detections */}
          <RecentDetections />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Detection currency card */}
          <button
            onClick={() => navigate("/preferences/currency")}
            className="surface flex w-full cursor-pointer items-center gap-4 rounded-2xl p-5 text-left transition-colors hover:bg-background-100"
            aria-label="Change detection currency settings"
          >
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-background-100 text-3xl ring-1 ring-background-200"
            >
              {currency.flag}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground-500">Detection currency</p>
              <p className="truncate text-base font-bold text-foreground-950">
                {currency.code} — {currency.name}
              </p>
              <p className="text-xs text-foreground-500">Mode: {modeLabel}</p>
            </div>
            <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-foreground-400" />
          </button>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/convert")}
              className="surface group flex cursor-pointer flex-col gap-3 rounded-2xl p-4 transition-colors hover:bg-background-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700 transition-colors group-hover:bg-secondary-200">
                <Repeat aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground-950">Converter</p>
                <p className="text-xs text-foreground-500">Exchange rates</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/history")}
              className="surface group flex cursor-pointer flex-col gap-3 rounded-2xl p-4 transition-colors hover:bg-background-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-800 transition-colors group-hover:bg-accent-200">
                <HistoryIcon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground-950">History</p>
                <p className="text-xs text-foreground-500">Past scans</p>
              </div>
            </button>
          </div>

          {/* Counterfeit Check feature card */}
          <button
            onClick={() => navigate("/scan/counterfeit")}
            className="group relative w-full cursor-pointer overflow-hidden rounded-2xl"
            aria-label="Run counterfeit detection check"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-900 transition-all duration-300 group-hover:from-primary-600 group-hover:to-primary-800" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" aria-hidden="true" />
            <div className="relative flex items-center gap-3.5 px-4 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background-50/10 ring-1 ring-background-50/15">
                <ShieldCheck aria-hidden="true" className="h-6 w-6 text-primary-200" />
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-bold text-background-50">Counterfeit Check</p>
                <p className="text-xs text-primary-200">7-point AI security analysis</p>
              </div>
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-300" />
            </div>
          </button>

          {/* Analytics teaser — desktop only */}
          <button
            onClick={() => navigate("/history")}
            className="surface hidden w-full cursor-pointer items-start gap-4 rounded-2xl p-5 transition-colors hover:bg-background-100 lg:flex"
            aria-label="View detection analytics"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <BarChart2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-bold text-foreground-950">Detection Analytics</p>
              <p className="mt-0.5 text-xs text-foreground-500">Success rate, confidence trends, currency breakdown.</p>
            </div>
            <ArrowRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-foreground-400" />
          </button>
        </div>
      </div>
    </MainLayout>
  );
}