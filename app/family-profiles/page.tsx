"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, User, ArrowLeft, QrCode } from "lucide-react"


type Profile = {
  patientId: string
  name: string
  age: string | number
  gender: string
  phone?: string
}

export default function FamilyProfilesPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    const storedProfiles = localStorage.getItem("profiles")

    if (!storedProfiles) {
      setMessage("No family profiles found. Please login again.")
      return
    }

    try {
      const parsedProfiles = JSON.parse(storedProfiles)
      setProfiles(parsedProfiles)
    } catch (error) {
      console.error("Error parsing profiles:", error)
      setMessage("Could not load family profiles")
    }
  }, [])

  const handleSelectProfile = (profile: Profile) => {
    localStorage.setItem("patientId", profile.patientId)
    localStorage.setItem("selectedProfile", JSON.stringify(profile))
    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Family Profiles</h1>
              <p className="text-xs text-muted-foreground">Choose one member</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {message && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-red-600">{message}</p>
            </CardContent>
          </Card>
        )}

        {!message &&
          profiles.map((profile) => (
            <Card key={profile.patientId} className="bg-card border-border shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Age: {profile.age} | {profile.gender}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Patient ID: {profile.patientId}
                    </p>
                  </div>
                </div>

                <Button onClick={() => handleSelectProfile(profile)}>Open</Button>
              </CardContent>
            </Card>
          ))}

        {!message && profiles.length === 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">No profiles found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}