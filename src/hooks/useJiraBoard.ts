'use client';

import { useState, useCallback } from 'react';
import { Todo, IssueStatus } from '@/types/todo';
import { JiraCredentials, JiraIssueSummary, categoryToStatus, statusToJiraName, mapPriority, mapIssueType } from '@/types/jira';
import { jiraApi } from '@/lib/jira-api';

export interface BoardTodo extends Todo {
  jiraId: string;
  assigneeDisplayName?: string;
  assigneeAvatarUrl?: string;
  commentCount: number;
  storyPoints?: number | null;
  subtaskKeys?: Array<{ key: string; title: string; status: IssueStatus }>;
  parentKey?: string;
  parentTitle?: string;
}

export function mapToTodo(issue: JiraIssueSummary): BoardTodo {
  const status = categoryToStatus(issue.fields.status.name);
  const priority = mapPriority(issue.fields.priority?.name);
  const type = mapIssueType(issue.fields.issuetype?.name);

  const subtaskKeys = (issue.fields.subtasks ?? []).map((sub) => ({
    key: sub.key,
    title: sub.fields.summary,
    status: categoryToStatus(sub.fields.status.name),
  }));

  return {
    id: issue.id,
    jiraId: issue.id,
    issueKey: issue.key,
    title: issue.fields.summary,
    status,
    priority,
    type,
    createdAt: new Date(issue.fields.created),
    updatedAt: new Date(issue.fields.updated),
    assigneeDisplayName: issue.fields.assignee?.displayName,
    assigneeAvatarUrl: issue.fields.assignee?.avatarUrls['24x24'],
    commentCount: issue.fields.comment?.total ?? 0,
    storyPoints: issue.fields.customfield_10016 ?? null,
    subtaskKeys: subtaskKeys.length > 0 ? subtaskKeys : undefined,
    parentKey: issue.fields.parent?.key,
    parentTitle: issue.fields.parent?.fields.summary,
  };
}

interface UseJiraBoardReturn {
  todos: BoardTodo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  moveIssue: (key: string, targetStatus: IssueStatus) => Promise<void>;
  updateTitle: (key: string, title: string) => Promise<void>;
  updateStoryPoints: (key: string, points: number | null) => Promise<void>;
}

export function useJiraBoard(cred: JiraCredentials | null, projectKey: string | null): UseJiraBoardReturn {
  const [todos, setTodos] = useState<BoardTodo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cred || !projectKey) return;
    setLoading(true);
    setError(null);
    try {
      const issues = await jiraApi.getAssignedIssues(cred, projectKey);
      setTodos(issues.map(mapToTodo));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [cred, projectKey]);

  const moveIssue = useCallback(
    async (key: string, targetStatus: IssueStatus) => {
      if (!cred) return;

      // Optimistic update
      setTodos((prev) => prev.map((t) => (t.issueKey === key ? { ...t, status: targetStatus, updatedAt: new Date() } : t)));

      try {
        const transitions = await jiraApi.getTransitions(cred, key);
        const targetName = statusToJiraName[targetStatus];
        const transition = transitions.find((t) => t.to.name.toUpperCase() === targetName);

        if (!transition) {
          console.warn(`No transition found for ${key} to ${targetStatus} (name: ${targetName})`);
          return;
        }

        await jiraApi.doTransition(cred, key, transition.id);
      } catch (err) {
        // Revert optimistic update on error
        setError(err instanceof Error ? err.message : 'Failed to move issue');
        await refresh();
      }
    },
    [cred, refresh]
  );

  const updateTitle = useCallback(
    async (key: string, title: string) => {
      if (!cred) return;

      // Optimistic update
      setTodos((prev) => prev.map((t) => (t.issueKey === key ? { ...t, title, updatedAt: new Date() } : t)));

      try {
        await jiraApi.updateSummary(cred, key, title);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update title');
        await refresh();
      }
    },
    [cred, refresh]
  );

  const updateStoryPoints = useCallback(
    async (key: string, points: number | null) => {
      if (!cred) return;

      setTodos((prev) => prev.map((t) => (t.issueKey === key ? { ...t, storyPoints: points, updatedAt: new Date() } : t)));

      try {
        await jiraApi.updateStoryPoints(cred, key, points);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update story points');
        await refresh();
      }
    },
    [cred, refresh]
  );

  return { todos, loading, error, refresh, moveIssue, updateTitle, updateStoryPoints };
}
