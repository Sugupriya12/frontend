"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  FileText,
  TestTube,
  Download,
  Upload,
  Calendar,
} from "lucide-react"
import Link from "next/link"


const API_BASE = "http://localhost:5000"

export default function HealthRecords() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
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
    fetchReports(storedPatientId)
  }, [])

  const fetchReports = async (id: string) => {
    try {
      setLoading(true)
      setMessage("")

      const res = await fetch(`${API_BASE}/getReports/${id}`)
      const data = await res.json()

      if (res.ok) {
        setReports(data)
      } else {
        setReports([])
        setMessage(data.message || data.error || "Failed to load reports")
      }
    } catch (error) {
      console.error("Fetch reports error:", error)
      setMessage("Server error while loading reports")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      if (!patientId) {
        setMessage("Patient ID missing")
        return
      }

      setUploading(true)
      setMessage("")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("patientId", patientId)
      formData.append("reportName", file.name)

      const res = await fetch(`${API_BASE}/uploadReport`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("Report uploaded successfully")
        fetchReports(patientId)
      } else {
        setMessage(data.message || data.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setMessage("Server error while uploading report")
    } finally {
      setUploading(false)
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
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Health Reports</h1>
              <p className="text-xs text-muted-foreground">View and upload your reports</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Upload Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Upload New Report</h3>
            </div>

            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFileUpload(file)
                }
              }}
              className="block w-full text-sm text-foreground"
            />

            {uploading && (
              <p className="text-sm text-muted-foreground">Uploading report...</p>
            )}

            {message && (
              <p className="text-sm text-primary">{message}</p>
            )}
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Loading reports...</p>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {!loading && reports.length === 0 && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">No reports found.</p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          reports.length > 0 &&
          reports.map((report) => (
            <Card key={report.id} className="bg-card border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                      <TestTube className="w-5 h-5 text-primary" />
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground">
                        {report.reportName || "Medical Report"}
                      </h4>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        {report.uploadedAt?.seconds
                          ? new Date(report.uploadedAt.seconds * 1000).toLocaleDateString()
                          : "No date"}
                      </div>
                    </div>
                  </div>

                  <a
                    href={report.reportURL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </main>
  )
}