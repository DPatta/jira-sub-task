'use client';

import { useJiraCredentials } from '@/hooks/useJiraCredentials';
import { JiraLoginModal } from '@/components/JiraLoginModal';
import { ProjectSelectModal } from '@/components/ProjectSelectModal';
import { TodoList } from '@/components/TodoList';
import { JiraProject } from '@/types/jira';

export default function Home() {
  const { cred, save, clear } = useJiraCredentials();

  if (!cred) {
    return <JiraLoginModal onSave={save} />;
  }

  if (!cred.projectKey) {
    return (
      <ProjectSelectModal
        cred={cred}
        onSelect={(project: JiraProject) => save({ ...cred, projectKey: project.key, projectName: project.name })}
        onLogout={clear}
      />
    );
  }

  return (
    <TodoList
      cred={cred}
      onChangeProject={() =>
        save({
          ...cred,
          projectKey: undefined as unknown as string,
          projectName: undefined as unknown as string,
        })
      }
      onLogout={clear}
    />
  );
}
