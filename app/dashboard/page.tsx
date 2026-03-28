"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Heart,
  MessageSquare,
  FileText,
  AlertTriangle,
  Bell,
  Wifi,
  WifiOff,
  Lightbulb,
  User,
  LogOut,
  QrCode,
  X,
  Pill,
} from "lucide-react"
import Link from "next/link"
import VoiceAssistant from "@/components/VoiceAssistant"



interface PatientProfile {
  patientId?: string
  id?: string
  name?: string
  age?: string | number
  gender?: string
  phone?: string
}

const quickActions = [
  {
    title: "Health Assistant",
    description: "AI-powered symptom analysis",
    icon: MessageSquare,
    href: "/health-assistant",
    color: "bg-primary",
  },
  {
    title: "Health Records",
    description: "View reports and visits",
    icon: FileText,
    href: "/health-records",
    color: "bg-accent",
  },
  {
    title: "Prescriptions",
    description: "See medicines added by clinic/doctor",
    icon: Pill,
    href: "/prescriptions",
    color: "bg-primary",
  },
  {
    title: "Emergency Help",
    description: "Emergency support",
    icon: AlertTriangle,
    href: "#",
    color: "bg-destructive",
  },
]

const healthTips = [
  "Stay hydrated - drink enough water daily",
  "Take a short walk every day for better health",
  "Sleep well and avoid skipping meals",
]

export default function PatientDashboard() {
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [showEmergency, setShowEmergency] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  
  useEffect(() => {
    const savedProfile = localStorage.getItem("selectedProfile")
    const savedPatientId = localStorage.getItem("patientId")
    const savedPhone = localStorage.getItem("phone")

    if (savedProfile) {
      const parsed = JSON.parse(savedProfile)
      setPatient(parsed)
    } else if (savedPatientId || savedPhone) {
      setPatient({
        patientId: savedPatientId || "",
        phone: savedPhone || "",
        name: "Patient",
      })
    } else {
      window.location.href = "/"
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("loginData")
    localStorage.removeItem("patientId")
    localStorage.removeItem("selectedProfile")
    localStorage.removeItem("profiles")
    localStorage.removeItem("phone")
    window.location.href = "/"
  }

  const patientIdToShow = patient?.patientId || patient?.id || "Not available"

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">RuralCare Connect</h1>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="flex items-center text-xs text-accent">
                    <Wifi className="w-3 h-3 mr-1" /> Online
                  </span>
                ) : (
                  <span className="flex items-center text-xs text-muted-foreground">
                    <WifiOff className="w-3 h-3 mr-1" /> Offline
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowQrModal(true)}>
              <QrCode className="w-5 h-5 text-foreground" />
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                2
              </span>
            </Button>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {patient?.name || "Patient"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Patient ID: {patientIdToShow}
                </p>
                <p className="text-sm text-muted-foreground">
                  Age: {patient?.age || "-"} | {patient?.gender || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section>
          <h3 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              if (action.title === "Emergency Help") {
                return (
                  <Card
                    key={action.title}
                    className="bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full border-destructive/50"
                    onClick={() => setShowEmergency(true)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center mb-3`}>
                        <action.icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <h4 className="font-semibold text-foreground text-sm">{action.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <Link key={action.title} href={action.href}>
                  <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center mb-3`}>
                        <action.icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <h4 className="font-semibold text-foreground text-sm">{action.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Health Tips</h3>
          </div>
          <Card className="bg-secondary/50 border-border">
            <CardContent className="p-4">
              <ul className="space-y-2">
                {healthTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Button
          onClick={() => setShowEmergency(true)}
          className="w-full h-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-lg"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          Emergency Alert
        </Button>
      </div>

      {showEmergency && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Emergency Alert</h3>
              <p className="text-muted-foreground mb-6">
                Emergency backend is not connected yet.
              </p>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 border-border"
                  onClick={() => setShowEmergency(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="icon" onClick={() => setShowQrModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-4">Patient QR Code</h3>

              <div className="bg-white rounded-xl p-6 flex items-center justify-center mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    JSON.stringify({
                      patientId: patient?.patientId || patient?.id || "",
                      name: patient?.name || "",
                      age: patient?.age || "",
                      gender: patient?.gender || "",
                      phone: patient?.phone || localStorage.getItem("phone") || "",
                    })
                  )}`}
                  alt="Patient QR Code"
                  className="w-56 h-56"
                />
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                Patient ID: {patientIdToShow}
              </p>

              <p className="text-xs text-muted-foreground">
                When scanned, this QR contains the patient details.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
