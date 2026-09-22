import type { CurrencyCode } from "@/constants/currencies";
import { getTTSFunctionUrl } from "@/services/tts/config";

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function listenForVoiceCommand(language: string, timeoutMs = 15000): Promise<string | null> {
  const Recognition = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
  return Recognition
    ? listenWithBrowserRecognition(Recognition, language, timeoutMs)
    : listenWithElevenLabs(language, timeoutMs);
}

function listenWithBrowserRecognition(
  Recognition: SpeechRecognitionConstructor,
  language: string,
  timeoutMs: number,
): Promise<string | null> {
  return new Promise((resolve) => {
    const recognition = new Recognition();
    let settled = false;
    let hasResult = false;
    let restartCount = 0;
    let microphone: MediaStream | null = null;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      recognition.stop();
      microphone?.getTracks().forEach((track) => track.stop());
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), timeoutMs);

    recognition.lang = language || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      hasResult = true;
      finish(transcript || null);
    };
    recognition.onerror = (event) => {
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        finish(null);
        return;
      }
      if (restartCount < 3) {
        restartCount += 1;
        window.setTimeout(() => {
          try { recognition.start(); } catch { finish(null); }
        }, 300);
        return;
      }
      finish(null);
    };
    recognition.onend = () => {
      if (settled || hasResult) return;
      if (restartCount < 3) {
        restartCount += 1;
        window.setTimeout(() => {
          try { recognition.start(); } catch { finish(null); }
        }, 250);
        return;
      }
      window.setTimeout(() => finish(null), 400);
    };

    void navigator.mediaDevices?.getUserMedia({ audio: true })
      .then((stream) => {
        if (settled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        microphone = stream;
        recognition.start();
      })
      .catch(() => finish(null));
  });
}

async function listenWithElevenLabs(language: string, timeoutMs: number): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return null;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const recording = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "audio/mp4" }));
    });
    recorder.start();
    await new Promise((resolve) => window.setTimeout(resolve, Math.min(timeoutMs, 8000)));
    recorder.stop();
    const audio = await recording;
    const form = new FormData();
    form.append("action", "transcribe");
    form.append("languageCode", language);
    form.append("audio", audio, "voice-command.m4a");
    const response = await fetch(getTTSFunctionUrl(), { method: "POST", body: form });
    if (!response.ok) return null;
    const data = (await response.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch {
    return null;
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

export function isYesCommand(value: string | null): boolean {
  return Boolean(value && /\b(yes|yeah|yep|sure|okay|ok|convert|yess|yas|haan|han|haudu|avunu|aam|aamaam|athe|ho|hoy)\b|हाँ|हां|हाँ जी|ಹೌದು|ಅವನು|అవును|అవునూ|ஆம்|ஆமாம்|അതെ|हो|होय/i.test(value));
}

export function isNoCommand(value: string | null): boolean {
  return Boolean(value && /\b(no|nope|not now|cancel|stop|nahi|illa|ledu|vendam|venda|alla|nako)\b|नहीं|नही|ಇಲ್ಲ|లేదు|வேண்டாம்|இல்லை|ഇല്ല|नको|नाही/i.test(value));
}

export function isOpenScanCommand(value: string | null): boolean {
  if (!value) return false;
  const text = value.toLowerCase();
  return /\b(scan|scanner|scanning)\b/.test(text) && /\b(open|start|begin|currency|money)\b/.test(text);
}

export function parseCurrencyCommand(value: string | null): CurrencyCode | null {
  if (!value) return null;
  const text = value.toLowerCase();
  const matches: Array<[CurrencyCode, RegExp]> = [
    ["INR", /\b(inr|rupee|rupees|indian)\b/],
    ["USD", /\b(usd|dollar|dollars|us)\b/],
    ["PHP", /\b(php|peso|pesos|philippine)\b/],
    ["EUR", /\b(eur|euro|euros)\b/],
    ["AUD", /\b(aud|australian)\b/],
    ["CAD", /\b(cad|canadian)\b/],
  ];
  return matches.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}
