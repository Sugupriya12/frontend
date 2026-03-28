export interface LangInfo {
  code: string
  label: string
  englishName: string
  sarvamCode: string
}

export const INDIAN_LANGUAGES: LangInfo[] = [
  { code: "as-IN",  label: "অসমীয়া",    englishName: "Assamese",  sarvamCode: ""      },
  { code: "bn-IN",  label: "বাংলা",       englishName: "Bengali",   sarvamCode: "bn-IN" },
  { code: "bho-IN", label: "भोजपुरी",    englishName: "Bhojpuri",  sarvamCode: ""      },
  { code: "doi-IN", label: "डोगरी",      englishName: "Dogri",     sarvamCode: ""      },
  { code: "gu-IN",  label: "ગુજરાતી",    englishName: "Gujarati",  sarvamCode: "gu-IN" },
  { code: "hi-IN",  label: "हिन्दी",      englishName: "Hindi",     sarvamCode: "hi-IN" },
  { code: "kn-IN",  label: "ಕನ್ನಡ",      englishName: "Kannada",   sarvamCode: "kn-IN" },
  { code: "kok-IN", label: "कोंकणी",     englishName: "Konkani",   sarvamCode: ""      },
  { code: "mai-IN", label: "मैथिली",     englishName: "Maithili",  sarvamCode: ""      },
  { code: "ml-IN",  label: "മലയാളം",     englishName: "Malayalam", sarvamCode: "ml-IN" },
  { code: "mni-IN", label: "মৈতৈলোন্",  englishName: "Manipuri",  sarvamCode: ""      },
  { code: "mr-IN",  label: "मराठी",       englishName: "Marathi",   sarvamCode: "mr-IN" },
  { code: "ne-IN",  label: "नेपाली",      englishName: "Nepali",    sarvamCode: ""      },
  { code: "or-IN",  label: "ଓଡ଼ିଆ",      englishName: "Odia",      sarvamCode: "od-IN" },
  { code: "pa-IN",  label: "ਪੰਜਾਬੀ",     englishName: "Punjabi",   sarvamCode: "pa-IN" },
  { code: "sa-IN",  label: "संस्कृत",    englishName: "Sanskrit",  sarvamCode: ""      },
  { code: "sat-IN", label: "ᱥᱟᱱᱛᱟᱲᱤ", englishName: "Santali",   sarvamCode: ""      },
  { code: "sd-IN",  label: "سنڌي",       englishName: "Sindhi",    sarvamCode: ""      },
  { code: "ta-IN",  label: "தமிழ்",       englishName: "Tamil",     sarvamCode: "ta-IN" },
  { code: "te-IN",  label: "తెలుగు",     englishName: "Telugu",    sarvamCode: "te-IN" },
  { code: "ur-IN",  label: "اردو",        englishName: "Urdu",      sarvamCode: ""      },
  { code: "en-IN",  label: "English",     englishName: "English",   sarvamCode: "en-IN" },
]

export const LANG_LABEL_MAP: Record<string, string> = Object.fromEntries(
  INDIAN_LANGUAGES.map((l) => [l.code, `${l.label} (${l.englishName})`])
)

const SCRIPT_DETECTORS: [RegExp, string][] = [
  [/[\u0980-\u09FF]/, "bn-IN"],
  [/[\u0A00-\u0A7F]/, "pa-IN"],
  [/[\u0A80-\u0AFF]/, "gu-IN"],
  [/[\u0B00-\u0B7F]/, "or-IN"],
  [/[\u0B80-\u0BFF]/, "ta-IN"],
  [/[\u0C00-\u0C7F]/, "te-IN"],
  [/[\u0C80-\u0CFF]/, "kn-IN"],
  [/[\u0D00-\u0D7F]/, "ml-IN"],
  [/[\u0900-\u097F]/, "hi-IN"],
  [/[\u0600-\u06FF]/, "ur-IN"],
  [/[\u1C50-\u1C7F]/, "sat-IN"],
]

export function detectLangFromText(text: string): string {
  for (const [regex, code] of SCRIPT_DETECTORS) {
    if (regex.test(text)) return code
  }
  return "en-IN"
}
// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL CONTROL
// ─────────────────────────────────────────────────────────────────────────────
let currentPlaybackId = 0
let isGlobalSpeaking = false

// ─────────────────────────────────────────────────────────────────────────────
// speakWithSarvam
// ─────────────────────────────────────────────────────────────────────────────
async function speakWithSarvam(
  text: string,
  sarvamCode: string,
  onEnd?: () => void
): Promise<boolean> {

  const playbackId = ++currentPlaybackId

  try {
    const res = await fetch("http://localhost:5000/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        target_language_code: sarvamCode,
        speaker: "priya",
        model: "bulbul:v3",
        pace: 0.9,
        audio_format: "mp3",
      }),
    })

    if (!res.ok) return false

    const data = await res.json()
    const audios: string[] = data.audios || []
    if (audios.length === 0) return false

    const playChunk = (index: number) => {
      if (playbackId !== currentPlaybackId) return

      if (index >= audios.length) {
        isGlobalSpeaking = false
        onEnd?.()
        return
      }

      const binary = atob(audios[index])
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: "audio/mp3" })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      audio.onended = () => {
        URL.revokeObjectURL(url)
        setTimeout(() => playChunk(index + 1), 100)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        setTimeout(() => playChunk(index + 1), 100)
      }

      audio.play()
    }

    playChunk(0)
    return true

  } catch (err) {
    isGlobalSpeaking = false
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser fallback
// ─────────────────────────────────────────────────────────────────────────────
function speakWithBrowser(
  text: string,
  lang: string,
  onEnd?: () => void
): void {

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.88

  utterance.onend = () => {
    isGlobalSpeaking = false
    onEnd?.()
  }

  window.speechSynthesis.speak(utterance)
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SPEAK FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export async function speakText(
  text: string,
  lang: string,
  onEnd?: () => void
): Promise<void> {

  // 🔥 BLOCK duplicate calls
  if (isGlobalSpeaking) return

  isGlobalSpeaking = true

  stopSpeech()

  const langInfo = INDIAN_LANGUAGES.find((l) => l.code === lang)
  const sarvamCode = langInfo?.sarvamCode

  if (sarvamCode) {
    const success = await speakWithSarvam(text, sarvamCode, onEnd)
    if (success) return
  }

  speakWithBrowser(text, lang, onEnd)
}

// ─────────────────────────────────────────────────────────────────────────────
// STOP ALL AUDIO
// ─────────────────────────────────────────────────────────────────────────────
export function stopSpeech(): void {
  currentPlaybackId++
  isGlobalSpeaking = false

  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel()
  }

  document.querySelectorAll("audio").forEach((a) => {
    a.pause()
    a.currentTime = 0
    a.src = ""
  })
}