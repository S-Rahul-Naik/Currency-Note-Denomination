import { ttsManager } from "@/services/tts/TTSManager";

/** Whether the device speech engine has a voice for a given language. */
export function getDeviceHasLanguage(lang: string): boolean {
  return ttsManager.getDeviceHasLanguage(lang);
}