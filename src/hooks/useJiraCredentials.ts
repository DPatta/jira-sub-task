'use client';

import { useState } from 'react';
import { JiraCredentials } from '@/types/jira';
import { loadCredentials, saveCredentials, clearCredentials } from '@/lib/jira-credentials';

interface UseJiraCredentialsReturn {
  cred: JiraCredentials | null;
  isReady: boolean;
  save: (cred: JiraCredentials) => void;
  clear: () => void;
}

export function useJiraCredentials(): UseJiraCredentialsReturn {
  // Lazy initializer runs only on the client (window is defined), never on the server.
  // This replaces the useEffect + setState pattern while keeping SSR-safe behavior.
  const [cred, setcred] = useState<JiraCredentials | null>(() => (typeof window !== 'undefined' ? loadCredentials() : null));

  // isReady mirrors whether the client has hydrated (always true after first render on client)
  const [isReady] = useState(() => typeof window !== 'undefined');

  const save = (newcred: JiraCredentials) => {
    saveCredentials(newcred);
    setcred(newcred);
  };

  const clear = () => {
    clearCredentials();
    setcred(null);
    window.location.reload();
  };

  return { cred, isReady, save, clear };
}
