"use client"

import { useJiraCredentials } from "@/hooks/useJiraCredentials"
import { JiraLoginModal } from "@/components/JiraLoginModal"
import { ProjectSelectModal } from "@/components/ProjectSelectModal"
import { TodoList } from "@/components/TodoList"
import { JiraProject } from "@/types/jira"

export default function Home() {
  const { creds, isReady, save, clear } = useJiraCredentials()

  // 1. Not hydrated yet — show full-screen spinner
  if (!isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#F4F5F7" }}>
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#0052CC", borderTopColor: "transparent" }}
        />
      </div>
    )
  }

  // 2. No credentials — show login modal
  if (!creds) {
    return <JiraLoginModal onSave={save} />
  }

  // 3. Credentials but no project selected
  if (!creds.projectKey) {
    return (
      <ProjectSelectModal
        creds={creds}
        onSelect={(project: JiraProject) =>
          save({ ...creds, projectKey: project.key, projectName: project.name })
        }
        onLogout={clear}
      />
    )
  }

  // 4. Fully authenticated and project selected — show board
  return (
    <TodoList
      creds={creds}
      onChangeProject={() =>
        save({
          ...creds,
          projectKey: undefined as unknown as string,
          projectName: undefined as unknown as string,
        })
      }
      onLogout={clear}
    />
  )
}
