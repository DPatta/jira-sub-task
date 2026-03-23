"use client"

import { useState } from "react"
import { JiraCredentials } from "@/types/jira"
import { loadCredentials, saveCredentials, clearCredentials } from "@/lib/jira-credentials"

interface UseJiraCredentialsReturn {
  creds: JiraCredentials | null
  isReady: boolean
  save: (creds: JiraCredentials) => void
  clear: () => void
}

export function useJiraCredentials(): UseJiraCredentialsReturn {
  // Lazy initializer runs only on the client (window is defined), never on the server.
  // This replaces the useEffect + setState pattern while keeping SSR-safe behavior.
  const [creds, setCreds] = useState<JiraCredentials | null>(() =>
    typeof window !== "undefined" ? loadCredentials() : null
  )

  // isReady mirrors whether the client has hydrated (always true after first render on client)
  const [isReady] = useState(() => typeof window !== "undefined")

  const save = (newCreds: JiraCredentials) => {
    saveCredentials(newCreds)
    setCreds(newCreds)
  }

  const clear = () => {
    clearCredentials()
    setCreds(null)
  }

  return { creds, isReady, save, clear }
}
