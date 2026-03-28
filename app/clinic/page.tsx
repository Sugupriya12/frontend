"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Heart, Users, Calendar, ClipboardList, Search, Plus, Phone, Video,
  Clock, CheckCircle2, AlertCircle, User, Home, Settings, Bell,
  FileText, Stethoscope, Upload, X, ChevronRight, ArrowLeft,
  Pill, Activity, Send, ExternalLink, Badge, RefreshCw,
} from "lucide-react"



 const API_BASE = "http://localhost:5000"


// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "patients" | "appointments" | "referrals" | "teleconsult"
type PatientView = "search" | "profile" | "add"
type AppointmentStatus = "waiting" | "in-progress" | "completed"
type AppointmentType = "checkup" | "follow-up" | "emergency" | "teleconsult"

interface Patient {
  patientId: string
  name: string
  age: number
  gender: string
  phone?: string
  address?: string
  bloodGroup?: string
}
interface Report {
  id: string
  title: string
  date: string
  type: string
  fileUrl?: string
  uploadedBy?: string
}

interface Prescription {
  id: string
  date: string
  medicines: string[]
  notes: string
  doctorName: string
}

interface Consultation {
  id: string
  date: string
  specialist: string
  notes: string
  status: "pending" | "completed"
}

interface Appointment {
  id: string
  patientName: string
  patientId?: string
  phone?: string
  time: string
  date: string
  type: AppointmentType
  status: AppointmentStatus
  notes?: string
}

interface Referral {
  id: string
  patientName: string
  patientId: string
  referredTo: string
  reason: string
  date: string
  status: "pending" | "accepted" | "completed"
}

