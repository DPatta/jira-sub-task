export type Priority = "highest" | "high" | "medium" | "low" | "lowest"
export type IssueType = "task" | "bug" | "story"
export type IssueStatus =
  | "todo"
  | "devinprogress"
  | "donedevelop"
  | "qainprogress"
  | "bug"
  | "readytotest"
  | "readytodeploy"
  | "onhold"
  | "done"

export interface Todo {
  id: string
  issueKey: string
  title: string
  description?: string
  status: IssueStatus
  priority: Priority
  type: IssueType
  createdAt: Date
  updatedAt: Date
}
