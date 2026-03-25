import { JiraCredentials, JiraUser, JiraProject, JiraIssueSummary, JiraTransition, JiraComment } from '@/types/jira';
import { IssueType, Priority } from '@/types/todo';

function buildHeaders(cred: JiraCredentials): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-jira-site': cred.siteUrl,
    'x-jira-email': cred.email,
    'x-jira-token': cred.token,
  };
}

async function request<T>(cred: JiraCredentials | null, path: string, options: RequestInit = {}, queryParams?: Record<string, string>): Promise<T> {
  let url = `/api/jira/${path}`;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      ...buildHeaders(cred as JiraCredentials),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    let message = `Jira API error: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.errorMessages?.length) {
        message = body.errorMessages.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  // Handle empty responses (204 No Content)
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as unknown as T;
  }
}

/** Escape a string value for safe interpolation inside JQL double-quotes. */
function escapeJql(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function mapTypeToJira(type: IssueType): string {
  switch (type) {
    case 'bug':
      return 'Bug';
    case 'story':
      return 'Story';
    default:
      return 'Task';
  }
}

function mapPriorityToJira(priority: Priority): string {
  switch (priority) {
    case 'highest':
      return 'Highest';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    case 'lowest':
      return 'Lowest';
    default:
      return 'Medium';
  }
}

export const jiraApi = {
  async getMyself(cred: JiraCredentials): Promise<JiraUser> {
    return request<JiraUser>(cred, 'myself');
  },

  async getProjects(cred: JiraCredentials): Promise<JiraProject[]> {
    const res = await request<{ values: JiraProject[] }>(
      cred,
      'project/search',
      {},
      {
        maxResults: '100',
        orderBy: 'name',
      }
    );
    return res.values ?? [];
  },

  async getMySubtasks(cred: JiraCredentials, projectKey: string): Promise<JiraIssueSummary[]> {
    const jql = `assignee = currentUser() AND project = "${escapeJql(projectKey)}" AND issuetype in subTaskIssueTypes() ORDER BY updated DESC`;
    const res = await request<{ issues: JiraIssueSummary[] }>(
      cred,
      'search/jql',
      {},
      {
        jql,
        fields: 'summary,status,priority,issuetype,assignee,parent,description,created,updated',
        maxResults: '200',
      }
    );
    return res.issues ?? [];
  },

  async getAssignedIssues(cred: JiraCredentials, projectKey: string): Promise<JiraIssueSummary[]> {
    const jql = `assignee = currentUser() AND project = "${escapeJql(projectKey)}" AND sprint in openSprints() ORDER BY updated DESC`;
    const res = await request<{ issues: JiraIssueSummary[] }>(
      cred,
      'search/jql',
      {},
      {
        jql,
        fields: 'summary,status,priority,issuetype,assignee,comment,subtasks,parent,updated,created,customfield_10016',
        maxResults: '100',
      }
    );
    return res.issues ?? [];
  },

  async getIssue(cred: JiraCredentials | null, key: string): Promise<JiraIssueSummary> {
    return request<JiraIssueSummary>(
      cred,
      `issue/${key}`,
      {},
      {
        fields: 'summary,description,status,priority,issuetype,assignee,reporter,comment,subtasks,parent,updated,created',
      }
    );
  },

  async getTransitions(cred: JiraCredentials, key: string): Promise<JiraTransition[]> {
    const res = await request<{ transitions: JiraTransition[] }>(cred, `issue/${key}/transitions`);
    return res.transitions ?? [];
  },

  async doTransition(cred: JiraCredentials, key: string, transitionId: string): Promise<void> {
    await request<void>(cred, `issue/${key}/transitions`, {
      method: 'POST',
      body: JSON.stringify({ transition: { id: transitionId } }),
    });
  },

  async updateSummary(cred: JiraCredentials, key: string, summary: string): Promise<void> {
    await request<void>(cred, `issue/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ fields: { summary } }),
    });
  },

  async updateStoryPoints(cred: JiraCredentials, key: string, points: number | null): Promise<void> {
    await request<void>(cred, `issue/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ fields: { customfield_10016: points } }),
    });
  },

  async addComment(cred: JiraCredentials, key: string, text: string): Promise<JiraComment> {
    const body = {
      body: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text,
              },
            ],
          },
        ],
      },
    };
    return request<JiraComment>(cred, `issue/${key}/comment`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async createIssue(cred: JiraCredentials | null, projectKey: string, data: { title: string; description?: string; type: IssueType; priority: Priority }): Promise<{ id: string; key: string }> {
    const fields: Record<string, unknown> = {
      project: { key: projectKey },
      summary: data.title,
      issuetype: { name: mapTypeToJira(data.type) },
      priority: { name: mapPriorityToJira(data.priority) },
    };

    if (data.description) {
      fields.description = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: data.description }],
          },
        ],
      };
    }

    return request<{ id: string; key: string }>(cred, 'issue', {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
  },
};
