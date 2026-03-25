'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Loader2, LogOut } from 'lucide-react';
import { JiraCredentials, JiraProject, JiraUser } from '@/types/jira';
import { jiraApi } from '@/lib/jira-api';

interface ProjectSelectModalProps {
  cred: JiraCredentials;
  onSelect: (project: JiraProject) => void;
  onLogout: () => void;
}

export function ProjectSelectModal({ cred, onSelect, onLogout }: ProjectSelectModalProps) {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [user, setUser] = useState<JiraUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [fetchedUser, fetchedProjects] = await Promise.all([jiraApi.getMyself(cred), jiraApi.getProjects(cred)]);
        setUser(fetchedUser);
        setProjects(fetchedProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [cred, mounted]);

  if (!mounted) return null;

  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.key.toLowerCase().includes(searchQuery.toLowerCase()));

  const userInitials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : cred.email[0]?.toUpperCase() ?? 'U';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,30,66,0.54)]'>
      <div className='w-full max-w-md rounded-lg shadow-2xl flex flex-col bg-white max-h-[80vh]'>
        <div className='flex items-center justify-between px-6 py-4 border-b flex-shrink-0 border-[#DFE1E6]'>
          <div className='flex items-center gap-3'>
            {user?.avatarUrls ? (
              <Image
                src={user.avatarUrls['48x48']}
                alt={user.displayName}
                width={36}
                height={36}
                className='rounded-full object-cover'
              />
            ) : (
              <div className='w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-[#FF5630]'>{userInitials}</div>
            )}
            <div>
              <p className='text-sm font-semibold text-[#172B4D]'>{user?.displayName ?? 'Loading...'}</p>
              <p className='text-xs text-[#6B778C]'>{cred.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border hover:bg-gray-50 transition-colors text-[#42526E] border-[#DFE1E6]'
          >
            <LogOut className='h-3.5 w-3.5' />
            Logout
          </button>
        </div>

        <div className='px-6 pt-5 pb-3 flex-shrink-0'>
          <h2 className='text-lg font-semibold mb-3 text-[#172B4D]'>Select Project</h2>

          <div className='flex items-center gap-2 h-9 px-3 rounded border border-[#DFE1E6]'>
            <Search className='h-3.5 w-3.5 flex-shrink-0 text-[#6B778C]' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search projects...'
              className='flex-1 text-sm outline-none bg-transparent text-[#172B4D]'
            />
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-4 pb-4'>
          {loading && (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-6 w-6 animate-spin text-[#0052CC]' />
            </div>
          )}

          {error && <div className='mx-2 px-3 py-2.5 rounded text-sm bg-[#FFEBE6] text-[#DE350B] border border-[#FFBDAD]'>{error}</div>}

          {!loading && !error && filteredProjects.length === 0 && <p className='text-sm text-center py-8 text-[#6B778C]'>{searchQuery ? 'No projects match your search' : 'No projects found'}</p>}

          {!loading &&
            !error &&
            filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelect(project)}
                className='cursor-pointer w-full flex items-center gap-3 px-3 py-3 rounded hover:bg-blue-50 transition-colors text-left mb-1'
              >
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate text-[#172B4D]'>{project.name}</p>
                </div>
                <span className='text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 bg-[#DEEBFF] text-[#0052CC]'>{project.key}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
