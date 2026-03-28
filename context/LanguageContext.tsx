"use client"

import { createContext, useContext, useState, useEffect } from "react"

import en from "@/messages/en.json"
import ta from "@/messages/ta.json"
import hi from "@/messages/hi.json"
import te from "@/messages/te.json"
import kn from "@/messages/kn.json"
import ml from "@/messages/ml.json"

const translations: any = { en, ta, hi, te, kn, ml }

type LanguageContextType = {
  locale: string
  changeLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState("en")

  // Load saved language when app starts
  useEffect(() => {
    const saved = localStorage.getItem("medbox_lang")
    if (saved) setLocale(saved)
  }, [])

  const changeLanguage = (lang: string) => {
    setLocale(lang)
    localStorage.setItem("medbox_lang", lang)
  }

  // t("patient.name") → reads nested keys
  const t = (key: string): string => {
    const keys = key.split(".")
    let val: any = translations[locale]
    for (const k of keys) {
      val = val?.[k]
    }
    return val || key
  }

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider")
  return context
}