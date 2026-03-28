"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Mic, MicOff, Send, ArrowLeft, Bot,
  AlertCircle, Stethoscope, Volume2, ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { speakText, stopSpeech, INDIAN_LANGUAGES } from "@/lib/languageUtils"

const API_BASE = "http://localhost:5000"

interface AIResponse { analysis: string }

const PLACEHOLDERS: Record<string, string> = {
  "ta-IN": "உங்கள் அறிகுறிகளை இங்கே தட்டச்சு செய்யுங்கள்…",
  "hi-IN": "अपने लक्षण यहाँ लिखें…",
  "te-IN": "మీ లక్షణాలను ఇక్కడ టైప్ చేయండి…",
  "kn-IN": "ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ…",
  "ml-IN": "നിങ്ങളുടെ രോഗലക്ഷണങ്ങൾ ഇവിടെ ടൈപ്പ് ചെയ്യുക…",
  "gu-IN": "તમારા લક્ષણો અહીં લખો…",
  "pa-IN": "ਆਪਣੇ ਲੱਛਣ ਇੱਥੇ ਲਿਖੋ…",
  "bn-IN": "এখানে আপনার লক্ষণ টাইপ করুন…",
  "mr-IN": "तुमची लक्षणे येथे लिहा…",
  "or-IN": "ଆପଣଙ୍କ ଲକ୍ଷଣ ଏଠାରେ ଲିଖନ୍ତୁ…",
  "ur-IN": "اپنی علامات یہاں لکھیں…",
  "as-IN": "আপোনাৰ লক্ষণসমূহ ইয়াত লিখক…",
  "ne-IN": "आफ्नो लक्षणहरू यहाँ लेख्नुहोस्…",
  "en-IN": "Describe your symptoms here…",
}

const RTL_LANGS = new Set(["ur-IN", "sd-IN"])

