"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { TodoItem } from "./TodoItem"
import { AddTodo } from "./AddTodo"
import { IssueDetailModal } from "./IssueDetailModal"
import { SubTasksSidePanel } from "./SubTasksSidePanel"
import { IssueStatus } from "@/types/todo"
import { JiraCredentials } from "@/types/jira"
import { useJiraBoard } from "@/hooks/useJiraBoard"
import { jiraApi } from "@/lib/jira-api"
import {
  Plus,
  Search,
  Layout,
  RefreshCw,
  LogOut,
  FolderOpen,
  CheckSquare,
} from "lucide-react"

const COLUMNS: { id: IssueStatus; label: string; color: string }[] = [
  { id: "todo", label: "TO DO", color: "#42526E" },
  { id: "devinprogress", label: "DEV IN PROGRESS", color: "#0052CC" },
  { id: "donedevelop", label: "DONE DEVELOP", color: "#36B37E" },
  { id: "qainprogress", label: "QA IN PROGRESS", color: "#6554C0" },
  { id: "bug", label: "BUG", color: "#FF5630" },
  { id: "readytotest", label: "READY TO TEST", color: "#FF991F" },
  { id: "readytodeploy", label: "READY TO DEPLOY", color: "#00B8D9" },
  { id: "onhold", label: "ON HOLD", color: "#97A0AF" },
  { id: "done", label: "DONE", color: "#00875A" },
]

type ActiveView = "board" | "subtasks"

const NAV_ITEMS: { icon: React.ReactNode; label: string; view: ActiveView }[] = [
  { icon: <Layout className="h-4 w-4" />, label: "Board", view: "board" },
  { icon: <CheckSquare className="h-4 w-4" />, label: "My Sub-tasks", view: "subtasks" },
]

interface TodoListProps {
  creds: JiraCredentials
  onChangeProject: () => void
  onLogout: () => void
}

