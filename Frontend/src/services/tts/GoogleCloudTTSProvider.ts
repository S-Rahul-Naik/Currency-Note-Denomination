import type {
  ProviderVoice,
  TTSProvider,
  TTSRequest,
  TTSResult,
} from "@/services/tts/types";
import { getTTSFunctionUrl, isGoogleTTSConfigured } from "@/services/tts/config";
import { getPersonasForLanguage, getProviderVoiceId, VOICE_PERSONAS } from "@/services/tts/voiceRegistry";

/**
 * Google Cloud Text-to-Speech provider — the FIRST-CLASS AI engine.
 *
 * It never holds a credential. It forwards a validated, minimal request to the
 * secure serverless endpoint (`/functions/v1/tts`), which owns the secret and
 * returns audio. The frontend only ever talks to our own endpoint.
 */

interface GoogleVoice {
  name: string;
  languageCodes: string[];
  ssmlGender: string;
}

interface VoicesResponse {
  voices?: GoogleVoice[];
  error?: string;
}

export class GoogleCloudTTSProvider implements TTSProvider {
  readonly id = "google" as const;
  readonly label = "Google Cloud AI";
  readonly kind = "ai" as const;

  isAvailable(): boolean {
    return isGoogleTTSConfigured();
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const url = getTTSFunctionUrl();
    if (!url) throw new Error("TTS endpoint is not configured");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "synthesize",
        provider: "google",
        voiceId: req.providerVoiceId,
        languageCode: req.language,
        text: req.text,
        speed: req.speed,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`TTS request failed (${res.status})${body ? `: ${body}` : ""}`);
    }
    const data = (await res.json()) as {
      audio?: string;
      contentType?: string;
      duration?: number;
      error?: string;
    };
    if (data.error || !data.audio) {
      throw new Error(data.error || "No audio returned by TTS provider");
    }
    const blob = base64ToBlob(data.audio, data.contentType || "audio/mpeg");
    return {
      audioUrl: URL.createObjectURL(blob),
      provider: "google",
      providerVoiceId: req.providerVoiceId,
      duration: data.duration,
      replay: false,
    };
  }

  async getVoices(language?: string): Promise<ProviderVoice[]> {
    if (!this.isAvailable()) return [];
    const url = getTTSFunctionUrl();
    if (!url) return [];

    let remote: GoogleVoice[] = [];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "voices",
          provider: "google",
          languageCode: language,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as VoicesResponse;
        remote = data.voices ?? [];
      }
    } catch {
      return [];
    }

    const base = language?.split("-")[0] ?? "kn";
    const persons = getPersonasForLanguage(base);

    // Merge registry personas with real provider availability + gender.
    const merged: ProviderVoice[] = persons.map((persona) => {
      const googleId = getProviderVoiceId(persona, "google");
      const remoteVoice = remote.find((v) => v.name === googleId);
      const gender =
        remoteVoice?.ssmlGender === "FEMALE"
          ? "female"
          : remoteVoice?.ssmlGender === "MALE"
            ? "male"
            : persona.gender;
      return {
        id: persona.id,
        name: persona.name,
        providerVoiceId: googleId,
        languageCode: persona.languageCode,
        ssmlGender: gender === "female" ? "FEMALE" : "MALE",
        gender,
        availability: remoteVoice ? "available" : "unavailable",
      } satisfies ProviderVoice;
    });

    // Reorder: available first, then persona definitions.
    const avail = merged.filter((v) => v.availability === "available");
    const unavail = merged.filter((v) => v.availability !== "available");
    return [...avail, ...unavail];
  }
}

function base64ToBlob(b64: string, contentType: string): Blob {
  const byteChars = atob(b64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

/** Keep import type-aware to avoid unused errors. */
export const _registryHint = VOICE_PERSONAS.length;
