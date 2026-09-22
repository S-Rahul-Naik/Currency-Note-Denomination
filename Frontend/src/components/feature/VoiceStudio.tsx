import { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Mic,
  Bot,
  Info,
} from "lucide-react";
import { useVoice } from "@/context/VoiceProvider";
import { WaveformBars } from "@/components/feature/WaveformBars";
import { Slider } from "@/components/base/Slider";

const SPEED_PRESETS = [0.75, 1.0, 1.15, 1.25, 1.5];

export function VoiceStudio() {
  const {
    languages,
    selectedVoice,
    settings,
    setSettings,
    setLanguage,
    previewVoice,
    stop,
    isSpeaking,
    providerStatus,
    usingAi,
    engineVoiceCount,
    supported,
    hasKannadaEngineVoice,
    speechStatus,
  } = useVoice();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeLang = languages.find((l) => l.base === selectedVoice.lang.split("-")[0]) ?? languages[0];

  const handleLanguage = (base: string) => {
    setLanguage(base);
  };

  const handleHeroPreview = () => {
    if (isSpeaking) stop();
    else previewVoice();
  };

  return (
    <section aria-label="Voice studio" className="space-y-6">
      {/* ---------- Hero ---------- */}
      <Hero
        persona={{ sampleText: selectedVoice.sampleText }}
        lang={activeLang}
        isSpeaking={isSpeaking}
        onPreview={handleHeroPreview}
      />

      {/* ---------- Provider status ---------- */}
      <ProviderBar
        active={usingAi}
        label={providerStatus.providerLabel}
        message={providerStatus.message}
        fallback={providerStatus.usingFallback}
      />

      {/* ---------- Language ---------- */}
      <div>
        <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-foreground-950">
          <Mic aria-hidden="true" className="h-4 w-4 text-primary-600" />
          Language
        </h4>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang.base}
              onClick={() => handleLanguage(lang.base)}
              aria-pressed={activeLang.base === lang.base}
              className={`flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${
                activeLang.base === lang.base
                  ? "bg-primary-600 text-background-50"
                  : "bg-background-100 text-foreground-700 ring-1 ring-background-200 hover:bg-background-200"
              }`}
            >
              <span>{lang.native}</span>
              <span className={activeLang.base === lang.base ? "text-primary-100" : "text-foreground-500"}>
                {lang.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900">
        <p className="font-bold">One DhanDrishti female AI voice</p>
        <p className="mt-1 text-primary-800">Your selected language is saved and used for speech across the app.</p>
      </div>

      {/* ---------- Audio controls ---------- */}
      <AudioControls
        speed={settings.speed}
        onSpeed={(v) => setSettings({ speed: v })}
        volume={settings.volume}
        onVolume={(v) => setSettings({ volume: v })}
        pausePreview={isSpeaking ? stop : undefined}
      />

      {/* ---------- Advanced ---------- */}
      <AdvancedPanel
        open={showAdvanced}
        onToggle={() => setShowAdvanced((s) => !s)}
        usingAi={usingAi}
        providerLabel={providerStatus.providerLabel}
        providerMessage={providerStatus.message}
        providerFallback={providerStatus.usingFallback}
        speechStatus={speechStatus}
        engineVoiceCount={engineVoiceCount}
        supported={supported}
        hasKannadaEngineVoice={hasKannadaEngineVoice}
        romanizedFallback={settings.romanizedFallback}
        onRomanized={(v) => setSettings({ romanizedFallback: v })}
      />
    </section>
  );
}

/* ================================================================== */

