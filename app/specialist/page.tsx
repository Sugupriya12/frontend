"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Heart,
  Users,
  Calendar,
  Video,
  CheckCircle2,
  AlertCircle,
  User,
  Bell,
  FileText,
  Stethoscope,
  MapPin,
  RefreshCw,
  X,
  Send,
} from "lucide-react"


const BASE = "http://localhost:5000"

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = "consultations" | "schedule" | "patients"

interface Consultation {
  id: string
  clinicId: string
  patientId: string
  problem: string
  specialistId: string | null
  status: "pending" | "accepted" | "completed"
  roomId: string
  createdAt: unknown
  patientSnapshot?: { name: string; age: number }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

type FirestoreTimestamp = { _seconds: number; _nanoseconds: number }

function formatDate(value: unknown): string {
  if (!value) return ""
  if (typeof value === "object" && value !== null && "_seconds" in value) {
    return new Date((value as FirestoreTimestamp)._seconds * 1000).toLocaleString("en-IN")
  }
  if (typeof value === "string") return value
  return String(value)
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  return JSON.parse(text)
}

// ─── ADD TREATMENT MODAL ──────────────────────────────────────────────────────
// POST /addTreatment  { consultationId, treatment }

function AddTreatmentModal({
  consultation,
  onClose,
  onDone,
}: {
  consultation: Consultation
  onClose: () => void
  onDone: () => void
}) {
  const [treatment, setTreatment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!treatment.trim()) { setError("Enter treatment notes"); return }
    setLoading(true); setError("")
    try {
      await apiFetch("/addTreatment", {
        method: "POST",
        body: JSON.stringify({ consultationId: consultation.id, treatment }),
      })
      onDone()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save treatment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-lg rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Complete Consultation</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-3 bg-secondary/50 rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Patient Problem</p>
          <p className="text-sm text-foreground">{consultation.problem}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Treatment / Advice *</label>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Diagnosis, medications prescribed, follow-up instructions..."
            value={treatment}
            onChange={e => setTreatment(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full bg-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {loading ? "Saving..." : "Mark as Completed"}
        </Button>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function SpecialistDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("consultations")

  const [pending, setPending] = useState<Consultation[]>([])
  const [accepted, setAccepted] = useState<Consultation[]>([])
  const [completed, setCompleted] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [treatmentTarget, setTreatmentTarget] = useState<Consultation | null>(null)

  // specialistId stored in localStorage at login
  const specialistId =
    typeof window !== "undefined" ? (localStorage.getItem("specialistId") ?? "") : ""

  // ── Fetch consultations ───────────────────────────────────────────────────
  // GET /consultations            → all pending (any specialist can see & accept)
  // GET /myConsultations/:id      → accepted by THIS specialist

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [pendingData, myData] = await Promise.all([
        apiFetch("/consultations"),
        specialistId ? apiFetch(`/myConsultations/${specialistId}`) : Promise.resolve([]),
      ])
      setPending(Array.isArray(pendingData) ? pendingData : [])
      const mine: Consultation[] = Array.isArray(myData) ? myData : []
      setAccepted(mine.filter(c => c.status === "accepted"))
      setCompleted(mine.filter(c => c.status === "completed"))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load consultations")
    } finally {
      setLoading(false)
    }
  }, [specialistId])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000) // poll every 15 s
    return () => clearInterval(interval)
  }, [fetchAll])

  // ── Accept consultation ───────────────────────────────────────────────────
  // POST /acceptConsultation  { consultationId, specialistId }

  const handleAccept = async (c: Consultation) => {
    if (!specialistId) { alert("Specialist ID not found. Please log in again."); return }
    try {
      await apiFetch("/acceptConsultation", {
        method: "POST",
        body: JSON.stringify({ consultationId: c.id, specialistId }),
      })
      // Optimistically update UI
      setPending(prev => prev.filter(x => x.id !== c.id))
      setAccepted(prev => [{ ...c, status: "accepted", specialistId }, ...prev])
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to accept consultation")
    }
  }

  // ── Join video call (Jitsi) ───────────────────────────────────────────────

  const handleJoinCall = (roomId: string) => {
    window.open(`https://meet.jit.si/${encodeURIComponent(roomId)}`, "_blank", "noopener,noreferrer")
  }

  // ── After treatment saved ─────────────────────────────────────────────────

  const handleTreatmentDone = () => {
    if (!treatmentTarget) return
    setAccepted(prev => prev.filter(c => c.id !== treatmentTarget.id))
    setCompleted(prev => [{ ...treatmentTarget, status: "completed" }, ...prev])
    setTreatmentTarget(null)
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Specialist Dashboard</h1>
              <p className="text-xs text-muted-foreground">MedBox Teleconsult</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Online</span>
            </div>
            <button
              onClick={fetchAll}
              className="p-2 rounded-lg hover:bg-secondary"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {pending.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex flex-col gap-1">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-xl font-bold text-foreground">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex flex-col gap-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground">{accepted.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex flex-col gap-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-foreground">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {([
          { id: "consultations", label: "Consultations", icon: Video },
          { id: "schedule",      label: "Schedule",      icon: Calendar },
          { id: "patients",      label: "Patients",      icon: Users },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === "consultations" && pending.length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">

        {/* Global error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <button onClick={fetchAll} className="text-xs text-destructive underline shrink-0">Retry</button>
          </div>
        )}

        {/* Loading state */}
        {loading && pending.length === 0 && accepted.length === 0 && completed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading consultations...</p>
          </div>
        )}

        {/* ══ CONSULTATIONS TAB ══ */}
        {activeTab === "consultations" && (
          <div className="space-y-6">

            {/* ── PENDING: waiting for accept ── */}
            <section className="space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-destructive" />
                Waiting for You
                {pending.length > 0 && (
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                    {pending.length} new
                  </span>
                )}
              </h2>

              {pending.length === 0 && !loading && (
                <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm">No pending consultations right now.</p>
                </div>
              )}

              {pending.map(c => (
                <Card key={c.id} className="border-border border-l-4 border-l-destructive">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm">
                            {c.patientSnapshot?.name ?? `Patient ${c.patientId}`}
                          </h3>
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full shrink-0">
                            pending
                          </span>
                        </div>
                        {c.patientSnapshot?.age && (
                          <p className="text-xs text-muted-foreground">{c.patientSnapshot.age} yrs</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />
                          Clinic: {c.clinicId}
                        </div>
                        <div className="mt-2 bg-secondary/60 p-2 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">Problem</p>
                          <p className="text-sm text-foreground">{c.problem}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(c.createdAt)}</p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => handleAccept(c)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept Consultation
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </section>

            {/* ── ACCEPTED: ready to call ── */}
            {accepted.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  Accepted — Ready to Call
                </h2>

                {accepted.map(c => (
                  <Card key={c.id} className="border-border border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-foreground text-sm">
                              {c.patientSnapshot?.name ?? `Patient ${c.patientId}`}
                            </h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                              accepted
                            </span>
                          </div>
                          {c.patientSnapshot?.age && (
                            <p className="text-xs text-muted-foreground">{c.patientSnapshot.age} yrs</p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            Clinic: {c.clinicId}
                          </div>
                          <div className="mt-2 bg-secondary/60 p-2 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-0.5">Problem</p>
                            <p className="text-sm text-foreground">{c.problem}</p>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            Room: {c.roomId}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => handleJoinCall(c.roomId)}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Video Call
                        </Button>
                        <Button
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setTreatmentTarget(c)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}

            {/* ── COMPLETED ── */}
            {completed.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Completed
                </h2>
                {completed.map(c => (
                  <Card key={c.id} className="border-border opacity-70">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm">
                            {c.patientSnapshot?.name ?? `Patient ${c.patientId}`}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{c.problem}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
                          done
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}
          </div>
        )}

        {/* ══ SCHEDULE TAB ══ */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Today&apos;s Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Pending Requests</p>
                    <p className="text-xs text-muted-foreground">
                      {pending.length} consultation{pending.length !== 1 ? "s" : ""} waiting for acceptance
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <Video className="w-8 h-8 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Active Consultations</p>
                    <p className="text-xs text-muted-foreground">
                      {accepted.length} accepted and ready to call
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Completed Today</p>
                    <p className="text-xs text-muted-foreground">
                      {completed.length} consultation{completed.length !== 1 ? "s" : ""} done
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Consultation Flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { step: "1", text: "Clinic sends a teleconsult request for a patient", icon: Heart },
                  { step: "2", text: "You see it in 'Waiting for You' and click Accept", icon: CheckCircle2 },
                  { step: "3", text: "Click \"Join Video Call\" — a Jitsi room opens instantly", icon: Video },
                 {step: "4", text: "After the call, click \"Complete\" and add treatment notes", icon: FileText },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{item.step}</span>
                    </div>
                    <p className="text-sm text-foreground pt-0.5">{item.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══ PATIENTS TAB ══ */}
        {activeTab === "patients" && (
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground text-sm">Patients Seen</h2>
            {completed.length === 0 && (
              <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                <Users className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-sm">No completed consultations yet.</p>
              </div>
            )}
            {completed.map(c => (
              <Card key={c.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">
                        {c.patientSnapshot?.name ?? `Patient ${c.patientId}`}
                      </h3>
                      {c.patientSnapshot?.age && (
                        <p className="text-xs text-muted-foreground">{c.patientSnapshot.age} yrs</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.problem}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {c.clinicId}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        completed
                      </span>
                      <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-10">
        <div className="flex justify-around items-center">
          {([
            { id: "consultations", label: "Consults", icon: Video },
            { id: "schedule",      label: "Schedule", icon: Calendar },
            { id: "patients",      label: "Patients", icon: Users },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(nav => (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className={`flex flex-col items-center gap-1 p-2 relative ${
                activeTab === nav.id ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <nav.icon className="w-5 h-5" />
              <span className="text-xs">{nav.label}</span>
              {nav.id === "consultations" && pending.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full" />
              )}
            </button>
          ))}
          <button
            onClick={() => {
              localStorage.removeItem("specialistId")
              localStorage.removeItem("role")
              window.location.href = "/"
            }}
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-destructive"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Treatment Modal ── */}
      {treatmentTarget && (
        <AddTreatmentModal
          consultation={treatmentTarget}
          onClose={() => setTreatmentTarget(null)}
          onDone={handleTreatmentDone}
        />
      )}
    </main>
  )
}
