"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { speakText, INDIAN_LANGUAGES } from "@/lib/languageUtils"
import { useEffect } from "react"


export default function VoiceAssistant() {
  const [text, setText] = useState("")
  const [result, setResult] = useState("")
  const [selectedLang, setSelectedLang] = useState("en-IN")
  const [showPicker, setShowPicker] = useState(false)

  const selectedInfo = INDIAN_LANGUAGES.find((l) => l.code === selectedLang)!

  const startRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser")
      return
    }

    const recognition = new SpeechRecognition()
    // ✅ recognition.lang = selectedLang — the browser transcribes in THIS language
    recognition.lang = selectedLang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.start()

    recognition.onresult = async (event: any) => {
      const spokenText: string = event.results[0][0].transcript
      setText(spokenText)

      try {
        const res = await fetch("http://localhost:5000/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: spokenText }),
        })

        const data = await res.json()
        setResult(data.result)
        speakText(data.result, selectedLang)

        if (data.emergency) {
          alert("🚨 EMERGENCY! SEEK HELP IMMEDIATELY!")
        }
      } catch (error) {
        console.error("Error:", error)
        setResult("Error processing request")
      }
    }

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error)
    }
  }
 
  return (
    <div className="p-4 border rounded-xl space-y-3">
      <h2 className="text-lg font-semibold">🎤 AI Voice Assistant</h2>

      {/* Language selector */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Select your language before speaking</p>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors text-sm"
        >
          <span>
            {selectedInfo.label}{" "}
            <span className="text-muted-foreground">({selectedInfo.englishName})</span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
              showPicker ? "rotate-180" : ""
            }`}
          />
        </button>

        {showPicker && (
          <div className="grid grid-cols-2 gap-1 p-2 rounded-lg border border-border bg-card max-h-48 overflow-y-auto">
            {INDIAN_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setSelectedLang(lang.code)
                  setShowPicker(false)
                }}
                className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  selectedLang === lang.code
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary/70"
                }`}
              >
                <span className="font-medium">{lang.label}</span>
                <span
                  className={`ml-1 ${
                    selectedLang === lang.code
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {lang.englishName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button onClick={startRecognition} className="w-full">
        🎤 Start Speaking ({selectedInfo.englishName})
      </Button>

      {text && (
        <p>
          <b>You said:</b>{" "}
          <span lang={selectedLang} dir="auto">
            {text}
          </span>
        </p>
      )}
      {result && (
        <p
          className="text-green-600"
          lang={selectedLang}
          dir="auto"
        >
          {result}
        </p>
      )}
    </div>
  )
}