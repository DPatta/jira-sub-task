import { JiraCredentials } from '@/types/jira';

const STORAGE_KEY = 'jira-credentials';

export function loadCredentials(): JiraCredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JiraCredentials;
  } catch {
    return null;
  }
}

export function saveCredentials(cred: JiraCredentials): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cred));
}

export function clearCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function normalizeSiteUrl(input: string): string {
  let url = input.trim();
  if (!url) return url;

  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Strip trailing slash
  url = url.replace(/\/$/, '');

  // Append .atlassian.net if no dot in the hostname part (after protocol)
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.')) {
      url = `${parsed.protocol}//${parsed.hostname}.atlassian.net${parsed.pathname !== '/' ? parsed.pathname : ''}`;
      url = url.replace(/\/$/, '');
    }
  } catch {
    // If URL parsing fails, just return as-is
  }

  return url;
}
