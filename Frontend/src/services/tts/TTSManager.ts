import type {
  ProviderStatus,
  SpeechStatus,
  TTSProvider,
  TTSRequest,
  TTSResult,
} from "@/services/tts/types";
import { BrowserTTSProvider } from "@/services/tts/BrowserTTSProvider";
import { ElevenLabsTTSProvider } from "@/services/tts/ElevenLabsTTSProvider";
import { GoogleCloudTTSProvider } from "@/services/tts/GoogleCloudTTSProvider";
import { cacheKey, getCachedAudio, setCachedAudio } from "@/services/tts/cache";
import { getPersona } from "@/services/tts/voiceRegistry";

type StatusListener = (status: SpeechStatus) => void;
type ProviderListener = (status: ProviderStatus) => void;

/**
 * The voice orchestrator. Decides which provider speaks, plays the resulting
 * audio, caches previews, and keeps the UI informed of full lifecycle state.
 *
 * Fallback hierarchy:
 *   Level 1 — ElevenLabs AI (primary AI engine)
 *   Level 2 — Google Cloud AI (secondary AI engine)
 *   Level 3 — Browser/device voice (honest, labelled fallback)
 *   Level 4 — friendly error state
 */
class TTSManager {
  private elevenlabs = new ElevenLabsTTSProvider();
  private google = new GoogleCloudTTSProvider();
  private browser = new BrowserTTSProvider();
  private audio = new Audio();

  private status: SpeechStatus = "idle";
  private providerStatus: ProviderStatus;
  private statusListeners = new Set<StatusListener>();
  private providerListeners = new Set<ProviderListener>();
  private deviceTimer: number | null = null;

  constructor() {
    this.providerStatus = this.buildProviderStatus();
    this.audio.preload = "auto";
    this.audio.addEventListener("playing", () => this.setStatus("playing"));
    this.audio.addEventListener("pause", () => this.setStatus("paused"));
    this.audio.addEventListener("ended", () => this.setStatus("ended"));
    this.audio.addEventListener("error", () => {
      this.setStatus("error");
      this.setProviderStatus((s) => ({ ...s, usingFallback: true, message: "Audio playback failed. Using device voice." }));
      this.enableDeviceFallbackForCurrent();
    });
  }

  /* ------------------------- public API ------------------------- */

  registerStatus(cb: StatusListener): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  registerProvider(cb: ProviderListener): () => void {
    this.providerListeners.add(cb);
    return () => this.providerListeners.delete(cb);
  }

  getStatus(): SpeechStatus {
    return this.status;
  }

  getProviderStatus(): ProviderStatus {
    return this.providerStatus;
  }

  isUsingAi(): boolean {
    return this.pickProvider().kind === "ai";
  }

  /** The id of the provider the manager would currently use to speak. */
  getActiveProviderId(): "elevenlabs" | "google" | "browser" {
    return this.pickProvider().id;
  }

