import type {
  ProviderVoice,
  TTSProvider,
  TTSRequest,
  TTSResult,
  SpeechStatus,
} from "@/services/tts/types";

/**
 * Browser/device speech synthesis provider — the explicit FALLBACK (Level 3).
 *
 * This is NEVER the primary voice engine. It only engages when no configured
 * AI TTS provider can synthesise. It is always labelled as "Device voice"
 * in the UI, never as an AI voice.
 */

function readEngineVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export class BrowserTTSProvider implements TTSProvider {
  readonly id = "browser" as const;
  readonly label = "Device voice";
  readonly kind = "device" as const;

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /** Directly speak using the device engine (returns whether it started). */
  speakDevice(req: TTSRequest, gender?: "female" | "male" | null): boolean {
    if (!this.isAvailable()) return false;
    const synth = window.speechSynthesis;
    synth.cancel();

    let rate = Math.min(2, Math.max(0.5, req.speed || 1));
    const tune: Record<string, { pitch: number; rate: number }> = {
      warning: { pitch: 1.12, rate: 0.96 },
      attention: { pitch: 1.2, rate: 0.92 },
      error: { pitch: 0.9, rate: 0.88 },
      confirmation: { pitch: 1.06, rate: 1.03 },
    };
    const t = tune[req.style ?? "normal"];
    if (t) rate = Math.min(2, Math.max(0.5, rate * t.rate));

    const utter = new SpeechSynthesisUtterance(req.text);
    const voice = this.pickVoice(req.language, gender);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = req.language;
    }
    utter.rate = rate;
    utter.pitch = Math.min(2, Math.max(0.1, (req.pitch ?? 1) * this.tonePitch(req.style ?? "normal")));
    utter.volume = req.volume ?? 1;
    synth.speak(utter);
    return true;
  }

  isDeviceSpeaking(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis.speaking || window.speechSynthesis.pending
      : false;
  }

  stopDevice(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  onVoiceChange(cb: () => void): () => void {
    if (!this.isAvailable()) return () => undefined;
    window.speechSynthesis.addEventListener("voiceschanged", cb);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
  }

  private tonePitch(style: string): number {
    const m: Record<string, number> = {
      normal: 1,
      warning: 1.12,
      attention: 1.2,
      error: 0.9,
      confirmation: 1.06,
    };
    return m[style] ?? 1;
  }

  private pickVoice(lang: string, gender?: "female" | "male" | null): SpeechSynthesisVoice | undefined {
    const voices = readEngineVoices();
    if (voices.length === 0) return undefined;
    const norm = (l: string) => l.toLowerCase().split("-")[0];
    const target = norm(lang);
    const langVoices = voices.filter((v) => norm(v.lang) === target);
    const pool = (langVoices.length > 0 ? langVoices : voices).filter((v) => v.default || true);
    if (gender) {
      const hints =
        gender === "female"
          ? ["female", "woman", "lady", "girl", "samantha", "zira", "aria", "jenny", "tessa", "karen", "moira", "victoria", "veena", "priya", "lea", "aubree"]
          : ["male", "man", "guy", "boy", "david", "mark", "daniel", "alex", "fred", "thomas", "james", "george", "arun", "raj", "kumar"];
      const byHints = pool.find((v) => {
        const n = v.name.toLowerCase();
        return hints.some((h) => n.includes(h));
      });
      if (byHints) return byHints;
    }
    return pool.find((v) => v.default) || pool[0] || voices[0];
  }

  /** synthesize is only used by non-device paths; for device we use speakDevice. */
  async synthesize(_req: TTSRequest): Promise<TTSResult> {
    return { audioUrl: "", provider: "browser", providerVoiceId: "" };
  }

  async getVoices(language?: string): Promise<ProviderVoice[]> {
    if (!this.isAvailable()) return [];
    const voices = readEngineVoices();
    const base = language?.split("-")[0];
    return voices
      .map((v) => {
        const name = v.name.toLowerCase();
        const gender: "female" | "male" | null = /female|woman|lady|girl|sam|zira|aria|jenny|tessa|karen|victoria|veena|priya/i.test(name)
          ? "female"
          : /male|man|guy|boy|david|mark|daniel|alex|fred|thomas|james|george|arun|raj/i.test(name)
            ? "male"
            : null;
        return {
          id: "",
          name: v.name,
          providerVoiceId: v.voiceURI ?? v.name,
          languageCode: v.lang,
          ssmlGender: gender === "female" ? "FEMALE" : gender === "male" ? "MALE" : "",
          gender: gender ?? "female",
          availability: "available" as const,
        };
      })
      .filter((v) => (!base ? true : v.languageCode.toLowerCase().split("-")[0] === base));
  }
}

export type DeviceStatusEvent = (status: SpeechStatus) => void;