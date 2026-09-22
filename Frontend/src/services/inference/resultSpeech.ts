import type { DetectionResult } from "@/types";

/**
 * Detection-result announcements — multilingual and native-first.
 *
 * The announcement text is produced in the user's selected voice language,
 * in that language's native script. Kannada text stays as Kannada; it is never
 * silently converted to romanized (English-style) form.
 *
 * The only case where romanized text is produced is the explicit, opt-in
 * "Romanized fallback" setting, and only when the active provider is the
 * device fallback AND the device cannot natively speak Kannada.
 */

export interface ResultSpeechPieces {
  text: string;
  /** Language tag to announce in (native script for the selected language). */
  lang: string;
}

type Kind = "low_confidence" | "wrong_currency" | "error" | "multiple" | "single" | "none";

interface Tokens {
  kind: Kind;
  code: string;
  denom: string;
  conf: string;
  count: string;
  total: string;
}

function extract(result: DetectionResult): Tokens {
  const base: Tokens = { kind: "none", code: "", denom: "", conf: "", count: "", total: "" };
  if (result.status === "low_confidence" && result.currencies[0]) {
    const note = result.currencies[0];
    return { ...base, kind: "low_confidence", code: note.currency, denom: String(note.denomination), conf: String(Math.round(note.confidence * 100)) };
  }
  if (result.status === "wrong_currency") {
    return { ...base, kind: "wrong_currency" };
  }
  if (result.status === "error") {
    return { ...base, kind: "error" };
  }
  if (result.currencies.length > 1) {
    return {
      ...base,
      kind: "multiple",
      count: String(result.currencies.length),
      code: result.currencies[0]?.currency ?? "",
      total: String(result.total ?? result.currencies.reduce((s, n) => s + n.denomination, 0)),
    };
  }
  if (result.currencies.length === 1) {
    const note = result.currencies[0];
    return { ...base, kind: "single", code: note.currency, denom: String(note.denomination), conf: String(Math.round(note.confidence * 100)) };
  }
  return base;
}

type PhraseMap = Record<Kind, (t: Tokens) => string>;

const MAPS: Record<string, PhraseMap> = {
  en: {
    low_confidence: (t) =>
      `Detection uncertain. Possibly ${t.code} ${t.denom}, but confidence is low. Please try again in better light.`,
    wrong_currency: () => "Attention. This appears to be a different currency. Please check again.",
    error: () => "Sorry, there was an error recognizing the currency. Please try again.",
    multiple: (t) => `Detected ${t.count} notes. Total ${t.code} ${t.total}.`,
    single: (t) => `Successful detection. ${t.code} ${t.denom} with ${t.conf} percent confidence.`,
    none: () => "No currency detected.",
  },
  kn: {
    low_confidence: (t) =>
      `ಪತ್ತೆ ಖಚಿತವಾಗಿಲ್ಲ. ಬಹುಶಃ ${t.code} ${t.denom}, ಆದರೆ ವಿಶ್ವಾಸ ಕಡಿಮೆ. ಚೆನ್ನಾಗಿ ಬೆಳಕಿನಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.`,
    wrong_currency: () => "ಗಮನ. ಇದು ಬೇರೆ ಕರೆನ್ಸಿಯಾಗಿ ಕಾಣುತ್ತಿದೆ. ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.",
    error: () => "ಕ್ಷಮಿಸಿ. ಕರೆನ್ಸಿ ಗುರುತಿಸುವಲ್ಲಿ ದೋಷವಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    multiple: (t) => `${t.count} ನೋಟು ಪತ್ತೆಯಾಗಿವೆ. ಒಟ್ಟು ${t.code} ${t.total}.`,
    single: (t) => `ಯಶಸ್ವಿ ಪತ್ತೆ. ${t.code} ${t.denom}. ${t.conf} ಶೇಕಡಾ ವಿಶ್ವಾಸ.`,
    none: () => "ಯಾವುದೇ ಕರೆನ್ಸಿ ಪತ್ತೆಯಾಗಿಲ್ಲ.",
  },
  hi: {
    low_confidence: (t) =>
      `पहचान अनिश्चित है। संभवतः ${t.code} ${t.denom}, लेकिन विश्वास कम है। कृपया अच्छी रोशनी में फिर प्रयास करें।`,
    wrong_currency: () => "ध्यान दें। यह एक अलग मुद्रा प्रतीत होती है। कृपया फिर जाँचें।",
    error: () => "माफ़ कीजिए। मुद्रा पहचान में त्रुटि हुई। कृपया फिर प्रयास करें।",
    multiple: (t) => `${t.count} नोट मिले। कुल ${t.code} ${t.total}.`,
    single: (t) => `सफल पहचान। ${t.code} ${t.denom}. ${t.conf} प्रतिशत विश्वास।`,
    none: () => "कोई मुद्रा नहीं मिली।",
  },
  te: {
    low_confidence: (t) =>
      `గుర్తింపు అనిశ్చితం. బహుశా ${t.code} ${t.denom}, కానీ విశ్వాసం తక్కువ. దయచేసి మంచి వెలుతురులో మళ్ళీ ప్రయత్నించండి.`,
    wrong_currency: () => "శ్రద్ధ. ఇది వేరే కరెన్సీలా కనిపిస్తోంది. దయచేసి మళ్ళీ పరిశీలించండి.",
    error: () => "క్షమించండి. కరెన్సీ గుర్తింపులో లోపం ఏర్పడింది. మళ్ళీ ప్రయత్నించండి.",
    multiple: (t) => `${t.count} నోట్లు గుర్తించబడ్డాయి. మొత్తం ${t.code} ${t.total}.`,
    single: (t) => `విజయవంతమైన గుర్తింపు. ${t.code} ${t.denom}. ${t.conf} శాతం విశ్వాసం.`,
    none: () => "ఎటువంటి కరెన్సీ గుర్తించబడలేదు.",
  },
  ta: {
    low_confidence: (t) =>
      `அடையாளம் உறுதியாக இல்லை. ஒருவேளை ${t.code} ${t.denom}, ஆனால் நம்பிக்கை குறைவு. சிறந்த ஒளியில் மீண்டும் முயற்சிக்கவும்.`,
    wrong_currency: () => "கவனம். இது வேறு நாணயமாகத் தெரிகிறது. மீண்டும் சரிபார்க்கவும்.",
    error: () => "மன்னிக்கவும். நாணயத்தை அடையாளம் காண்பதில் பிழை. மீண்டும் முயற்சிக்கவும்.",
    multiple: (t) => `${t.count} பணத்தாள்கள் கண்டறியப்பட்டன. மொத்தம் ${t.code} ${t.total}.`,
    single: (t) => `வெற்றிகரமான கண்டறிதல். ${t.code} ${t.denom}. ${t.conf} சதவீத நம்பிக்கை.`,
    none: () => "எந்த நாணயமும் கண்டறியப்படவில்லை.",
  },
  ml: {
    low_confidence: (t) =>
      `തിരിച്ചറിയൽ ഉറപ്പില്ല. ഒരുപക്ഷേ ${t.code} ${t.denom}, പക്ഷേ വിശ്വാസം കുറവാണ്. നല്ല വെളിച്ചത്തിൽ വീണ്ടും ശ്രമിക്കുക.`,
    wrong_currency: () => "ശ്രദ്ധ. ഇത് മറ്റൊരു കറൻസിയായി കാണപ്പെടുന്നു. വീണ്ടും പരിശോധിക്കുക.",
    error: () => "ക്ഷമിക്കണം. കറൻസി തിരിച്ചറിയുന്നതിൽ പിശക്. വീണ്ടും ശ്രമിക്കുക.",
    multiple: (t) => `${t.count} നോട്ടുകൾ കണ്ടെത്തി. ആകെ ${t.code} ${t.total}.`,
    single: (t) => `വിജയകരമായ കണ്ടെത്തൽ. ${t.code} ${t.denom}. ${t.conf} ശതമാനം വിശ്വാസം.`,
    none: () => "കറൻസി കണ്ടെത്തിയില്ല.",
  },
  mr: {
    low_confidence: (t) =>
      `ओळख निश्चित नाही. कदाचित ${t.code} ${t.denom}, पण विश्वास कमी आहे. चांगल्या प्रकाशात पुन्हा प्रयत्न करा.`,
    wrong_currency: () => "लक्ष द्या. हे वेगळे चलन दिसते. पुन्हा तपासा.",
    error: () => "माफ करा. चलन ओळखण्यात त्रुटी. पुन्हा प्रयत्न करा.",
    multiple: (t) => `${t.count} नोटा सापडल्या. एकूण ${t.code} ${t.total}.`,
    single: (t) => `यशस्वी ओळख. ${t.code} ${t.denom}. ${t.conf} टक्के विश्वास.`,
    none: () => "चलन सापडले नाही.",
  },
};

