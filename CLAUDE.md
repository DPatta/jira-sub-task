# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Use pnpm as the package manager for this project.**

- `pnpm dev` - Start development server (Next.js)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm install` - Install dependencies

## Architecture Overview

This is a Next.js 16 app (App Router) with TypeScript, Tailwind CSS, and Radix UI that renders a Jira-style kanban board connected to the real Jira Cloud REST API.

### Key Architecture Patterns

**State Management**: Jira Cloud as backend + React state
- `useJiraBoard` hook (`src/hooks/useJiraBoard.ts`) fetches issues via Jira API and manages board state
- `useJiraCredentials` hook (`src/hooks/useJiraCredentials.ts`) manages auth state from localStorage
- No external state management library — uses React useState/useEffect/useCallback

**UI Component System**: Built on Radix UI + Class Variance Authority (CVA)
- Base UI components in `src/components/ui/` use CVA for variant styling
- Components follow Radix UI patterns with forwarded refs and Slot composition
- `cn()` utility in `src/lib/utils.ts` merges Tailwind classes with twMerge

**Styling**: CSS custom properties + Tailwind CSS + inline style props
- Dark mode support via CSS class toggle (`darkMode: ["class"]` in tailwind.config.js)
- Jira color palette applied via inline `style` props — do not replace with Tailwind
- Component variants defined with CVA, not separate CSS files

**Data Flow**:
- `Todo` interface in `src/types/todo.ts` with id, issueKey, title, status, priority, type, createdAt, updatedAt
- `BoardTodo` extends `Todo` with Jira-specific fields (jiraId, commentCount, subtaskKeys, etc.)
- CRUD operations proxied through `/api/jira/[...path]` to Jira Cloud

### Component Structure

- `src/app/page.tsx` — Home page, renders auth flow (login → project select → board)
- `src/components/TodoList.tsx` — Main kanban board (uses `useJiraBoard`)
- `src/components/TodoItem.tsx` — Individual issue card with detail open, inline edit
- `src/components/AddTodo.tsx` — Create issue modal
- `src/components/IssueDetailModal.tsx` — Full issue detail: description, comments, transitions
- `src/components/JiraLoginModal.tsx` — Credential entry UI
- `src/components/ProjectSelectModal.tsx` — Project picker UI
- `src/components/ui/*` — Reusable UI primitives with CVA variants

### File Organization

- `src/app/page.tsx` - Home page (auth-gated board)
- `src/app/api/jira/[...path]/route.ts` - Jira API proxy
- `src/components/` - React components
- `src/components/ui/` - Base UI components (button, input, dialog, textarea)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility libraries (jira-api, jira-credentials, jira-adf, utils)
- `src/types/` - TypeScript interfaces (todo.ts, jira.ts)
- `.claude/agents/jira.md` - Jira integration sub-agent

---

## Jira Integration

### Authentication

- Jira credentials stored in localStorage key `"jira-credentials"`
- Shape: `{ siteUrl, email, token, accountId, projectKey?, projectName? }`
- Auth flow: `JiraLoginModal` → `getMyself()` → save creds → `ProjectSelectModal` → save project → board
- Credentials passed to every API call as `x-jira-site`, `x-jira-email`, `x-jira-token` headers

### Proxy

`src/app/api/jira/[...path]/route.ts` forwards all Jira REST API calls:
- Reads `x-jira-*` headers, returns 401 if missing
- Builds URL: `${siteUrl}/rest/api/3/${path}?${queryParams}`
- Adds `Authorization: Basic base64(email:token)`
- Handles 204 empty responses (Jira transitions return no body)
- Returns 502 on network errors

### Hooks

- `useJiraCredentials` (`src/hooks/useJiraCredentials.ts`): hydrates from localStorage, exposes `{ creds, isReady, save, clear }`
- `useJiraBoard` (`src/hooks/useJiraBoard.ts`): fetches issues, exposes `{ todos, loading, error, refresh, moveIssue, updateTitle }`

### Key Lib Files

- `src/lib/jira-api.ts` — `jiraApi` object with all API methods (getMyself, getProjects, getAssignedIssues, getIssue, getTransitions, doTransition, updateSummary, addComment, createIssue)
- `src/lib/jira-credentials.ts` — localStorage helpers (loadCredentials, saveCredentials, clearCredentials, normalizeSiteUrl)
- `src/lib/jira-adf.tsx` — `renderAdf(doc)` renders Atlassian Document Format to React nodes

### Status Mapping

Jira uses status categories, not fixed status names. The app maps:

| Jira `statusCategory.key` | App `IssueStatus` |
|---------------------------|-------------------|
| `new`                     | `"todo"`          |
| `indeterminate`           | `"inprogress"`    |
| `done`                    | `"done"`          |
| `undefined`               | `"todo"`          |

Helper: `categoryToStatus(key)` exported from `src/types/jira.ts`

### JQL for Board

```
assignee = currentUser() AND project = "{projectKey}" ORDER BY updated DESC
```

Fields: `summary,status,priority,issuetype,assignee,comment,subtasks,parent,updated,created`

### Next.js 16 Route Handler Pattern

In Next.js 16, params in route handlers are a Promise and must be awaited:

```typescript
type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { path } = await params
  // ...
}
```

When modifying components, follow the existing CVA pattern for variants and use the `cn()` utility for className merging. Always use inline `style` props for Jira brand colors.
