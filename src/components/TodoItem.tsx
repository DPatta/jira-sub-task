"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Todo, IssueStatus, Priority, IssueType } from "@/types/todo";
import { useTheme } from "@/lib/theme";
import {
  MoreHorizontal,
  Trash2,
  Edit3,
  Check,
  X,
  Bug,
  CheckSquare,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  MessageSquare,
  GitBranch,
} from "lucide-react";

const TYPE_CONFIG: Record<
  IssueType,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  task: {
    label: "Task",
    color: "#0052CC",
    bg: "#DEEBFF",
    icon: <CheckSquare className="h-3.5 w-3.5" />,
  },
  bug: {
    label: "Bug",
    color: "#DE350B",
    bg: "#FFEBE6",
    icon: <Bug className="h-3.5 w-3.5" />,
  },
  story: {
    label: "Story",
    color: "#00875A",
    bg: "#E3FCEF",
    icon: <BookOpen className="h-3.5 w-3.5" />,
  },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  highest: { label: "Highest", color: "#BF2600", bg: "#FFEBE6", icon: <ArrowUp className="h-3 w-3" /> },
  high:    { label: "High",    color: "#DE350B", bg: "#FFEBE6", icon: <ArrowUp className="h-3 w-3" /> },
  medium:  { label: "Medium",  color: "#974F0C", bg: "#FFF0B3", icon: <Minus className="h-3 w-3" /> },
  low:     { label: "Low",     color: "#0747A6", bg: "#DEEBFF", icon: <ArrowDown className="h-3 w-3" /> },
  lowest:  { label: "Lowest",  color: "#0747A6", bg: "#EAE6FF", icon: <ArrowDown className="h-3 w-3" /> },
};

interface Column {
  id: IssueStatus;
  label: string;
  color: string;
}

interface TodoItemProps {
  todo: Todo & {
    jiraId?: string;
    commentCount?: number;
    storyPoints?: number | null;
    subtaskKeys?: Array<{ key: string; title: string; status: IssueStatus }>;
    parentKey?: string;
    parentTitle?: string;
    assigneeDisplayName?: string;
    assigneeAvatarUrl?: string;
  };
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onStoryPointsChange?: (key: string, points: number | null) => void;
  columns: Column[];
  onDetailOpen?: (key: string) => void;
  onDragStart?: (key: string) => void;
  isDragging?: boolean;
}