export function TodoList({ creds, onChangeProject, onLogout }: TodoListProps) {
  const PROJECT_NAME = creds.projectName ?? "My Project"
  const PROJECT_KEY = creds.projectKey ?? "PROJ"

  const { todos, loading, error, refresh, moveIssue, updateTitle, updateStoryPoints } = useJiraBoard(
    creds,
    creds.projectKey ?? null
  )

  const [activeView, setActiveView] = useState<ActiveView>("board")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<IssueStatus>("todo")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<IssueStatus | null>(null)

  // Load board on mount
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }, [refresh])

  const addTodo = useCallback(
    async (data: {
      title: string
      description?: string
      type: import("@/types/todo").IssueType
      priority: import("@/types/todo").Priority
      status: IssueStatus
    }) => {
      setCreateError(null)
      try {
        await jiraApi.createIssue(creds, PROJECT_KEY, {
          title: data.title,
          description: data.description,
          type: data.type,
          priority: data.priority,
        })
        setShowCreateModal(false)
        await refresh()
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : "Failed to create issue")
      }
    },
    [creds, PROJECT_KEY, refresh]
  )

  const openCreate = useCallback((status: IssueStatus = "todo") => {
    setDefaultStatus(status)
    setShowCreateModal(true)
    setCreateError(null)
  }, [])

  const filteredTodos = useMemo(
    () =>
      todos.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.issueKey.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [todos, searchQuery]
  )

  const userInitial = creds.email ? creds.email[0].toUpperCase() : "U"

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* ── Top Nav ── */}
      <nav
        className="h-12 flex items-center px-3 gap-1 z-20 flex-shrink-0 border-b"
        style={{ background: "#0052CC", borderColor: "#003D99" }}
      >
        <div className="flex items-center gap-2 mr-3">
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-bold text-sm select-none"
            style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
          >
            J
          </div>
        </div>

        <button
          onClick={() => openCreate("todo")}
          className="ml-2 px-4 h-7 text-sm font-semibold rounded hover:bg-blue-50 transition-colors"
          style={{ background: "white", color: "#0052CC" }}
        >
          Create
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 h-7 px-2.5 rounded text-sm"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Search className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.7)" }} />
            <input
              placeholder="Search"
              className="bg-transparent text-sm outline-none w-24 focus:w-40 transition-all"
              style={{ color: "white" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer select-none"
            style={{ background: "#FF5630", color: "white" }}
            title={creds.email}
          >
            {userInitial}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className="w-56 flex-shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ background: "#F4F5F7", borderColor: "#DFE1E6" }}
        >
          <div className="p-3 border-b flex items-center gap-2.5" style={{ borderColor: "#DFE1E6" }}>
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "#0052CC" }}
            >
              {PROJECT_NAME[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate" style={{ color: "#172B4D" }}>
                {PROJECT_NAME}
              </p>
              <p className="text-xs" style={{ color: "#6B778C" }}>
                Software project
              </p>
            </div>
          </div>

          <nav className="p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = item.view === activeView
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveView(item.view)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-left transition-colors"
                  style={{
                    background: isActive ? "#DEEBFF" : "transparent",
                    color: isActive ? "#0052CC" : "#42526E",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span style={{ color: isActive ? "#0052CC" : "#6B778C" }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto p-2 border-t space-y-0.5" style={{ borderColor: "#DFE1E6" }}>
            <button
              onClick={onChangeProject}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-left hover:bg-gray-200 transition-colors"
              style={{ color: "#42526E" }}
            >
              <FolderOpen className="h-4 w-4" style={{ color: "#6B778C" }} />
              Change project
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-left hover:bg-gray-200 transition-colors"
              style={{ color: "#42526E" }}
            >
              <LogOut className="h-4 w-4" style={{ color: "#6B778C" }} />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Sub-tasks panel ── */}
        {activeView === "subtasks" && <SubTasksSidePanel creds={creds} />}

        {/* ── Board ── */}
        <main
          className="flex-1 overflow-auto"
          style={{ background: "#F4F5F7", display: activeView === "board" ? undefined : "none" }}
        >
          <div className="p-6 min-w-max">
            {/* Breadcrumb */}
            <p className="text-xs mb-1" style={{ color: "#6B778C" }}>
              <span>Projects</span>
              <span className="mx-1">/</span>
              <span>{PROJECT_NAME}</span>
              <span className="mx-1">/</span>
              <span style={{ color: "#172B4D", fontWeight: 500 }}>Board</span>
            </p>

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold" style={{ color: "#172B4D" }}>
                Board
              </h1>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className="mb-4 px-3 py-2.5 rounded text-sm flex items-center justify-between"
                style={{ background: "#FFEBE6", color: "#DE350B", border: "1px solid #FFBDAD" }}
              >
                <span>{error}</span>
                <button
                  onClick={handleRefresh}
                  className="text-xs underline ml-2 font-medium"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Sprint bar */}
            <div className="flex items-center gap-3 mb-5">
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className="flex items-center gap-1.5 h-7 px-2.5 text-xs rounded border hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: "#42526E", borderColor: "#DFE1E6", background: "white" }}
                title="Refresh board"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading || isRefreshing ? "animate-spin" : ""}`}
                />
                {loading || isRefreshing ? "Refreshing..." : "Refresh"}
              </button>

              <div className="ml-auto">
                <div
                  className="flex items-center gap-1.5 h-8 px-2.5 rounded border bg-white"
                  style={{ borderColor: "#DFE1E6" }}
                >
                  <Search className="h-3.5 w-3.5" style={{ color: "#6B778C" }} />
                  <input
                    placeholder="Filter issues..."
                    className="outline-none text-sm w-40"
                    style={{ color: "#172B4D" }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Kanban columns */}
            <div className="flex gap-3 items-start">
              {COLUMNS.map((column) => {
                const columnTodos = filteredTodos.filter((t) => t.status === column.id)
                return (
                  <div
                    key={column.id}
                    className="w-72 flex-shrink-0 rounded"
                    style={{
                      background: "#EBECF0",
                      outline: dragOverColumn === column.id ? "2px solid #0052CC" : "none",
                      outlineOffset: "2px",
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColumn(column.id) }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverColumn(null)
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggingKey && draggingKey !== "") {
                        moveIssue(draggingKey, column.id)
                      }
                      setDraggingKey(null)
                      setDragOverColumn(null)
                    }}
                  >
                    <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold tracking-widest"
                          style={{ color: column.color }}
                        >
                          {column.label}
                        </span>
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "#C1C7D0", color: "#42526E" }}
                        >
                          {columnTodos.length}
                        </span>
                      </div>
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-300 transition-colors"
                        style={{ color: "#42526E" }}
                        onClick={() => openCreate(column.id)}
                        title="Create issue"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="px-2 pb-2 space-y-2 min-h-20">
                      {columnTodos.length === 0 && !loading && (
                        <p
                          className="text-xs text-center py-6 opacity-40"
                          style={{ color: "#42526E" }}
                        >
                          No issues
                        </p>
                      )}
                      {loading && columnTodos.length === 0 && (
                        <p
                          className="text-xs text-center py-6 opacity-40"
                          style={{ color: "#42526E" }}
                        >
                          Loading...
                        </p>
                      )}
                      {columnTodos.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          onDelete={() => {}}
                          onEdit={updateTitle}
                          onStatusChange={moveIssue}
                          onStoryPointsChange={updateStoryPoints}
                          columns={COLUMNS}
                          onDetailOpen={(key) => setSelectedIssueKey(key)}
                          onDragStart={(key) => setDraggingKey(key)}
                          isDragging={draggingKey === todo.issueKey}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {showCreateModal && (
        <AddTodo
          defaultStatus={defaultStatus}
          onAdd={addTodo}
          onClose={() => {
            setShowCreateModal(false)
            setCreateError(null)
          }}
          projectName={PROJECT_NAME}
          isJiraConnected={true}
          createError={createError}
        />
      )}

      {selectedIssueKey && (
        <IssueDetailModal
          issueKey={selectedIssueKey}
          creds={creds}
          onClose={() => setSelectedIssueKey(null)}
          onStatusChange={(key, status) => {
            moveIssue(key, status)
          }}
          onTitleUpdate={(key, title) => {
            updateTitle(key, title)
          }}
        />
      )}
    </div>
  )
}
