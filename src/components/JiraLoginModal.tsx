"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { JiraCredentials } from "@/types/jira"
import { jiraApi } from "@/lib/jira-api"
import { normalizeSiteUrl } from "@/lib/jira-credentials"

interface JiraLoginModalProps {
  onSave: (creds: JiraCredentials) => void
}

export function JiraLoginModal({ onSave }: JiraLoginModalProps) {
  const [siteUrl, setSiteUrl] = useState("")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    siteUrl?: string
    email?: string
    token?: string
  }>({})

  const validate = () => {
    const errors: typeof fieldErrors = {}
    if (!siteUrl.trim()) errors.siteUrl = "Site URL is required"
    if (!email.trim()) errors.email = "Email is required"
    if (!token.trim()) errors.token = "API Token is required"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    const normalizedUrl = normalizeSiteUrl(siteUrl)
    setLoading(true)

    try {
      const tempCreds: JiraCredentials = {
        siteUrl: normalizedUrl,
        email: email.trim(),
        token: token.trim(),
        accountId: "",
      }

      const user = await jiraApi.getMyself(tempCreds)

      onSave({
        siteUrl: normalizedUrl,
        email: email.trim(),
        token: token.trim(),
        accountId: user.accountId,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to Jira. Please check your credentials."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(9,30,66,0.54)" }}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-2xl p-8"
        style={{ background: "white" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3"
            style={{ background: "#0052CC" }}
          >
            J
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "#172B4D" }}>
            Connect to Jira
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B778C" }}>
            Enter your Jira Cloud credentials to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Site URL */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B778C" }}>
              JIRA SITE URL
            </label>
            <input
              type="text"
              value={siteUrl}
              onChange={(e) => {
                setSiteUrl(normalizeSiteUrl(e.target.value))
                setFieldErrors((prev) => ({ ...prev, siteUrl: undefined }))
              }}
              placeholder="https://company.atlassian.net"
              className="w-full h-10 px-3 rounded border text-sm outline-none transition-shadow"
              style={{
                borderColor: fieldErrors.siteUrl ? "#DE350B" : "#DFE1E6",
                color: "#172B4D",
              }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgba(0,82,204,0.2)")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {fieldErrors.siteUrl && (
              <p className="text-xs mt-1" style={{ color: "#DE350B" }}>
                {fieldErrors.siteUrl}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B778C" }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldErrors((prev) => ({ ...prev, email: undefined }))
              }}
              placeholder="you@company.com"
              className="w-full h-10 px-3 rounded border text-sm outline-none transition-shadow"
              style={{
                borderColor: fieldErrors.email ? "#DE350B" : "#DFE1E6",
                color: "#172B4D",
              }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgba(0,82,204,0.2)")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {fieldErrors.email && (
              <p className="text-xs mt-1" style={{ color: "#DE350B" }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* API Token */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B778C" }}>
              API TOKEN
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, token: undefined }))
                }}
                placeholder="Your Jira API token"
                className="w-full h-10 px-3 pr-10 rounded border text-sm outline-none transition-shadow"
                style={{
                  borderColor: fieldErrors.token ? "#DE350B" : "#DFE1E6",
                  color: "#172B4D",
                }}
                onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgba(0,82,204,0.2)")}
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "#6B778C" }}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.token && (
              <p className="text-xs mt-1" style={{ color: "#DE350B" }}>
                {fieldErrors.token}
              </p>
            )}
            <p className="text-xs mt-1.5" style={{ color: "#6B778C" }}>
              Get your API token at{" "}
              <span className="font-medium" style={{ color: "#0052CC" }}>
                id.atlassian.com/manage-profile/security/api-tokens
              </span>
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="px-3 py-2.5 rounded text-sm"
              style={{ background: "#FFEBE6", color: "#DE350B", border: "1px solid #FFBDAD" }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 text-sm font-semibold rounded text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            style={{ background: "#0052CC" }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Connecting..." : "Connect"}
          </button>
        </form>
      </div>
    </div>
  )
}
