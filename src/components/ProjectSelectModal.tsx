"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, Loader2, LogOut } from "lucide-react"
import { JiraCredentials, JiraProject, JiraUser } from "@/types/jira"
import { jiraApi } from "@/lib/jira-api"

interface ProjectSelectModalProps {
  creds: JiraCredentials
  onSelect: (project: JiraProject) => void
  onLogout: () => void
}

export function ProjectSelectModal({ creds, onSelect, onLogout }: ProjectSelectModalProps) {
  const [projects, setProjects] = useState<JiraProject[]>([])
  const [user, setUser] = useState<JiraUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [fetchedUser, fetchedProjects] = await Promise.all([
          jiraApi.getMyself(creds),
          jiraApi.getProjects(creds),
        ])
        setUser(fetchedUser)
        setProjects(fetchedProjects)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [creds])

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const userInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : creds.email[0]?.toUpperCase() ?? "U"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(9,30,66,0.54)" }}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-2xl flex flex-col"
        style={{ background: "white", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#DFE1E6" }}
        >
          <div className="flex items-center gap-3">
            {user?.avatarUrls["48x48"] ? (
              <Image
                src={user.avatarUrls["48x48"]}
                alt={user.displayName}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: "#FF5630" }}
              >
                {userInitials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: "#172B4D" }}>
                {user?.displayName ?? "Loading..."}
              </p>
              <p className="text-xs" style={{ color: "#6B778C" }}>
                {creds.email}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border hover:bg-gray-50 transition-colors"
            style={{ color: "#42526E", borderColor: "#DFE1E6" }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>

        {/* Title */}
        <div className="px-6 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "#172B4D" }}>
            Select Project
          </h2>

          {/* Search */}
          <div
            className="flex items-center gap-2 h-9 px-3 rounded border"
            style={{ borderColor: "#DFE1E6" }}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#6B778C" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: "#172B4D" }}
            />
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#0052CC" }} />
            </div>
          )}

          {error && (
            <div
              className="mx-2 px-3 py-2.5 rounded text-sm"
              style={{ background: "#FFEBE6", color: "#DE350B", border: "1px solid #FFBDAD" }}
            >
              {error}
            </div>
          )}

          {!loading && !error && filteredProjects.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "#6B778C" }}>
              {searchQuery ? "No projects match your search" : "No projects found"}
            </p>
          )}

          {!loading && !error && filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelect(project)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded hover:bg-blue-50 transition-colors text-left mb-1"
            >
              {project.avatarUrls["48x48"] ? (
                <Image
                  src={project.avatarUrls["48x48"]}
                  alt={project.name}
                  width={36}
                  height={36}
                  className="rounded object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "#0052CC" }}
                >
                  {project.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#172B4D" }}>
                  {project.name}
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0"
                style={{ background: "#DEEBFF", color: "#0052CC" }}
              >
                {project.key}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