const ROMAN_KN: PhraseMap = {
  low_confidence: (t) =>
    `Patte khachitavagilla. Bahusha ${t.code} ${t.denom}, aadare vishwaasa kadime. Chennagi belakinali matte prayatnisi.`,
  wrong_currency: () => "Gamana. Idu bere karensiyaagi kaanutide. Matte parisheelisi.",
  error: () => "Kshamisi. Karensi gurutisuvalu doshavagide. Matte prayatnisi.",
  multiple: (t) => `${t.count} notu patteyagive. Ottu ${t.code} ${t.total}.`,
  single: (t) => `Yashasvi patte. ${t.code} ${t.denom}. ${t.conf} shekada vishwaasa.`,
  none: () => "Yaavude karensi patteyagilla.",
};

export interface BuildSpeechOptions {
  /** Selected voice language code, e.g. "kn-IN". */
  lang: string;
  /** Whether the device engine can natively speak Kannada. */
  hasKannadaEngine: boolean;
  /** User opted-in romanized Kannada fallback (device path only). */
  allowRomanized?: boolean;
}

export function buildResultSpeechForVoice(
  result: DetectionResult,
  opts: BuildSpeechOptions | string,
  hasKannadaEngine?: boolean,
  allowRomanized?: boolean,
): ResultSpeechPieces {
  const normalized: BuildSpeechOptions =
    typeof opts === "string"
      ? { lang: opts, hasKannadaEngine: hasKannadaEngine ?? true, allowRomanized }
      : opts;

  const t = extract(result);
  const base = (normalized.lang || "").toLowerCase().split("-")[0];

  if (base === "kn") {
    const canSpeakNative = normalized.hasKannadaEngine;
    if (canSpeakNative) return { text: render(MAPS.kn, t), lang: "kn-IN" };
    // Only romanize when the user explicitly opted in.
    if (normalized.allowRomanized) return { text: render(ROMAN_KN, t), lang: "en-IN" };
    // Otherwise keep native script so an AI backend (or future native engine) can speak it.
    return { text: render(MAPS.kn, t), lang: "kn-IN" };
  }

  const map = MAPS[base] ?? MAPS.en;
  return { text: render(map, t), lang: base === "en" ? "en-IN" : `${base}-IN` };
}

function render(map: PhraseMap, t: Tokens): string {
  return map[t.kind](t);
}

/** English-only announcement (kept for consumers needing plain text). */
export function buildResultSpeech(result: DetectionResult): string {
  return buildResultSpeechForVoice(result, { lang: "en-IN", hasKannadaEngine: true }).text;
}