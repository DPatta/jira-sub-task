"use client"
import { createContext, useContext, useState, ReactNode } from "react"

interface ThemeContextValue {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggle: () => {} })

function resolveInitialTheme(): boolean {
  if (typeof window === "undefined") return false
  const saved = localStorage.getItem("theme")
  if (saved) return saved === "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const dark = resolveInitialTheme()
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", dark)
    }
    return dark
  })

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem("theme", next ? "dark" : "light")
      document.documentElement.classList.toggle("dark", next)
      return next
    })
  }

  return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