function Hero({
  persona,
  lang,
  isSpeaking,
  onPreview,
}: {
  persona: { sampleText: string };
  lang: { label: string; native: string };
  isSpeaking: boolean;
  onPreview: () => void;
}) {
  const personality = "Female";
  return (
    <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-accent-500/20 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full bg-background-50/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-100 ring-1 ring-background-50/15">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          AI Voice Studio
        </span>
        <h2 className="mt-4 font-heading text-2xl font-bold leading-tight text-background-50 sm:text-3xl">
          Choose Your Language
        </h2>
        <p className="mt-2 max-w-sm text-sm text-primary-100/80">
          One clear, friendly female AI voice for every language.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-background-50/15 bg-background-50/10 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-heading text-base font-bold text-foreground-950">
            D
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-background-50">DhanDrishti Voice</p>
            <p className="truncate text-xs text-primary-100/80">
              {personality} · {lang.label} ({lang.native})
            </p>
          </div>
          <button
            onClick={onPreview}
            aria-label={isSpeaking ? "Stop preview" : "Preview DhanDrishti voice"}
            className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${
              isSpeaking ? "bg-accent-500 text-foreground-950" : "bg-background-50/15 text-background-50 hover:bg-background-50/25"
            }`}
          >
            {isSpeaking ? (
              <Pause aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Play aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="mt-3 flex items-end gap-3 rounded-xl bg-background-50/5 px-3.5 py-3">
          <div className="h-8 w-8 shrink-0">
            <WaveformBars barCount={16} barClass="bg-accent-400" />
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-primary-100/80">{persona.sampleText}</p>
        </div>
      </div>
    </div>
  );
}

function ProviderBar({
  active,
  label,
  message,
  fallback,
}: {
  active: boolean;
  label: string;
  message: string;
  fallback: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        active ? "border-primary-200 bg-primary-50" : "border-accent-200 bg-accent-50"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          active ? "bg-primary-600 text-background-50" : "bg-accent-500 text-foreground-950"
        }`}
      >
        {active ? <Bot aria-hidden="true" className="h-5 w-5" /> : <Volume2 aria-hidden="true" className="h-5 w-5" />}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground-950">
          {label}
          <span className="ml-2 font-semibold text-foreground-500">
            {active ? "AI voice" : "Device fallback"}
          </span>
        </p>
        <p className="truncate text-xs text-foreground-600">{message}</p>
        {!active && fallback && (
          <p className="mt-0.5 text-xs font-medium text-accent-800">
            Connect an AI voice provider for truly separate voices.
          </p>
        )}
      </div>
    </div>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: "all" | "female" | "male";
  onChange: (v: "all" | "female" | "male") => void;
}) {
  const options: { id: "all" | "female" | "male"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "female", label: "Female" },
    { id: "male", label: "Male" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Filter by gender"
      className="flex w-full items-center rounded-full bg-background-100 p-1 ring-1 ring-background-200 sm:w-auto"
    >
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-full px-4 text-xs font-bold transition-colors ${
            value === o.id ? "bg-background-50 text-foreground-950 shadow-sm" : "text-foreground-600 hover:text-foreground-950"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AudioControls({
  speed,
  onSpeed,
  volume,
  onVolume,
  pausePreview,
}: {
  speed: number;
  onSpeed: (v: number) => void;
  volume: number;
  onVolume: (v: number) => void;
  pausePreview?: () => void;
}) {
  return (
    <div className="surface rounded-2xl p-5">
      <h4 className="flex items-center gap-2 text-sm font-bold text-foreground-950">
        <Volume2 aria-hidden="true" className="h-4 w-4 text-primary-600" />
        Audio
      </h4>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="tts-speed" className="text-xs font-bold text-foreground-800">
            Speech speed
          </label>
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-700 ring-1 ring-primary-200">
            {speed.toFixed(2)}x
          </span>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {SPEED_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              aria-pressed={speed === s}
              className={`flex min-h-10 cursor-pointer items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                speed === s ? "bg-primary-600 text-background-50" : "bg-background-100 text-foreground-700 ring-1 ring-background-200 hover:bg-background-200"
              }`}
            >
              {s.toFixed(2).replace(/0$/, "")}x
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Slider
          id="tts-volume"
          label="Volume"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={onVolume}
          display={`${Math.round(volume * 100)}%`}
        />
      </div>

      {pausePreview && (
        <button
          onClick={pausePreview}
          className="mt-3 flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-background-100 text-xs font-bold text-foreground-800 ring-1 ring-background-200 hover:bg-background-200"
        >
          <Pause aria-hidden="true" className="h-4 w-4" />
          Stop preview
        </button>
      )}
    </div>
  );
}

function AdvancedPanel({
  open,
  onToggle,
  usingAi,
  providerLabel,
  providerMessage,
  providerFallback,
  speechStatus,
  engineVoiceCount,
  supported,
  hasKannadaEngineVoice,
  romanizedFallback,
  onRomanized,
}: {
  open: boolean;
  onToggle: () => void;
  usingAi: boolean;
  providerLabel: string;
  providerMessage: string;
  providerFallback: boolean;
  speechStatus: string;
  engineVoiceCount: number;
  supported: boolean;
  hasKannadaEngineVoice: boolean;
  romanizedFallback: boolean;
  onRomanized: (v: boolean) => void;
}) {
  return (
    <div className="surface rounded-2xl">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-foreground-950">
          <Info aria-hidden="true" className="h-4 w-4 text-primary-600" />
          Provider status
        </span>
        {open ? (
          <ChevronUp aria-hidden="true" className="h-4 w-4 text-foreground-500" />
        ) : (
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-foreground-500" />
        )}
      </button>
      {open && (
        <div className="space-y-3 border-t border-background-200 px-5 py-4">
          <StatRow label="Voice source" value={`${providerLabel} (${usingAi ? "AI" : "Device"})`} active={usingAi} />
          <StatRow label="Engine status" value={supported ? `${engineVoiceCount} device voice(s) ready` : "Not supported"} />
          <StatRow
            label="Native Kannada engine"
            value={hasKannadaEngineVoice ? "Available" : "Not installed"}
          />
          <StatRow label="Speech state" value={speechStatus} />
          <StatRow label="Fallback active" value={providerFallback ? "Yes" : "No"} active={providerFallback} />
          <div className="text-xs leading-relaxed text-foreground-600">
            {providerMessage} Kannada text is always sent in native script to the AI provider; it is
            never silently converted to English-style speech.
          </div>

          <label className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              checked={romanizedFallback}
              onChange={(e) => onRomanized(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary-600"
            />
            <span className="text-xs">
              <span className="font-bold text-foreground-900">Enable romanized Kannada fallback</span>
              <span className="block text-foreground-600">
                Only used when the device voice is active and cannot natively speak Kannada. Off by
                default.
              </span>
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-foreground-600">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
          active ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200" : "bg-background-100 text-foreground-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