  /** Speak a request through the correct provider with fallback. */
  async speak(req: TTSRequest): Promise<void> {
    this.stop();
    this.lastRequest = req;
    const provider = this.pickProvider();

    if (provider.kind === "device" || !provider.isAvailable()) {
      this.useDevice(req, false);
      await this.waitForSpeechEnd();
      return;
    }

    this.setProviderStatus({
      mode: "ai",
      providerLabel: provider.label,
      kind: "ai",
      available: true,
      usingFallback: false,
      message: `${provider.label} voice active`,
    });
    this.setStatus("synthesizing");

    try {
      const key = cacheKey(req);
      let result: TTSResult | undefined = getCachedAudio(key);
      if (!result) {
        result = await provider.synthesize(req);
        setCachedAudio(key, result);
      }
      if (this.status === "error") return; // a stop/error interrupted us
      this.audio.src = result.audioUrl;
      await this.audio.play();
      await new Promise<void>((resolve) => {
        const finish = () => {
          this.audio.removeEventListener("ended", finish);
          this.audio.removeEventListener("error", finish);
          resolve();
        };
        this.audio.addEventListener("ended", finish, { once: true });
        this.audio.addEventListener("error", finish, { once: true });
      });
    } catch (error) {
      this.setProviderStatus((s) => ({
        ...s,
        usingFallback: true,
        message: getAiFallbackMessage(error),
      }));
      this.useDevice(req, true);
      await this.waitForSpeechEnd();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.browser.stopDevice();
    if (this.deviceTimer !== null) {
      window.clearInterval(this.deviceTimer);
      this.deviceTimer = null;
    }
    this.setStatus("idle");
  }

  getDeviceHasLanguage(lang: string): boolean {
    return this.browser.isAvailable() && this.browserHasLang(lang);
  }

  private browserHasLang(lang: string): boolean {
    const norm = (l: string) => l.toLowerCase().split("-")[0];
    const target = norm(lang);
    return window.speechSynthesis.getVoices().some((v) => norm(v.lang) === target);
  }

  /* ------------------------- internals ------------------------- */

  private pickProvider(): TTSProvider {
    if (this.elevenlabs.isAvailable()) return this.elevenlabs;
    if (this.google.isAvailable()) return this.google;
    return this.browser;
  }

  private useDevice(req: TTSRequest, viaFallback: boolean): void {
    const persona = getPersona(req.voiceId);
    const started = this.browser.speakDevice(req, persona?.gender ?? null);
    if (!started) {
      this.setProviderStatus({
        mode: "device",
        providerLabel: this.browser.label,
        kind: "device",
        available: false,
        usingFallback: viaFallback,
        message: "Voice is not supported on this device.",
      });
      this.setStatus("error");
      return;
    }
    this.setProviderStatus({
      mode: "device",
      providerLabel: this.browser.label,
      kind: "device",
      available: true,
      usingFallback: viaFallback,
      message: viaFallback
        ? "AI voice unavailable. Using device voice."
        : "Device voice active.",
    });
    this.setStatus("playing");
    this.startDevicePolling();
  }

  private enableDeviceFallbackForCurrent(): void {
    // Replay the last request through the device engine if audio playback failed.
    if (this.lastRequest) {
      this.useDevice(this.lastRequest, true);
    }
  }
  private lastRequest: TTSRequest | null = null;

  private startDevicePolling(): void {
    if (this.deviceTimer !== null) window.clearInterval(this.deviceTimer);
    this.deviceTimer = window.setInterval(() => {
      if (this.browser.isDeviceSpeaking()) {
        if (this.status !== "playing" && this.status !== "idle") this.setStatus("playing");
      } else {
        if (this.deviceTimer !== null) window.clearInterval(this.deviceTimer);
        this.deviceTimer = null;
        this.setStatus("ended");
      }
    }, 240);
  }

  private waitForSpeechEnd(): Promise<void> {
    if (this.status === "idle" || this.status === "ended" || this.status === "error") return Promise.resolve();
    return new Promise((resolve) => {
      const off = this.registerStatus((status) => {
        if (status === "ended" || status === "error" || status === "idle") {
          off();
          resolve();
        }
      });
    });
  }

  private setStatus(status: SpeechStatus): void {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  private setProviderStatus(
    next: ProviderStatus | ((prev: ProviderStatus) => ProviderStatus),
  ): void {
    const value = typeof next === "function" ? next(this.providerStatus) : next;
    this.providerStatus = value;
    this.providerListeners.forEach((l) => l(value));
  }

  private buildProviderStatus(): ProviderStatus {
    if (this.elevenlabs.isAvailable()) {
      return {
        mode: "ai",
        providerLabel: this.elevenlabs.label,
        kind: "ai",
        available: true,
        usingFallback: false,
        message: `${this.elevenlabs.label} voice active`,
      };
    }
    if (this.google.isAvailable()) {
      return {
        mode: "ai",
        providerLabel: this.google.label,
        kind: "ai",
        available: true,
        usingFallback: false,
        message: `${this.google.label} voice active`,
      };
    }
    return {
      mode: "device",
      providerLabel: this.browser.label,
      kind: "device",
      available: this.browser.isAvailable(),
      usingFallback: true,
      message: "AI voice provider not connected. Using device voice.",
    };
  }
}

function getAiFallbackMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/\b402\b|credit|quota|billing|payment/i.test(message)) {
    return "AI voice credits are unavailable. Using device voice.";
  }
  if (/\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(message)) {
    return "AI voice access is not authorised. Using device voice.";
  }
  return "AI voice temporarily unavailable. Using device voice.";
}

export const ttsManager = new TTSManager();
