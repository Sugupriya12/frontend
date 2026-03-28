"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/context/LanguageContext"

const { t } = useLanguage()
const API_BASE = "http://localhost:5000"

type Patient = {
  patientId: string
  name: string
  age: string
  gender: string
  phone?: string
}

type Report = {
  id: string
  title: string
  type: string
  uploadedBy?: string
  date?: string
}

type Prescription = {
  id: string
  medicines?: string
  notes?: string
  date?: string
}

export default function PatientQRPage({
  params,
}: {
  params: { patientId: string }
}) {
  const { patientId } = params

  const [patient, setPatient] = useState<Patient | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError("")

        const [pRes, rRes, prRes] = await Promise.all([
          fetch(`${API_BASE}/patientById/${patientId}`),
          fetch(`${API_BASE}/reports/${patientId}`),
          fetch(`${API_BASE}/prescriptions/${patientId}`),
        ])

        const pData = await pRes.json()
        const rData = await rRes.json()
        const prData = await prRes.json()

        if (!pRes.ok) throw new Error(pData.message || "Patient not found")

        setPatient(pData.patient || null)
        setReports(Array.isArray(rData.reports) ? rData.reports : [])
        setPrescriptions(Array.isArray(prData.prescriptions) ? prData.prescriptions : [])
      } catch (e: any) {
        setError(e.message || "Failed to load patient data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [patientId])

  if (loading) return <div className="p-6">Loading patient details...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!patient) return <div className="p-6">Patient not found</div>

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="border rounded-xl p-4">
        <h1 className="text-2xl font-bold mb-3">Patient Details</h1>
        <p><strong>Patient ID:</strong> {patient.patientId}</p>
        <p><strong>Name:</strong> {patient.name}</p>
        <p><strong>Age:</strong> {patient.age}</p>
        <p><strong>Gender:</strong> {patient.gender}</p>
        <p><strong>Phone:</strong> {patient.phone}</p>
      </div>

      <div className="border rounded-xl p-4">
        <h2 className="text-xl font-semibold mb-3">Past Reports</h2>
        {reports.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-3">
                <p><strong>Title:</strong> {report.title}</p>
                <p><strong>Type:</strong> {report.type}</p>
                <p><strong>Uploaded By:</strong> {report.uploadedBy || "Clinic"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-xl p-4">
        <h2 className="text-xl font-semibold mb-3">Past Prescriptions</h2>
        {prescriptions.length === 0 ? (
          <p>No prescriptions found.</p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="border rounded-lg p-3">
                <p><strong>Medicines:</strong> {prescription.medicines || "-"}</p>
                <p><strong>Notes:</strong> {prescription.notes || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}