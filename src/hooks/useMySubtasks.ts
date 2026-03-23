"use client"

import { useState, useCallback } from "react"
import { IssueStatus, Priority } from "@/types/todo"
import { JiraCredentials, JiraIssueSummary, AdfDocument, categoryToStatus, statusToJiraName, mapPriority } from "@/types/jira"
import { jiraApi } from "@/lib/jira-api"

export interface SubtaskItem {
  key: string
  title: string
  status: IssueStatus
  statusName: string
  priority: Priority
  assigneeDisplayName?: string
  assigneeAvatarUrl?: string
  description?: AdfDocument | string | null
  parentKey: string
  parentTitle: string
  parentType: string
  createdAt: string
  updatedAt: string
}

export interface SubtaskGroup {
  parentKey: string
  parentTitle: string
  parentType: string
  subtasks: SubtaskItem[]
  doneCount: number
}

const DONE_STATUSES: IssueStatus[] = ["done", "donedevelop"]

function mapSubtask(issue: JiraIssueSummary): SubtaskItem {
  return {
    key: issue.key,
    title: issue.fields.summary,
    status: categoryToStatus(issue.fields.status.name),
    statusName: issue.fields.status.name,
    priority: mapPriority(issue.fields.priority?.name),
    assigneeDisplayName: issue.fields.assignee?.displayName,
    assigneeAvatarUrl: issue.fields.assignee?.avatarUrls["24x24"],
    description: issue.fields.description,
    parentKey: issue.fields.parent?.key ?? "",
    parentTitle: issue.fields.parent?.fields.summary ?? "",
    parentType: issue.fields.parent?.fields.issuetype?.name ?? "Issue",
    createdAt: issue.fields.created,
    updatedAt: issue.fields.updated,
  }
}

function groupByParent(subtasks: SubtaskItem[]): SubtaskGroup[] {
  const map = new Map<string, SubtaskGroup>()
  for (const task of subtasks) {
    const key = task.parentKey || "__no_parent__"
    if (!map.has(key)) {
      map.set(key, {
        parentKey: task.parentKey,
        parentTitle: task.parentTitle,
        parentType: task.parentType,
        subtasks: [],
        doneCount: 0,
      })
    }
    const group = map.get(key)!
    group.subtasks.push(task)
    if (DONE_STATUSES.includes(task.status)) group.doneCount++
  }
  return Array.from(map.values())
}

export function useMySubtasks(creds: JiraCredentials | null, projectKey: string | null) {
  const [groups, setGroups] = useState<SubtaskGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!creds || !projectKey) return
    setLoading(true)
    setError(null)
    try {
      const issues = await jiraApi.getMySubtasks(creds, projectKey)
      setGroups(groupByParent(issues.map(mapSubtask)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sub-tasks")
    } finally {
      setLoading(false)
    }
  }, [creds, projectKey])

  const moveSubtask = useCallback(
    async (key: string, targetStatus: IssueStatus) => {
      if (!creds) return

      // Optimistic update
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          subtasks: group.subtasks.map((t) =>
            t.key === key ? { ...t, status: targetStatus, statusName: statusToJiraName[targetStatus] } : t
          ),
          doneCount: group.subtasks.filter((t) => {
            const updated = t.key === key ? targetStatus : t.status
            return DONE_STATUSES.includes(updated)
          }).length,
        }))
      )

      try {
        const transitions = await jiraApi.getTransitions(creds, key)
        const targetName = statusToJiraName[targetStatus]
        const transition = transitions.find((t) => t.to.name.toUpperCase() === targetName)
        if (!transition) {
          console.warn(`No transition found for ${key} to ${targetStatus}`)
          await refresh()
          return
        }
        await jiraApi.doTransition(creds, key, transition.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update status")
        await refresh()
      }
    },
    [creds, refresh]
  )

  return { groups, loading, error, refresh, moveSubtask }
}
