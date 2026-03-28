"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Pill,
  Calendar,
  UserRound,
  FileText,
} from "lucide-react"

const API_BASE = "http://localhost:5000"

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [patientId, setPatientId] = useState("")

  useEffect(() => {
    const storedPatientId = localStorage.getItem("patientId")

    if (!storedPatientId) {
      setMessage("Patient ID not found. Please login again.")
      setLoading(false)
      return
    }

    setPatientId(storedPatientId)
    fetchPrescriptions(storedPatientId)
  }, [])

  const fetchPrescriptions = async (id: string) => {
    try {
      setLoading(true)
      setMessage("")

      const res = await fetch(`${API_BASE}/getPrescriptions/${id}`)
      const data = await res.json()

      if (res.ok) {
        setPrescriptions(data)
      } else {
        setPrescriptions([])
        setMessage(data.message || data.error || "Failed to load prescriptions")
      }
    } catch (error) {
      console.error("Fetch prescriptions error:", error)
      setMessage("Server error while loading prescriptions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Pill className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Prescriptions</h1>
              <p className="text-xs text-muted-foreground">
                Medicines added by clinic or specialist
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Loading */}
        {loading && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Loading prescriptions...</p>
            </CardContent>
          </Card>
        )}

        {/* Message */}
        {!loading && message && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">{message}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading && !message && prescriptions.length === 0 && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">No prescriptions found.</p>
            </CardContent>
          </Card>
        )}

        {/* Prescription List */}
        {!loading &&
          prescriptions.length > 0 &&
          prescriptions.map((rx) => (
            <Card key={rx.id} className="bg-card border-border shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <UserRound className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">
                      {rx.doctorName || "Doctor"}
                    </h4>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-4 h-4" />
                      {rx.date?.seconds
                        ? new Date(rx.date.seconds * 1000).toLocaleDateString()
                        : "No date"}
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <Pill className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Medicine</p>
                      <p className="text-sm text-foreground">
                        {rx.medicine || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dosage</p>
                      <p className="text-sm text-foreground">
                        {rx.dosage || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm text-foreground">
                        {rx.notes || "No extra notes"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </main>
  )
}