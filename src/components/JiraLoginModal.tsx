'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { JiraCredentials } from '@/types/jira';
import { jiraApi } from '@/lib/jira-api';
import { normalizeSiteUrl } from '@/lib/jira-credentials';

interface JiraLoginModalProps {
  onSave: (cred: JiraCredentials) => void;
}

export function JiraLoginModal({ onSave }: JiraLoginModalProps) {
  const [mounted, setMounted] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    siteUrl?: string;
    email?: string;
    token?: string;
  }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!siteUrl.trim()) errors.siteUrl = 'Site URL is required';
    if (!email.trim()) errors.email = 'Email is required';
    if (!token.trim()) errors.token = 'API Token is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    const normalizedUrl = normalizeSiteUrl(siteUrl + '.atlassian.net');
    console.log('🚀 ~ handleSubmit ~ normalizedUrl:', normalizedUrl);
    setLoading(true);

    try {
      const tempcred: JiraCredentials = {
        siteUrl: normalizedUrl,
        email: email.trim(),
        token: token.trim(),
        accountId: '',
      };

      const user = await jiraApi.getMyself(tempcred);

      onSave({
        siteUrl: normalizedUrl,
        email: email.trim(),
        token: token.trim(),
        accountId: user.accountId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Jira. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,30,66,0.54)]'>
      <div className='w-full max-w-md rounded-lg shadow-2xl p-8 bg-white'>
        <div className='flex flex-col items-center mb-6'>
          <div className='w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 bg-[#0052CC]'>J</div>
          <h1 className='text-xl font-semibold text-[#172B4D]'>Connect to Jira</h1>
          <p className='text-sm mt-1 text-[#6B778C]'>Enter your Jira Cloud credentials to get started</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className='space-y-4'
        >
          <div>
            <label className='block text-xs font-semibold mb-1.5 text-[#6B778C]'>JIRA SITE URL</label>
            <div className='inline-flex items-baseline gap-x-1'>
              https://
              <input
                type='text'
                value={siteUrl}
                onChange={(e) => {
                  setSiteUrl(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, siteUrl: undefined }));
                }}
                placeholder='company'
                className={`w-full h-8 px-1 line-clamp-1 focus:outline-none rounded border text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#0052CC]/20 ${fieldErrors.siteUrl ? 'border-[#DE350B]' : 'border-[#DFE1E6]'} text-[#172B4D]`}
              />
              .atlassian.net
            </div>
            {fieldErrors.siteUrl && <p className='text-xs mt-1 text-[#DE350B]'>{fieldErrors.siteUrl}</p>}
          </div>
          <div>
            <label className='block text-xs font-semibold mb-1.5 text-[#6B778C]'>EMAIL</label>
            <input
              type='email'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder='you@company.com'
              className={`w-full h-10 px-3 rounded border text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#0052CC]/20 ${fieldErrors.email ? 'border-[#DE350B]' : 'border-[#DFE1E6]'} text-[#172B4D]`}
            />
            {fieldErrors.email && <p className='text-xs mt-1 text-[#DE350B]'>{fieldErrors.email}</p>}
          </div>

          <div>
            <label className='block text-xs font-semibold mb-1.5 text-[#6B778C]'>API TOKEN</label>
            <div className='relative'>
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, token: undefined }));
                }}
                placeholder='Your Jira API token'
                className={`w-full h-10 px-3 pr-10 rounded border text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#0052CC]/20 ${fieldErrors.token ? 'border-[#DE350B]' : 'border-[#DFE1E6]'} text-[#172B4D]`}
              />
              <button
                type='button'
                onClick={() => setShowToken((v) => !v)}
                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]'
              >
                {showToken ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </button>
            </div>
            {fieldErrors.token && <p className='text-xs mt-1 text-[#DE350B]'>{fieldErrors.token}</p>}
            <p className='text-xs mt-1.5 text-[#6B778C]'>
              Get your API token at <span className='font-medium text-[#0052CC]'>id.atlassian.com/manage-profile/security/api-tokens</span>
            </p>
          </div>

          {error && <div className='px-3 py-2.5 rounded text-sm bg-[#FFEBE6] text-[#DE350B] border border-[#FFBDAD]'>{error}</div>}

          <button
            type='submit'
            disabled={loading}
            className='w-full h-10 text-sm font-semibold rounded text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2 bg-[#0052CC]'
          >
            {loading && <Loader2 className='h-4 w-4 animate-spin' />}
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
}
