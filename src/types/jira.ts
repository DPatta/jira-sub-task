import { IssueStatus, Priority, IssueType } from "./todo"

export interface JiraCredentials {
  siteUrl: string
  email: string
  token: string
  accountId: string
  projectKey?: string
  projectName?: string
}

export interface JiraUser {
  accountId: string
  displayName: string
  avatarUrls: {
    "48x48": string
    "24x24": string
  }
}

export interface JiraStatus {
  id: string
  name: string
  statusCategory: {
    key: "new" | "indeterminate" | "done" | "undefined"
    name: string
    colorName: string
  }
}

export interface JiraTransition {
  id: string
  name: string
  to: JiraStatus
}

export interface JiraPriority {
  id: string
  name: string
  iconUrl: string
}

export interface JiraIssueType {
  id: string
  name: string
  iconUrl: string
  subtask: boolean
}

// Atlassian Document Format types
export type AdfMark =
  | { type: "strong" }
  | { type: "em" }
  | { type: "code" }
  | { type: "underline" }
  | { type: "strike" }
  | { type: "textColor"; attrs: { color: string } }
  | { type: "link"; attrs: { href: string; title?: string } }

export type AdfNode =
  | { type: "doc"; content?: AdfNode[] }
  | { type: "paragraph"; content?: AdfNode[] }
  | { type: "heading"; attrs: { level: number }; content?: AdfNode[] }
  | { type: "bulletList"; content?: AdfNode[] }
  | { type: "orderedList"; content?: AdfNode[] }
  | { type: "listItem"; content?: AdfNode[] }
  | { type: "codeBlock"; attrs?: { language?: string }; content?: AdfNode[] }
  | { type: "blockquote"; content?: AdfNode[] }
  | { type: "hardBreak" }
  | { type: "rule" }
  | { type: "text"; text: string; marks?: AdfMark[] }
  | { type: "mention"; attrs: { id: string; displayName?: string; text?: string } }
  | { type: "inlineCard"; attrs: { url: string } }
  | { type: string; content?: AdfNode[]; attrs?: Record<string, unknown>; text?: string; marks?: AdfMark[] }

export interface AdfDocument {
  version: 1
  type: "doc"
  content?: AdfNode[]
}

export interface JiraComment {
  id: string
  author: JiraUser
  body: AdfDocument | string
  created: string
  updated: string
}

export interface JiraSubtask {
  id: string
  key: string
  fields: {
    summary: string
    status: JiraStatus
    issuetype: JiraIssueType
  }
}

export interface JiraIssueSummary {
  id: string
  key: string
  fields: {
    summary: string
    description?: AdfDocument | string | null
    status: JiraStatus
    priority?: JiraPriority
    issuetype: JiraIssueType
    assignee?: JiraUser | null
    reporter?: JiraUser | null
    comment?: {
      comments: JiraComment[]
      total: number
    }
    subtasks?: JiraSubtask[]
    customfield_10016?: number | null
    parent?: {
      id: string
      key: string
      fields: {
        summary: string
        status: JiraStatus
        issuetype: JiraIssueType
      }
    }
    created: string
    updated: string
  }
}

export interface JiraProject {
  id: string
  key: string
  name: string
  avatarUrls: {
    "48x48": string
  }
}

// Helper functions
export function categoryToStatus(statusName: string): IssueStatus {
  switch (statusName.toUpperCase()) {
    case "TO DO":
      return "todo"
    case "DEV IN PROGRESS":
      return "devinprogress"
    case "DONE DEVELOP":
      return "donedevelop"
    case "QA IN PROGRESS":
      return "qainprogress"
    case "BUG":
      return "bug"
    case "READY TO TEST":
      return "readytotest"
    case "READY TO DEPLOY":
      return "readytodeploy"
    case "ON HOLD":
      return "onhold"
    case "DONE":
      return "done"
    default:
      return "todo"
  }
}

export const statusToJiraName: Record<IssueStatus, string> = {
  todo: "TO DO",
  devinprogress: "DEV IN PROGRESS",
  donedevelop: "DONE DEVELOP",
  qainprogress: "QA IN PROGRESS",
  bug: "BUG",
  readytotest: "READY TO TEST",
  readytodeploy: "READY TO DEPLOY",
  onhold: "ON HOLD",
  done: "DONE",
}

export function mapPriority(name?: string): Priority {
  if (!name) return "medium"
  const lower = name.toLowerCase()
  if (lower === "highest") return "highest"
  if (lower === "high") return "high"
  if (lower === "medium") return "medium"
  if (lower === "low") return "low"
  if (lower === "lowest") return "lowest"
  return "medium"
}

export function mapIssueType(name?: string): IssueType {
  if (!name) return "task"
  const lower = name.toLowerCase()
  if (lower === "bug") return "bug"
  if (lower === "story") return "story"
  return "task"
}
