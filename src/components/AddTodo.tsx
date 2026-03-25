"use client"

import { useState } from "react"
import { Todo, IssueStatus, IssueType, Priority } from "@/types/todo"
import { X, Bug, CheckSquare, BookOpen, ChevronDown } from "lucide-react"
import { useTheme } from "@/lib/theme"

interface AddTodoProps {
  defaultStatus: IssueStatus
  projectName: string
  onAdd: (data: Omit<Todo, "id" | "issueKey" | "createdAt" | "updatedAt">) => void
  onClose: () => void
  isJiraConnected?: boolean
  createError?: string | null
}

const TYPES: { value: IssueType; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { value: "task", label: "Task", color: "#0052CC", bg: "#DEEBFF", icon: <CheckSquare className="h-4 w-4" /> },
  { value: "bug", label: "Bug", color: "#DE350B", bg: "#FFEBE6", icon: <Bug className="h-4 w-4" /> },
  { value: "story", label: "Story", color: "#00875A", bg: "#E3FCEF", icon: <BookOpen className="h-4 w-4" /> },
]

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "highest", label: "Highest", color: "#FF5630" },
  { value: "high", label: "High", color: "#FF7452" },
  { value: "medium", label: "Medium", color: "#FFAB00" },
  { value: "low", label: "Low", color: "#2684FF" },
  { value: "lowest", label: "Lowest", color: "#4C9AFF" },
]

const STATUSES: { value: IssueStatus; label: string; color: string }[] = [
  { value: "todo", label: "TO DO", color: "#42526E" },
  { value: "devinprogress", label: "DEV IN PROGRESS", color: "#0052CC" },
  { value: "donedevelop", label: "DONE DEVELOP", color: "#36B37E" },
  { value: "qainprogress", label: "QA IN PROGRESS", color: "#6554C0" },
  { value: "bug", label: "BUG", color: "#FF5630" },
  { value: "readytotest", label: "READY TO TEST", color: "#FF991F" },
  { value: "readytodeploy", label: "READY TO DEPLOY", color: "#00B8D9" },
  { value: "onhold", label: "ON HOLD", color: "#97A0AF" },
  { value: "done", label: "DONE", color: "#00875A" },
]

export function AddTodo({ defaultStatus, projectName, onAdd, onClose, isJiraConnected, createError }: AddTodoProps) {
  const { isDark } = useTheme()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<IssueType>("task")
  const [priority, setPriority] = useState<Priority>("medium")
  const [status, setStatus] = useState<IssueStatus>(defaultStatus)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), description: description.trim() || undefined, type, priority, status })
  }

  const selectedPriority = PRIORITIES.find((p) => p.value === priority)!
  const selectedStatus = STATUSES.find((s) => s.value === status)!

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(9,30,66,0.54)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-lg rounded-lg shadow-2xl"
        style={{
          background: isDark ? "#253147" : "white",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: isDark ? "#2D3E57" : "#DFE1E6" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: isDark ? "#E6EDF5" : "#172B4D" }}>
            Create issue
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors"
            style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1E2C40" : "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Project (read-only) */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
              PROJECT
            </label>
            <div
              className="flex items-center gap-2 h-9 px-3 rounded border text-sm"
              style={{
                borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                color: isDark ? "#E6EDF5" : "#172B4D",
                background: isDark ? "#1E2C40" : "#F4F5F7",
              }}
            >
              <div
                className="w-5 h-5 rounded text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "#0052CC" }}
              >
                {projectName[0]}
              </div>
              {projectName}
            </div>
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
              ISSUE TYPE <span style={{ color: "#DE350B" }}>*</span>
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
                className="w-full h-9 pl-3 pr-8 rounded border text-sm appearance-none outline-none focus:ring-2 cursor-pointer"
                style={{
                  borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                  color: isDark ? "#E6EDF5" : "#172B4D",
                  background: isDark ? "#1B2232" : "white",
                  boxShadow: "none",
                }}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
              Start typing to get a list of possible matches.
            </p>
          </div>

          <hr style={{ borderColor: isDark ? "#2D3E57" : "#DFE1E6" }} />

          {/* Summary (title) */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
              SUMMARY <span style={{ color: "#DE350B" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a summary for the issue"
              className="w-full h-9 px-3 rounded border text-sm outline-none transition-shadow"
              style={{
                borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                color: isDark ? "#E6EDF5" : "#172B4D",
                background: isDark ? "#1B2232" : "white",
              }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgba(0,82,204,0.2)")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              className="w-full px-3 py-2 rounded border text-sm outline-none resize-none transition-shadow"
              style={{
                borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                color: isDark ? "#E6EDF5" : "#172B4D",
                background: isDark ? "#1B2232" : "white",
              }}
              onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgba(0,82,204,0.2)")}
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>

          {/* Status (hidden when Jira connected) + Priority row */}
          <div className={isJiraConnected ? "" : "grid grid-cols-2 gap-4"}>
            {!isJiraConnected && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
                  STATUS
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IssueStatus)}
                    className="w-full h-9 pl-3 pr-8 rounded border text-sm font-semibold appearance-none outline-none cursor-pointer"
                    style={{
                      borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                      color: selectedStatus.color,
                      background: isDark ? "#1B2232" : "white",
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}
                  />
                </div>
              </div>
            )}

            <div className={isJiraConnected ? "" : ""}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
                PRIORITY
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full h-9 pl-3 pr-8 rounded border text-sm appearance-none outline-none cursor-pointer"
                  style={{
                    borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                    color: selectedPriority.color,
                    background: isDark ? "#1B2232" : "white",
                  }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}
                />
              </div>
            </div>
          </div>

          {/* Error message */}
          {createError && (
            <div
              className="px-3 py-2.5 rounded text-sm"
              style={{ background: "#FFEBE6", color: "#DE350B", border: "1px solid #FFBDAD" }}
            >
              {createError}
            </div>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-2 pt-2 border-t"
            style={{ borderColor: isDark ? "#2D3E57" : "#DFE1E6" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 text-sm font-medium rounded border transition-colors"
              style={{
                borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                color: isDark ? "#8C9BAB" : "#42526E",
                background: isDark ? "#253147" : "white",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1E2C40" : "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? "#253147" : "white")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 h-9 text-sm font-semibold rounded text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#0052CC" }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