interface ClinicConsultation {
  id: string
  patientId: string
  patientSnapshot?: { name: string; age?: number; gender?: string }
  problem: string
  specialistType?: string
  status: "pending" | "accepted" | "completed"
  roomId?: string
  createdAt?: string
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const mockAppointments: Appointment[] = [
  { id: "APT-001", patientName: "Ramesh Kumar", patientId: "P001", phone: "9876543210", time: "9:00 AM", date: "Today", type: "checkup", status: "completed" },
  { id: "APT-002", patientName: "Lakshmi Devi", patientId: "P002", phone: "9845123456", time: "10:30 AM", date: "Today", type: "follow-up", status: "in-progress" },
  { id: "APT-003", patientName: "Suresh Yadav", patientId: "P003", phone: "9012345678", time: "11:00 AM", date: "Today", type: "emergency", status: "waiting" },
  { id: "APT-004", patientName: "Meena Patel", patientId: "P004", phone: "9765432190", time: "2:00 PM", date: "Today", type: "teleconsult", status: "waiting" },
]

const mockReferrals: Referral[] = [
  { id: "REF-001", patientName: "Ramesh Kumar", patientId: "P001", referredTo: "Cardiology – City Hospital", reason: "Chest pain, ECG abnormality", date: "22 Mar 2025", status: "pending" },
  { id: "REF-002", patientName: "Lakshmi Devi", patientId: "P002", referredTo: "Gynecology – District Hospital", reason: "Routine antenatal checkup", date: "20 Mar 2025", status: "accepted" },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────


async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  const contentType = res.headers.get("content-type") || ""
  const text = await res.text()
  

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got: ${text.slice(0, 120)}`)
  }

  return JSON.parse(text)
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    completed:    { label: "Completed",   cls: "bg-emerald-100 text-emerald-700",  icon: <CheckCircle2 className="w-3 h-3" /> },
    "in-progress": { label: "In Progress", cls: "bg-blue-100 text-blue-700",        icon: <Clock className="w-3 h-3 animate-spin" style={{animationDuration:"3s"}} /> },
    waiting:      { label: "Waiting",     cls: "bg-amber-100 text-amber-700",      icon: <Clock className="w-3 h-3" /> },
  }
  const { label, cls, icon } = map[status]
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {icon}{label}
    </span>
  )
}

function TypeBadge({ type }: { type: AppointmentType }) {
  const map: Record<AppointmentType, string> = {
    checkup:    "bg-sky-100 text-sky-700",
    "follow-up":"bg-purple-100 text-purple-700",
    emergency:  "bg-red-100 text-red-700",
    teleconsult:"bg-teal-100 text-teal-700",
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[type]}`}>
      {type}
    </span>
  )
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card w-full max-w-lg rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Upload Report Modal
function UploadReportModal({ patient, onClose, onSuccess }: { patient: Patient; onClose: () => void; onSuccess: (r: Report) => void }) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState("Blood Test")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Report title is required"); return }
    setLoading(true); setError("")
    try {
      const formData = new FormData()
      formData.append("patientId", patient.patientId)
      formData.append("title", title)
      formData.append("type", type)
      if (file) formData.append("file", file)

      const res = await fetch(`${API_BASE}/reports`, { method: "POST", body: formData })

const text = await res.text()
console.log("Upload response text:", text)

let data: any
try {
  data = JSON.parse(text)
} catch {
  throw new Error(`Server did not return JSON. Status: ${res.status}`)
}

if (!res.ok || !data.success) throw new Error(data.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Upload Report" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Report Title *</label>
          <Input placeholder="e.g. CBC, X-Ray Chest" value={title} onChange={e => setTitle(e.target.value)} className="bg-secondary border-border" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Report Type</label>
          <select
            className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {["Blood Test","Urine Test","X-Ray","ECG","USG","CT Scan","MRI","Other"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Attach File (optional)</label>
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/50"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{file ? file.name : "Tap to choose file"}</p>
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full bg-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {loading ? "Uploading..." : "Upload Report"}
        </Button>
      </div>
    </Modal>
  )
}

// Add Prescription Modal
function AddPrescriptionModal({ patient, onClose, onSuccess }: { patient: Patient; onClose: () => void; onSuccess: (p: Prescription) => void }) {
  const [medicines, setMedicines] = useState("")
  const [notes, setNotes] = useState("")
  const [doctor, setDoctor] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!medicines.trim()) { setError("Add at least one medicine"); return }
    setLoading(true); setError("")
    try {
      const body = {
        patientId: patient.patientId,
        medicines: medicines.split("\n").map(m => m.trim()).filter(Boolean),
        notes,
        doctorName: doctor || "Clinic Doctor",
      }
      const data = await apiFetch("/prescriptions", { method: "POST", body: JSON.stringify(body) })
      if (!data.success) throw new Error(data.message || "Failed")
      onSuccess(data.prescription ?? {
        id: `RX${Date.now()}`,
        date: new Date().toLocaleDateString("en-IN"),
        medicines: body.medicines,
        notes,
        doctorName: body.doctorName,
      })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save prescription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Write Prescription" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Doctor Name</label>
          <Input placeholder="Dr. Name" value={doctor} onChange={e => setDoctor(e.target.value)} className="bg-secondary border-border" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Medicines (one per line) *</label>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={"Tab Paracetamol 500mg — 1-0-1 x 5 days\nSyrup Amoxicillin 125mg — 5ml BD x 7 days"}
            value={medicines}
            onChange={e => setMedicines(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Clinical Notes</label>
          <textarea
            className="w-full min-h-[72px] rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Diagnosis, follow-up instructions..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full bg-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Pill className="w-4 h-4 mr-2" />}
          {loading ? "Saving..." : "Save Prescription"}
        </Button>
      </div>
    </Modal>
  )
}

// Teleconsult Modal
function TeleconsultModal({ patient, onClose, onSuccess }: { patient: Patient; onClose: () => void; onSuccess: (c: Consultation) => void }) {
  const [specialist, setSpecialist] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const specialists = ["Cardiologist", "Dermatologist", "Gynaecologist", "Paediatrician", "Neurologist", "Orthopaedic", "Psychiatrist", "General Physician"]

  const handleSubmit = async () => {
    if (!specialist) { setError("Choose a specialist"); return }
    setLoading(true); setError("")
    try {
      const body = { patientId: patient.patientId, specialist, notes }
      const data = await apiFetch("/createConsultations", { method: "POST", body: JSON.stringify(body) })
      if (!data.success) throw new Error(data.message || "Failed")
      onSuccess(data.consultation ?? {
        id: `CON${Date.now()}`,
        date: new Date().toLocaleDateString("en-IN"),
        specialist,
        notes,
        status: "pending" as const,
      })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to request consultation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Request Teleconsultation" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Specialist Type *</label>
          <select
            className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
            value={specialist}
            onChange={e => setSpecialist(e.target.value)}
          >
            <option value="">Select specialist...</option>
            {specialists.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Reason / Summary</label>
          <textarea
            className="w-full min-h-[90px] rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Brief summary of patient's condition..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSubmit} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
          {loading ? "Requesting..." : "Request Consultation"}
        </Button>
      </div>
    </Modal>
  )
}

// Add Referral Modal
function AddReferralModal({ patient, onClose, onSuccess }: { patient: Patient; onClose: () => void; onSuccess: (r: Referral) => void }) {
  const [referredTo, setReferredTo] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!referredTo.trim() || !reason.trim()) { setError("All fields required"); return }
    setLoading(true); setError("")
    try {
      const body = { patientId: patient.patientId, patientName: patient.name, referredTo, reason }
      const data = await apiFetch("/referrals", { method: "POST", body: JSON.stringify(body) })
      if (!data.success) throw new Error(data.message || "Failed")
      onSuccess(data.referral ?? {
        id: `REF${Date.now()}`,
        patientName: patient.name,
        patientId: patient.patientId,
        referredTo,
        reason,
        date: new Date().toLocaleDateString("en-IN"),
        status: "pending" as const,
      })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create referral")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Create Referral" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Refer To (Department / Hospital) *</label>
          <Input placeholder="e.g. Cardiology – City Hospital" value={referredTo} onChange={e => setReferredTo(e.target.value)} className="bg-secondary border-border" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Reason for Referral *</label>
          <textarea
            className="w-full min-h-[90px] rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Clinical indication..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full bg-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {loading ? "Creating..." : "Create Referral"}
        </Button>
      </div>
    </Modal>
  )
}

// Add Appointment Modal
function AddAppointmentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (a: Appointment) => void }) {
  const [patientName, setPatientName] = useState("")
  const [patientId, setPatientId] = useState("")
  const [phone, setPhone] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [type, setType] = useState<AppointmentType>("checkup")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!patientName.trim() || !date || !time) { setError("Patient name, date and time are required"); return }
    setLoading(true); setError("")
    try {
      const body = { patientName, patientId, phone, date, time, type, notes }
      const data = await apiFetch("/appointments", { method: "POST", body: JSON.stringify(body) })
      if (!data.success) throw new Error(data.message || "Failed")
      onSuccess(data.appointment ?? {
        id: `APT${Date.now()}`,
        patientName,
        patientId,
        phone,
        date,
        time,
        type,
        status: "waiting" as AppointmentStatus,
        notes,
      })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add appointment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Add Appointment" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Patient Name *</label>
            <Input placeholder="Full name" value={patientName} onChange={e => setPatientName(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Patient ID</label>
            <Input placeholder="P001 (optional)" value={patientId} onChange={e => setPatientId(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
            <Input placeholder="98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <select
              className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
              value={type}
              onChange={e => setType(e.target.value as AppointmentType)}
            >
              {(["checkup","follow-up","emergency","teleconsult"] as AppointmentType[]).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Time *</label>
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <Input placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} className="bg-secondary border-border" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full bg-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          {loading ? "Saving..." : "Add Appointment"}
        </Button>
      </div>
    </Modal>
  )
}

// Add New Patient Modal
function AddPatientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (p: Patient) => void }) {
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", phone: "", address: "", bloodGroup: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.age || !form.phone.trim()) { setError("Name, age and phone are required"); return }
    setLoading(true); setError("")
    try {
      const data = await apiFetch("/searchPatient", { method: "POST", body: JSON.stringify({ ...form, age: Number(form.age) }) })
      if (!data.success) throw new Error(data.message || "Failed")
      onSuccess(data.patient ?? { patientId: `P${Date.now()}`, ...form, age: Number(form.age) })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add patient")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Register New Patient" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
            <Input placeholder="Patient full name" value={form.name} onChange={set("name")} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Age *</label>
            <Input type="number" placeholder="Age" value={form.age} onChange={set("age")} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
            <select className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground" value={form.gender} onChange={set("gender")}>
              {["Male","Female","Other"].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone *</label>
            <Input placeholder="98XXXXXXXX" value={form.phone} onChange={set("phone")} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Blood Group</label>
            <select className="w-full h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground" value={form.bloodGroup} onChange={set("bloodGroup")}>
              <option value="">Unknown</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <Input placeholder="Village / Town" value={form.address} onChange={set("address")} className="bg-secondary border-border" />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full bg-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          {loading ? "Registering..." : "Register Patient"}
        </Button>
      </div>
    </Modal>
  )
}

// ─── PATIENT PROFILE VIEW ─────────────────────────────────────────────────────

function PatientProfile({
  patient,
  onBack,
  onReferralAdded,
}: {
  patient: Patient
  onBack: () => void
  onReferralAdded: (r: Referral) => void
}) {
  const [reports, setReports] = useState<Report[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)

  const [showUpload, setShowUpload] = useState(false)
  const [showPrescription, setShowPrescription] = useState(false)
  const [showConsult, setShowConsult] = useState(false)
  const [showReferral, setShowReferral] = useState(false)

  const [activeSection, setActiveSection] = useState<"reports" | "prescriptions" | "consultations">("reports")

  // Fetch patient history
  const fetchHistory = async () => {
    setLoading(true)
    try {
      const [rData, pData, cData] = await Promise.all([
        apiFetch(`/getReports/${patient.patientId}`),
        apiFetch(`/getPrescriptions/${patient.patientId}`),
        apiFetch(`/getConsultations/${patient.patientId}`),
      ])
    setReports(Array.isArray(rData) ? rData : [])
    setPrescriptions(Array.isArray(pData) ? pData : [])
    setConsultations(Array.isArray(cData) ? cData : [])
  } catch (error) {
    console.error("Failed to fetch history:", error)
    setReports([])
    setPrescriptions([])
    setConsultations([])
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
  fetchHistory()
}, [patient.patientId])


  return (
    <div className="space-y-4">
      {/* Patient Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground">{patient.name}</h2>
          <p className="text-xs text-muted-foreground">{patient.patientId} · {patient.age}y · {patient.gender}</p>
        </div>
        {patient.phone && (
          <a href={`tel:${patient.phone}`} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80">
            <Phone className="w-4 h-4 text-foreground" />
          </a>
        )}
      </div>

      {/* Info chips */}
      <div className="flex gap-2 flex-wrap">
        {patient.phone && (
          <span className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">
            <Phone className="w-3 h-3" />{patient.phone}
          </span>
        )}
        {patient.bloodGroup && (
          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            {patient.bloodGroup}
          </span>
        )}
        {patient.address && (
          <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">{patient.address}</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" className="bg-primary hover:bg-primary/90 h-10" onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4 mr-2" />Upload Report
        </Button>
        <Button size="sm" variant="outline" className="border-border h-10" onClick={() => setShowPrescription(true)}>
          <Pill className="w-4 h-4 mr-2" />Prescription
        </Button>
        <Button size="sm" variant="outline" className="border-border h-10 text-teal-700 border-teal-200 hover:bg-teal-50" onClick={() => setShowConsult(true)}>
          <Video className="w-4 h-4 mr-2" />Teleconsult
        </Button>
        <Button size="sm" variant="outline" className="border-border h-10 text-amber-700 border-amber-200 hover:bg-amber-50" onClick={() => setShowReferral(true)}>
          <ExternalLink className="w-4 h-4 mr-2" />Refer Patient
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex bg-secondary rounded-xl p-1 gap-1">
        {(["reports","prescriptions","consultations"] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${activeSection === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeSection === "reports" && (
            <div className="space-y-2">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No reports uploaded yet.</div>
              ) : reports.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.type} · {r.date}</p>
                  </div>
                  {r.fileUrl && (
                    <a href={r.fileUrl} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-secondary">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSection === "prescriptions" && (
            <div className="space-y-2">
              {prescriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No prescriptions added yet.</div>
              ) : prescriptions.map(p => (
                <Card key={p.id} className="border-border">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{p.date}</span>
                      <span className="text-xs text-primary">{p.doctorName}</span>
                    </div>
                    <ul className="space-y-1">
                      {p.medicines.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Pill className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                    {p.notes && <p className="text-xs text-muted-foreground border-t border-border pt-2">{p.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeSection === "consultations" && (
            <div className="space-y-2">
              {consultations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No consultations requested yet.</div>
              ) : consultations.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Video className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.specialist}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.notes || "No summary"} · {c.date}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showUpload && <UploadReportModal patient={patient} onClose={() => setShowUpload(false)} onSuccess={r => setReports(prev => [r, ...prev])} />}
      {showPrescription && <AddPrescriptionModal patient={patient} onClose={() => setShowPrescription(false)} onSuccess={p => setPrescriptions(prev => [p, ...prev])} />}
      {showConsult && <TeleconsultModal patient={patient} onClose={() => setShowConsult(false)} onSuccess={c => setConsultations(prev => [c, ...prev])} />}
      {showReferral && <AddReferralModal patient={patient} onClose={() => setShowReferral(false)} onSuccess={r => { onReferralAdded(r); setShowReferral(false) }} />}
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function ClinicDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [patientView, setPatientView] = useState<PatientView>("search")

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"id" | "phone">("id")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(false)
  const [patientError, setPatientError] = useState("")
  const [familyProfiles, setFamilyProfiles] = useState<Patient[]>([])
  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)
  const [showAddAppointment, setShowAddAppointment] = useState(false)

  // Referrals
  const [referrals, setReferrals] = useState<Referral[]>(mockReferrals)

  // Add patient modal
  const [showAddPatient, setShowAddPatient] = useState(false)

  const handlePatientSearch = async () => {
  if (!searchQuery.trim()) { setPatientError("Enter a patient ID or phone number"); return }
  setLoadingPatient(true); setPatientError(""); setSelectedPatient(null); setFamilyProfiles([])
  try {
    if (searchType === "id") {
      // Single patient by ID — behaviour unchanged
      const data = await apiFetch(`/patients/${searchQuery.trim()}`)
      if (!data.success) throw new Error(data.message || "Patient not found")
      const found = data.patient ?? null
      if (!found) throw new Error("No patient found")
      setSelectedPatient(found)
      setPatientView("profile")
    } else {
      // Phone search — may return a whole family
      const data = await apiFetch(`/patients?phone=${searchQuery.trim()}`)
      if (!data.success) throw new Error(data.message || "Patient not found")
      const profiles: Patient[] = data.patients ?? []
      if (profiles.length === 0) throw new Error("No patients found for this phone")

      if (profiles.length === 1) {
        // Only one profile — go straight to it
        setSelectedPatient(profiles[0])
        setPatientView("profile")
      } else {
        // Multiple family members — show picker
        setFamilyProfiles(profiles)
        setPatientView("search") // stay on search view to show the list below
      }
    }
  } catch (e: unknown) {
    setPatientError(e instanceof Error ? e.message : "Failed to fetch patient")
  } finally {
    setLoadingPatient(false)
  }
}
  const handleLogout = () => {
    localStorage.removeItem("clinicUser")
    localStorage.removeItem("selectedPatient")
    localStorage.removeItem("role")
    window.location.href = "/"
  }

  const getAppointmentStatusColor = (status: AppointmentStatus) => {
    if (status === "completed") return "bg-emerald-500"
    if (status === "in-progress") return "bg-blue-500"
    return "bg-muted"
  }
  // Teleconsultations (clinic-level)
  const [clinicConsultations, setClinicConsultations] = useState<ClinicConsultation[]>([])

  const fetchClinicConsultations = async () => {
    try {
      const clinicId = localStorage.getItem("clinicId")
      if (!clinicId) return
      const res = await fetch(`${API_BASE}/clinicConsultations/${clinicId}`)
      const data = await res.json()
      if (res.ok) {
        setClinicConsultations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching clinic consultations:", error)
    }
  }

  useEffect(() => {
    fetchClinicConsultations()
  }, [])

  const handleJoinCall = (roomId: string) => {
    window.open(`https://meet.jit.si/${encodeURIComponent(roomId)}`, "_blank", "noopener,noreferrer")
  }




  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Clinic Dashboard</h1>
              <p className="text-xs text-muted-foreground">Rural Health Center #12</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-secondary relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex flex-col gap-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground">127</p>
              <p className="text-xs text-muted-foreground">Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex flex-col gap-1">
              <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-accent-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{appointments.filter(a => a.date === "Today").length}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex flex-col gap-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-foreground">{referrals.filter(r => r.status === "pending").length}</p>
              <p className="text-xs text-muted-foreground">Referrals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "overview",      label: "Overview",     icon: Home },
          { id: "patients",      label: "Patients",     icon: Users },
          { id: "appointments",  label: "Appointments", icon: Calendar },
          { id: "referrals",     label: "Referrals",    icon: Stethoscope },
          { id: "teleconsult",   label: "Teleconsult",  icon: Video },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as Tab); if (tab.id === "patients") setPatientView("search") }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button
                  className="h-auto py-4 flex flex-col gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => { setShowAddPatient(true) }}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm">New Patient</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2 border-border"
                  onClick={() => setShowAddAppointment(true)}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Add Appointment</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2 border-border"
                  onClick={() => { setActiveTab("patients"); setPatientView("search") }}
                >
                  <Search className="w-5 h-5" />
                  <span className="text-sm">Search Patient</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2 border-border"
                  onClick={() => setActiveTab("referrals")}
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="text-sm">Referrals</span>
                </Button>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">Today&apos;s Schedule</CardTitle>
                  <button
                    onClick={() => setShowAddAppointment(true)}
                    className="flex items-center gap-1 text-xs text-primary font-medium"
                  >
                    <Plus className="w-3 h-3" />Add
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointments.filter(a => a.date === "Today").map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                    <div className={`w-1.5 h-12 rounded-full ${getAppointmentStatusColor(apt.status)}`} />
                    <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{apt.patientName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />{apt.time}
                        <TypeBadge type={apt.type} />
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── PATIENTS ── */}
        {activeTab === "patients" && (
          <>
            {patientView === "profile" && selectedPatient ? (
              <PatientProfile
                patient={selectedPatient}
                onBack={() => { setPatientView("search"); setSelectedPatient(null) }}
                onReferralAdded={(r) => setReferrals(prev => [r, ...prev])}
              />
            ) : (
              <div className="space-y-4">
                {/* Search Card */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-foreground">Search Patient</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Toggle ID / Phone */}
                    <div className="flex bg-secondary rounded-xl p-1 gap-1">
                      <button
                        className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors ${searchType === "id" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                        onClick={() => setSearchType("id")}
                      >
                        <ClipboardList className="w-3 h-3" />Patient ID
                      </button>
                      <button
                        className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors ${searchType === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                        onClick={() => setSearchType("phone")}
                      >
                        <Phone className="w-3 h-3" />Phone No.
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder={searchType === "id" ? "Enter Patient ID (e.g. P001)" : "Enter phone number"}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePatientSearch()}
                          className="pl-9 bg-secondary border-border"
                        />
                      </div>
                      <Button onClick={handlePatientSearch} disabled={loadingPatient} className="bg-primary px-4">
                        {loadingPatient ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>

                    {patientError && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                        <p className="text-sm text-destructive">{patientError}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
               {/* Family profiles picker — shown after phone search with multiple results */}
{familyProfiles.length > 1 && patientView === "search" && (
  <div className="space-y-2 mt-2">
    <p className="text-xs text-muted-foreground font-medium">
      {familyProfiles.length} profiles found — select a member:
    </p>
    {familyProfiles.map((p) => (
      <button
        key={p.patientId}
        onClick={() => {
          setSelectedPatient(p)
          setFamilyProfiles([])
          setPatientView("profile")
        }}
        className="w-full flex items-center gap-3 p-3 bg-secondary/50 hover:bg-secondary rounded-xl text-left transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.patientId} · {p.age}y · {p.gender}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    ))}
  </div>
)}
                {/* Register New */}
                <button
                  onClick={() => setShowAddPatient(true)}
                  className="w-full flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Register New Patient</p>
                      <p className="text-xs text-muted-foreground">Add a first-time visit patient</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ── APPOINTMENTS ── */}
        {activeTab === "appointments" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">All Appointments</h2>
              <Button size="sm" onClick={() => setShowAddAppointment(true)} className="bg-primary h-8">
                <Plus className="w-4 h-4 mr-1" />Add
              </Button>
            </div>
            {appointments.map((apt) => (
              <Card
                key={apt.id}
                className="border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => {
                  if (apt.patientId) {
                    setSearchQuery(apt.patientId)
                    setSearchType("id")
                    setActiveTab("patients")
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-14 rounded-full ${getAppointmentStatusColor(apt.status)}`} />
                    <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">{apt.patientName}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />{apt.time} · {apt.date}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <TypeBadge type={apt.type} />
                        {apt.phone && <span className="text-xs text-muted-foreground">{apt.phone}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={apt.status} />
                      {apt.patientId && <span className="text-xs text-muted-foreground">{apt.patientId}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── REFERRALS ── */}
        {activeTab === "referrals" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Referrals</h2>
              <p className="text-xs text-muted-foreground">Search a patient first to create a referral</p>
            </div>
            {referrals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No referrals yet.</div>
            ) : referrals.map((ref) => (
              <Card key={ref.id} className={`border-border border-l-4 ${ref.status === "completed" ? "border-l-emerald-500" : ref.status === "accepted" ? "border-l-blue-500" : "border-l-amber-500"}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{ref.patientName}</p>
                      <p className="text-xs text-muted-foreground">{ref.patientId} · {ref.date}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      ref.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      ref.status === "accepted"  ? "bg-blue-100 text-blue-700" :
                                                   "bg-amber-100 text-amber-700"
                    }`}>
                      {ref.status}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Stethoscope className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{ref.referredTo}</p>
                      <p className="text-xs text-muted-foreground">{ref.reason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* ── TELECONSULTATIONS ── */}
        {activeTab === "teleconsult" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Teleconsultations</h2>
              <button
                onClick={fetchClinicConsultations}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                <RefreshCw className="w-3 h-3" />Refresh
              </button>
            </div>

            {clinicConsultations.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
                  <Video className="w-6 h-6 text-teal-400" />
                </div>
                <p className="text-sm text-muted-foreground">No teleconsultations yet.</p>
              </div>
            ) : (
              clinicConsultations.map((consult) => (
                <Card
                  key={consult.id}
                  className={`border-border border-l-4 ${
                    consult.status === "completed"
                      ? "border-l-emerald-500"
                      : consult.status === "accepted"
                      ? "border-l-blue-500"
                      : "border-l-amber-500"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {consult.patientSnapshot?.name || consult.patientId}
                          </p>
                          {consult.patientSnapshot?.age && (
                            <p className="text-xs text-muted-foreground">
                              {consult.patientSnapshot.age}y · {consult.patientSnapshot.gender || ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          consult.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : consult.status === "accepted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {consult.status}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 bg-secondary/50 rounded-lg p-2">
                      <Stethoscope className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        {consult.specialistType && (
                          <p className="text-xs font-medium text-foreground">{consult.specialistType}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{consult.problem}</p>
                      </div>
                    </div>

                    {consult.status === "accepted" && consult.roomId && (
                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white h-9"
                        onClick={() => handleJoinCall(consult.roomId!)}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Video Call
                      </Button>
                    )}

                    {consult.status === "pending" && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Waiting for specialist to accept…
                      </div>
                    )}

                    {consult.status === "completed" && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Consultation completed
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

      </div>

      {/* Global Modals */}
      {showAddAppointment && (
        <AddAppointmentModal
          onClose={() => setShowAddAppointment(false)}
          onSuccess={(a) => { setAppointments(prev => [...prev, a]); setShowAddAppointment(false) }}
        />
      )}
      {showAddPatient && (
        <AddPatientModal
          onClose={() => setShowAddPatient(false)}
          onSuccess={(p) => { setSelectedPatient(p); setActiveTab("patients"); setPatientView("profile"); setShowAddPatient(false) }}
        />
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-10">
        <div className="flex justify-around items-center">
          {[
            { id: "overview",     label: "Home",         icon: Home },
            { id: "patients",     label: "Patients",     icon: Users },
            { id: "appointments", label: "Schedule",     icon: Calendar },
            { id: "referrals",    label: "Referrals",    icon: Stethoscope },
            { id: "teleconsult",  label: "Video",        icon: Video },
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => { setActiveTab(nav.id as Tab); if (nav.id === "patients") setPatientView("search") }}
              className={`flex flex-col items-center gap-1 p-2 ${activeTab === nav.id ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <nav.icon className="w-5 h-5" />
              <span className="text-xs">{nav.label}</span>
            </button>
          ))}
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-destructive">
            <User className="w-5 h-5" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </nav>
    </main>
  )
}
