"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Phone, User, Stethoscope, Building2, ArrowLeft, WifiOff } from "lucide-react"
import { useRouter } from "next/navigation"


const API_BASE = "http://localhost:5000"

type UserType = "patient" | "specialist" | "clinic" | null
type Step = "select-user" | "enter-credentials"

export default function LoginPage() {
  const [userType, setUserType] = useState<UserType>(null)
  const [step, setStep] = useState<Step>("select-user")

  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  const [clinicName, setClinicName] = useState("")
  const [clinicPhone, setClinicPhone] = useState("")
  const [clinicAddress, setClinicAddress] = useState("")
  const [clinicLicenseNumber, setClinicLicenseNumber] = useState("")

  const [specialistName, setSpecialistName] = useState("")
  const [specialistPhone, setSpecialistPhone] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [selectedClinicId, setSelectedClinicId] = useState("")
  const [clinics, setClinics] = useState<any[]>([])

  const router = useRouter()

  // ─── Track online/offline status ───────────────────────────────────────────
  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // ─── Load clinics (only when online) ───────────────────────────────────────
  useEffect(() => {
    if (isOffline) return
    const loadClinics = async () => {
  if (!navigator.onLine) return   // ← add this line
  try {
    const res = await fetch(`${API_BASE}/clinics`)
        const data = await res.json()
        if (res.ok) setClinics(data.clinics || [])
      } catch (error) {
        console.error("Failed to load clinics:", error)
      }
    }
    loadClinics()
  }, [isOffline])

  // ─── PATIENT LOGIN ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setMessage("")

      const trimmedPhone = String(phone).trim()

      // ── OFFLINE PATH ──────────────────────────────────────────────────────
      if (!navigator.onLine) {
        const cached = await localforage.getItem<{ phone: string; profiles: any[] }>(
          `patient_session_${trimmedPhone}`
        )

        if (cached && cached.profiles?.length > 0) {
          localStorage.setItem("phone", cached.phone)
          localStorage.setItem("profiles", JSON.stringify(cached.profiles))
          localStorage.setItem("isOffline", "true")
          router.push("/family-profiles")
        } else {
          setMessage("No offline data found. Please login once while connected to internet.")
        }
        return
      }

      // ── ONLINE PATH — patient ─────────────────────────────────────────────
      if (userType === "patient") {
        const res = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: trimmedPhone }),
        })
        const data = await res.json()

        console.log("LOGIN DATA:", data)

        if (!res.ok || data.message === "Not registered") {
          setMessage("Login failed")
          return
        }

        if (data.profiles && data.profiles.length > 0) {
          // ✅ Cache session for offline login
          await localforage.setItem(`patient_session_${trimmedPhone}`, {
            phone: data.phone,
            profiles: data.profiles,
          })

          // ✅ Cache reports & prescriptions per profile for offline viewing
          for (const profile of data.profiles) {
            try {
              const [reportsRes, prescriptionsRes] = await Promise.all([
                fetch(`${API_BASE}/reports/${profile.patientId}`),
                fetch(`${API_BASE}/prescriptions/${profile.patientId}`),
              ])
              const reportsData = await reportsRes.json()
              const prescriptionsData = await prescriptionsRes.json()

              await localforage.setItem(
                `reports_${profile.patientId}`,
                reportsData.reports || []
              )
              await localforage.setItem(
                `prescriptions_${profile.patientId}`,
                prescriptionsData.prescriptions || []
              )
            } catch (err) {
              console.warn("Could not cache data for", profile.patientId, err)
            }
          }

          localStorage.setItem("phone", data.phone)
          localStorage.setItem("profiles", JSON.stringify(data.profiles))
          localStorage.removeItem("isOffline")
          router.push("/family-profiles")
        } else {
          setMessage("No patient profiles found")
        }
        return
      }

      // ── ONLINE PATH — clinic / specialist ─────────────────────────────────
      let url = ""
      let body: Record<string, string> = {}

      if (userType === "clinic") {
        url = "/clinic/login"
        body = { email, password }
      } else if (userType === "specialist") {
        url = "/specialist/login"
        body = { email, password }
      }

      const res = await fetch(`${API_BASE}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
// Clinic login succeeds if clinic object exists in response
if (userType === "clinic" && data.clinic) {
  localStorage.setItem("loginData", JSON.stringify(data))
  localStorage.setItem("clinicId", data.clinic?.clinicId || "")
  localStorage.setItem("clinicData", JSON.stringify(data.clinic || {}))
  localStorage.setItem("role", "clinic")
  router.push("/clinic")

} else if (userType === "specialist" && data.specialist) {
  localStorage.setItem("loginData", JSON.stringify(data))
  localStorage.setItem("specialistId", data.specialist?.specialistId || "")
  localStorage.setItem("specialistData", JSON.stringify(data.specialist || {}))
  localStorage.setItem("role", "specialist")
  router.push("/specialist")

} else {
  setMessage(data.message || "Login failed")
}
    } catch (error) {
      console.error("Login error:", error)
      setMessage("Server error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ─── REGISTER HANDLERS (unchanged) ─────────────────────────────────────────
  const handlePatientRegister = async () => {
    try {
      setIsLoading(true)
      setMessage("")
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, age, gender }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message || "Profile added successfully. Please login.")
        setIsRegisterMode(false)
        setName(""); setAge(""); setGender("")
      } else {
        setMessage(data.message || data.error || "Registration failed")
      }
    } catch {
      setMessage("Server error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClinicRegister = async () => {
    try {
      setIsLoading(true)
      setMessage("")
      const res = await fetch(`${API_BASE}/clinic/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clinicName, email, password,
          phone: clinicPhone, address: clinicAddress,
          licenseNumber: clinicLicenseNumber,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Clinic registered successfully. Wait for admin approval, then login.")
        setIsRegisterMode(false)
        setClinicName(""); setClinicPhone(""); setClinicAddress("")
        setClinicLicenseNumber(""); setEmail(""); setPassword("")
      } else {
        setMessage(data.message || data.error || "Clinic registration failed")
      }
    } catch {
      setMessage("Server error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSpecialistRegister = async () => {
    try {
      setIsLoading(true)
      setMessage("")
      const res = await fetch(`${API_BASE}/specialist/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: specialistName, email, password,
          phone: specialistPhone, specialization,
          clinicId: selectedClinicId,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Specialist registered successfully. Wait for clinic verification, then login.")
        setIsRegisterMode(false)
        setSpecialistName(""); setSpecialistPhone(""); setSpecialization("")
        setSelectedClinicId(""); setEmail(""); setPassword("")
      } else {
        setMessage(data.message || data.error || "Specialist registration failed")
      }
    } catch {
      setMessage("Server error")
    } finally {
      setIsLoading(false)
    }
  }

  // ─── NAV HELPERS ───────────────────────────────────────────────────────────
  const handleSelectUserType = (type: UserType) => {
    setUserType(type)
    setStep("enter-credentials")
    setMessage("")
  }

  const handleBack = () => {
    setStep("select-user")
    setUserType(null)
    setMessage("")
  }

  const resetForm = () => {
    setStep("select-user")
    setUserType(null)
    setPhone(""); setEmail(""); setPassword("")
    setName(""); setAge(""); setGender("")
    setIsRegisterMode(false)
    setMessage("")
  }

  const getUserTypeLabel = () => {
    switch (userType) {
      case "patient": return "Patient"
      case "specialist": return "Specialist"
      case "clinic": return "Clinic"
      default: return ""
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-teal-300 to-emerald-400" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/20 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-200/30 blur-3xl" />
      <div className="absolute top-[30%] right-[5%] w-32 h-32 rounded-full bg-emerald-300/40 blur-2xl" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <Heart className="w-7 h-7 text-teal-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-sm">MedBox</h1>
              <p className="text-sm text-white/80">Healthcare for Everyone</p>
            </div>

            {/* ── Offline badge ── */}
            {isOffline && (
              <div className="ml-auto flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">
                <WifiOff className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white">Offline Mode</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">

            {/* Offline banner */}
            {isOffline && (
              <div className="mb-4 flex items-center gap-2 bg-amber-400/90 text-amber-900 rounded-2xl px-4 py-3 text-sm font-medium shadow">
                <WifiOff className="w-4 h-4 shrink-0" />
                You're offline. Patients can still log in using cached data.
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white drop-shadow-sm">Your Health, Our Priority</h2>
              <p className="text-white/80 text-sm mt-2">Select your role to get started</p>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                {step !== "select-user" && (
                  <button
                    onClick={handleBack}
                    className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                  </button>
                )}

                {step !== "select-user" && (
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                      userType === "patient"
                        ? "bg-gradient-to-br from-cyan-400 to-cyan-500"
                        : userType === "specialist"
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-500"
                        : "bg-gradient-to-br from-teal-400 to-teal-500"
                    }`}>
                      {userType === "patient" && <User className="w-8 h-8 text-white" />}
                      {userType === "specialist" && <Stethoscope className="w-8 h-8 text-white" />}
                      {userType === "clinic" && <Building2 className="w-8 h-8 text-white" />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{getUserTypeLabel()} Login</h3>
                    <p className="text-gray-500 text-sm mt-1">Enter your credentials to continue</p>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6">
                {/* ── Role selection ── */}
                {step === "select-user" && (
                  <div className="space-y-4">
                    <button
                      onClick={() => handleSelectUserType("patient")}
                      className="w-full group relative overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-r from-cyan-50 to-cyan-100 p-5 text-left transition-all hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-200 group-hover:scale-110 transition-transform">
                          <User className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-lg">Patient</p>
                          <p className="text-sm text-gray-500">Access health profiles</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectUserType("specialist")}
                      className="w-full group relative overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-r from-emerald-50 to-emerald-100 p-5 text-left transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                          <Stethoscope className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-lg">Specialist</p>
                          <p className="text-sm text-gray-500">Provide consultations</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectUserType("clinic")}
                      className="w-full group relative overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-r from-teal-50 to-teal-100 p-5 text-left transition-all hover:border-teal-400 hover:shadow-lg hover:shadow-teal-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform">
                          <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-lg">Clinic</p>
                          <p className="text-sm text-gray-500">Manage patients & records</p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* ── Credentials form ── */}
                {step === "enter-credentials" && (
                  <div className="space-y-4">

                    {/* PATIENT */}
                    {userType === "patient" && (
                      <>
                        <Input
                          type="tel"
                          placeholder="Enter phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />

                        {isRegisterMode && (
                          <>
                            <Input placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} />
                            <Input placeholder="Enter age" value={age} onChange={(e) => setAge(e.target.value)} />
                            <Input placeholder="Enter gender" value={gender} onChange={(e) => setGender(e.target.value)} />
                          </>
                        )}

                        <Button
                          onClick={isRegisterMode ? handlePatientRegister : handleLogin}
                          disabled={isLoading || (isOffline && isRegisterMode)}
                          className="w-full"
                        >
                          {isLoading
                            ? "Please wait..."
                            : isRegisterMode
                            ? "Register Patient"
                            : isOffline
                            ? "Login with Cached Data"
                            : "Login Patient"}
                        </Button>

                        {/* Hide register option when offline */}
                        {!isOffline && (
                          <Button
                            variant="outline"
                            onClick={() => { setIsRegisterMode(!isRegisterMode); setMessage("") }}
                            className="w-full"
                          >
                            {isRegisterMode ? "Already registered? Login" : "New patient? Register"}
                          </Button>
                        )}

                        {isOffline && (
                          <p className="text-xs text-center text-amber-600">
                            Registration requires an internet connection.
                          </p>
                        )}
                      </>
                    )}

                    {/* CLINIC */}
                    {userType === "clinic" && (
                      <>
                        {isRegisterMode && (
                          <>
                            <Input placeholder="Clinic official name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                            <Input placeholder="Clinic phone" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} />
                            <Input placeholder="Clinic address" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
                            <Input placeholder="Government ID / License number" value={clinicLicenseNumber} onChange={(e) => setClinicLicenseNumber(e.target.value)} />
                          </>
                        )}
                        <Input type="email" placeholder="Enter clinic email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button onClick={isRegisterMode ? handleClinicRegister : handleLogin} disabled={isLoading} className="w-full">
                          {isLoading ? "Please wait..." : isRegisterMode ? "Register Clinic" : "Login as Clinic"}
                        </Button>
                        <Button variant="outline" onClick={() => { setIsRegisterMode(!isRegisterMode); setMessage("") }} className="w-full">
                          {isRegisterMode ? "Already registered? Login" : "New clinic? Register"}
                        </Button>
                      </>
                    )}

                    {/* SPECIALIST */}
                    {userType === "specialist" && (
                      <>
                        {isRegisterMode && (
                          <>
                            <Input placeholder="Doctor full name" value={specialistName} onChange={(e) => setSpecialistName(e.target.value)} />
                            <Input placeholder="Doctor phone" value={specialistPhone} onChange={(e) => setSpecialistPhone(e.target.value)} />
                            <Input placeholder="Specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                            <select
                              value={selectedClinicId}
                              onChange={(e) => setSelectedClinicId(e.target.value)}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Select clinic</option>
                              {clinics.map((clinic) => (
                                <option key={clinic.clinicId} value={clinic.clinicId}>
                                  {clinic.name} ({clinic.clinicId})
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                        <Input type="email" placeholder="Enter specialist email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button onClick={isRegisterMode ? handleSpecialistRegister : handleLogin} disabled={isLoading} className="w-full">
                          {isLoading ? "Please wait..." : isRegisterMode ? "Register Specialist" : "Login as Specialist"}
                        </Button>
                        <Button variant="outline" onClick={() => { setIsRegisterMode(!isRegisterMode); setMessage("") }} className="w-full">
                          {isRegisterMode ? "Already registered? Login" : "New specialist? Register"}
                        </Button>
                      </>
                    )}

                    {message && (
                      <p className={`text-sm text-center ${message.includes("success") || message.includes("added") ? "text-green-600" : "text-red-600"}`}>
                        {message}
                      </p>
                    )}

                    <Button variant="ghost" onClick={resetForm} className="w-full">
                      Back to user selection
                    </Button>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6">
                <div className="pt-4 border-t border-gray-100">
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Need help? Call 1800-XXX-XXXX</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="px-6 py-4">
          <p className="text-center text-sm text-white/80">Secure healthcare access for rural communities</p>
        </footer>
      </div>
    </main>
  )
}