export default function HealthAssistant() {
  const [symptoms, setSymptoms]       = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [response, setResponse]       = useState<AIResponse | null>(null)
  const [isSpeaking, setIsSpeaking]   = useState(false)
  const [selectedLang, setSelectedLang]       = useState("en-IN")
  const [showLangPicker, setShowLangPicker]   = useState(false)
  const recognitionRef = useRef<any>(null)

  const selectedLangInfo = INDIAN_LANGUAGES.find((l) => l.code === selectedLang)!
  const isRTL = RTL_LANGS.has(selectedLang)

  useEffect(() => { return () => stopSpeech() }, [])

  // ── Analyze ─────────────────────────────────────────────────────────────────
  const runAnalysis = async (text: string) => {
    try {
      setIsAnalyzing(true)
      setResponse(null)
      stopSpeech()
      setIsSpeaking(false)

      const res = await fetch(`${API_BASE}/analyzeSymptoms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: text }),
      })
      const data = await res.json()

      if (res.ok && data.analysis) {
        setResponse({ analysis: data.analysis })
        setIsSpeaking(true)
        await speakText(data.analysis, selectedLang, () => setIsSpeaking(false))
      } else {
        alert(data.message || "Failed to analyze symptoms")
      }
    } catch {
      alert("Server error while analyzing symptoms")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAnalyze = () => { if (symptoms.trim()) runAnalysis(symptoms) }

  // ── Speak toggle ─────────────────────────────────────────────────────────────
  const handleSpeakerToggle = async () => {
    if (isSpeaking) {
      stopSpeech()
      setIsSpeaking(false)
    } else if (response?.analysis) {
      setIsSpeaking(true)
      await speakText(response.analysis, selectedLang, () => setIsSpeaking(false))
    }
  }

  // ── Voice recording ───────────────────────────────────────────────────────────
  const toggleRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert("Voice recognition not supported"); return }

    if (isRecording) {
      recognitionRef.current?.abort()
      recognitionRef.current = null
      setIsRecording(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = selectedLang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition
    setIsRecording(true)
    recognition.start()

    recognition.onresult = async (event: any) => {
      const text: string = event.results[0][0].transcript
      setSymptoms(text)
      setIsRecording(false)
      recognitionRef.current = null
      await runAnalysis(text)
    }

    recognition.onerror = (e: any) => {
      console.error("Recognition error:", e.error)
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }
  }

  const handleReset = () => {
    stopSpeech()
    setSymptoms("")
    setResponse(null)
    setIsSpeaking(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
          </Link>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Health Assistant</h1>
            <p className="text-xs text-muted-foreground">AI-powered symptom analysis</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <Card className="bg-secondary/50 border-border">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">
              Select your language first, then speak or type your symptoms.
              The reply will be read aloud automatically.{" "}
              <span className="text-primary font-medium">HD Voice</span> languages use Sarvam AI for natural Indian accents.
            </p>
          </CardContent>
        </Card>

        {/* Step 1 — Language picker */}
        <section className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Step 1 — Your language
          </p>

          <button
            onClick={() => setShowLangPicker((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg font-medium">{selectedLangInfo.label}</span>
              <span className="text-sm text-muted-foreground">{selectedLangInfo.englishName}</span>
              {selectedLangInfo.sarvamCode && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  HD Voice
                </span>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showLangPicker ? "rotate-180" : ""}`} />
          </button>

          {showLangPicker && (
            <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl border border-border bg-card max-h-72 overflow-y-auto">
              {INDIAN_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code)
                    setShowLangPicker(false)
                    setSymptoms("")
                    setResponse(null)
                    stopSpeech()
                    setIsSpeaking(false)
                  }}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selectedLang === lang.code
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary/70 text-foreground"
                  }`}
                >
                  <span className="text-sm font-semibold leading-tight">{lang.label}</span>
                  <span className={`text-xs mt-0.5 flex items-center gap-1 ${selectedLang === lang.code ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {lang.englishName}
                    {lang.sarvamCode && (
                      <span className={`text-[10px] px-1 rounded ${selectedLang === lang.code ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                        HD
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Step 2 — Symptom input */}
        <section className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Step 2 — Describe your symptoms
          </p>

          <div className="relative">
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={PLACEHOLDERS[selectedLang] ?? PLACEHOLDERS["en-IN"]}
              className="min-h-32 text-base bg-input border-border resize-none pr-14"
              lang={selectedLang}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={`absolute bottom-3 right-3 ${isRecording ? "text-destructive" : "text-primary"}`}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-destructive">
              <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm">
                Listening in <span className="font-semibold">{selectedLangInfo.englishName}</span>…
              </span>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!symptoms.trim() || isAnalyzing}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isAnalyzing ? (
              <><Stethoscope className="w-5 h-5 mr-2 animate-pulse" />Analyzing…</>
            ) : (
              <><Send className="w-5 h-5 mr-2" />Analyze Symptoms</>
            )}
          </Button>
        </section>

        {/* Result */}
        {response && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Analysis Result</h3>
              <Button variant="outline" size="sm" onClick={handleSpeakerToggle} className="flex items-center gap-1.5">
                <Volume2 className={`w-4 h-4 ${isSpeaking ? "text-primary animate-pulse" : ""}`} />
                {isSpeaking ? "🔇 Stop" : "🔊 Replay"}
              </Button>
            </div>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      AI Medical Guidance
                      {isSpeaking && (
                        <span className="ml-2 text-primary animate-pulse">
                          {selectedLangInfo.sarvamCode ? "🔊 HD Voice reading…" : "🔊 Reading aloud…"}
                        </span>
                      )}
                    </p>
                    <div
                      className="text-sm text-foreground whitespace-pre-line mt-2"
                      lang={selectedLang}
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      {response.analysis}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleReset} className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80">
              New Analysis
            </Button>
          </section>
        )}
      </div>
    </main>
  )
}