export function TodoItem({
  todo,
  onDelete,
  onEdit,
  onStatusChange,
  onStoryPointsChange,
  columns,
  onDetailOpen,
  onDragStart,
  isDragging,
}: TodoItemProps) {
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [editPoints, setEditPoints] = useState<string>(
    todo.storyPoints != null ? String(todo.storyPoints) : "",
  );
  const menuRef = useRef<HTMLDivElement>(null);


  const type = TYPE_CONFIG[todo.type];
  const priority = PRIORITY_CONFIG[todo.priority];
  const otherColumns = columns.filter((c) => c.id !== todo.status);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowMoveMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = useCallback(() => {
    if (editTitle.trim()) {
      onEdit(todo.id, editTitle.trim());
      setIsEditing(false);
    }
  }, [editTitle, onEdit, todo.id]);

  const handleCancel = useCallback(() => {
    setEditTitle(todo.title);
    setIsEditing(false);
  }, [todo.title]);

  const handleSavePoints = useCallback(() => {
    if (!onStoryPointsChange) return;
    const trimmed = editPoints.trim();
    if (trimmed === "") {
      onStoryPointsChange(todo.issueKey, null);
    } else {
      const num = Number(trimmed);
      if (!isNaN(num) && num >= 0) {
        onStoryPointsChange(todo.issueKey, num);
      }
    }
    setIsEditingPoints(false);
  }, [editPoints, onStoryPointsChange, todo.issueKey]);

  const handleCancelPoints = useCallback(() => {
    setEditPoints(todo.storyPoints != null ? String(todo.storyPoints) : "");
    setIsEditingPoints(false);
  }, [todo.storyPoints]);

  const commentCount = todo.commentCount ?? 0;
  const subtaskCount = todo.subtaskKeys?.length ?? 0;
  const hasParent = !!todo.parentKey;

  const assigneeInitial = todo.assigneeDisplayName
    ? todo.assigneeDisplayName[0].toUpperCase()
    : "U";

  return (
    <div
      className="rounded shadow-sm border hover:shadow-md transition-shadow group cursor-pointer"
      style={{
        background: isDark ? "#253147" : "white",
        borderColor: isDark ? "#2D3E57" : "#DFE1E6",
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={() => {
        if (!isEditing && !isEditingPoints && onDetailOpen) onDetailOpen(todo.issueKey);
      }}
      draggable={!!onDragStart}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart?.(todo.issueKey);
      }}
    >
      <div className="p-3">
        {/* Parent badge */}
        {hasParent && (
          <div className="mb-1.5">
            <span className="text-xs" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
              ↳ {todo.parentKey}
            </span>
          </div>
        )}

        {/* Type badge + menu */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ background: type.bg, color: type.color }}
          >
            {type.icon}
            {type.label}
          </span>

          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all"
              style={{
                color: isDark ? "#8C9BAB" : "#42526E",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#2D3E57" : "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => {
                setShowMenu((v) => !v);
                setShowMoveMenu(false);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-7 z-30 w-44 rounded shadow-lg border py-1"
                style={{
                  background: isDark ? "#253147" : "white",
                  borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                }}
              >
                {onDetailOpen && (
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                    style={{ color: isDark ? "#E6EDF5" : "#172B4D" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1E2C40" : "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => {
                      setShowMenu(false);
                      onDetailOpen(todo.issueKey);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" style={{ color: isDark ? "#8C9BAB" : "#9ca3af" }} />
                    View details
                  </button>
                )}

                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                  style={{ color: isDark ? "#E6EDF5" : "#172B4D" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1E2C40" : "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => {
                    setShowMenu(false);
                    setEditTitle(todo.title);
                    setIsEditing(true);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5" style={{ color: isDark ? "#8C9BAB" : "#9ca3af" }} />
                  Edit title
                </button>

                {otherColumns.length > 0 && (
                  <div
                    className="relative"
                    onMouseEnter={() => setShowMoveMenu(true)}
                    onMouseLeave={() => setShowMoveMenu(false)}
                  >
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left"
                      style={{ color: isDark ? "#E6EDF5" : "#172B4D" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1E2C40" : "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span className="flex items-center gap-2.5">
                        <ChevronRight className="h-3.5 w-3.5" style={{ color: isDark ? "#8C9BAB" : "#9ca3af" }} />
                        Move to
                      </span>
                      <ChevronRight className="h-3 w-3" style={{ color: isDark ? "#8C9BAB" : "#9ca3af" }} />
                    </button>

                    {showMoveMenu && (
                      <div
                        className="absolute left-full top-0 -ml-1 w-40 rounded shadow-lg border py-1 z-40"
                        style={{
                          background: isDark ? "#253147" : "white",
                          borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                        }}
                      >
                        {otherColumns.map((col) => (
                          <button
                            key={col.id}
                            className="w-full text-left px-3 py-2 text-xs font-bold transition-colors tracking-wide"
                            style={{ color: col.color }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#1E2C40" : "#f9fafb")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            onClick={() => {
                              onStatusChange(todo.issueKey, col.id);
                              setShowMenu(false);
                              setShowMoveMenu(false);
                            }}
                          >
                            {col.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <hr style={{ borderColor: isDark ? "#2D3E57" : "#DFE1E6" }} className="my-1" />

                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                  style={{ color: "#DE350B" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#3D1A1A" : "#fef2f2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => {
                    onDelete(todo.id);
                    setShowMenu(false);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        {isEditing ? (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="w-full text-sm border rounded px-2 py-1.5 outline-none"
              style={{
                borderColor: "#0052CC",
                color: isDark ? "#E6EDF5" : "#172B4D",
                background: isDark ? "#1B2232" : "white",
                boxShadow: "0 0 0 2px rgba(0,82,204,0.2)",
              }}
              autoFocus
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded text-white"
                style={{ background: "#0052CC" }}
              >
                <Check className="h-3 w-3" /> Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border"
                style={{
                  borderColor: isDark ? "#2D3E57" : "#DFE1E6",
                  color: isDark ? "#8C9BAB" : "#42526E",
                  background: isDark ? "#253147" : "white",
                }}
              >
                <X className="h-3 w-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-sm leading-snug"
            style={{ color: isDark ? "#E6EDF5" : "#172B4D" }}
          >
            {todo.title}
          </p>
        )}

        {/* Subtask / comment badges */}
        {(subtaskCount > 0 || commentCount > 0) && (
          <div className="flex items-center gap-2 mt-2">
            {subtaskCount > 0 && (
              <span
                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: isDark ? "#1E2C40" : "#F4F5F7",
                  color: isDark ? "#8C9BAB" : "#6B778C",
                }}
                title={`${subtaskCount} subtask${subtaskCount !== 1 ? "s" : ""}`}
              >
                <GitBranch className="h-3 w-3" />
                {subtaskCount}
              </span>
            )}
            {commentCount > 0 && (
              <span
                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: isDark ? "#1E2C40" : "#F4F5F7",
                  color: isDark ? "#8C9BAB" : "#6B778C",
                }}
                title={`${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
              >
                <MessageSquare className="h-3 w-3" />
                {commentCount}
              </span>
            )}
          </div>
        )}

        {/* Footer: key + SP + priority + assignee */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-xs font-medium" style={{ color: isDark ? "#8C9BAB" : "#6B778C" }}>
            {todo.issueKey}
          </span>
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {onStoryPointsChange &&
              (isEditingPoints ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={editPoints}
                    onChange={(e) => setEditPoints(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSavePoints();
                      if (e.key === "Escape") handleCancelPoints();
                    }}
                    onBlur={handleSavePoints}
                    className="w-10 text-xs border rounded px-1 py-0.5 outline-none text-center"
                    style={{
                      borderColor: "#0052CC",
                      color: isDark ? "#E6EDF5" : "#172B4D",
                      background: isDark ? "#1B2232" : "white",
                      boxShadow: "0 0 0 2px rgba(0,82,204,0.2)",
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditPoints(todo.storyPoints != null ? String(todo.storyPoints) : "");
                    setIsEditingPoints(true);
                  }}
                  title="Set story points"
                  className="flex items-center justify-center min-w-5 h-5 px-1 rounded text-xs font-semibold hover:bg-blue-50 transition-colors"
                  style={{
                    background:
                      todo.storyPoints != null
                        ? isDark ? "#1C3A6B" : "#DEEBFF"
                        : isDark ? "#1E2C40" : "#F4F5F7",
                    color: todo.storyPoints != null ? "#4C9AFF" : isDark ? "#8C9BAB" : "#97A0AF",
                  }}
                >
                  {todo.storyPoints != null ? todo.storyPoints : "SP"}
                </button>
              ))}
          </div>
          <div className="flex items-center gap-1">
            <span
              title={`Priority: ${priority.label}`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold"
              style={{ background: priority.bg, color: priority.color }}
            >
              {priority.icon}
            </span>
            {todo.assigneeAvatarUrl ? (
              <Image
                src={todo.assigneeAvatarUrl}
                alt={todo.assigneeDisplayName ?? "Assignee"}
                width={20}
                height={20}
                className="rounded-full object-cover"
                title={todo.assigneeDisplayName}
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: "#0052CC", fontSize: "9px" }}
                title={todo.assigneeDisplayName ?? "Unassigned"}
              >
                {assigneeInitial}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
