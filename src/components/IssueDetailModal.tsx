'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Bug, CheckSquare, BookOpen, Edit3, Check, MessageSquare, GitBranch, Loader2, ChevronDown } from 'lucide-react';
import { JiraCredentials, JiraIssueSummary, JiraTransition, JiraComment, categoryToStatus } from '@/types/jira';
import { IssueStatus } from '@/types/todo';
import { jiraApi } from '@/lib/jira-api';
import { renderAdf } from '@/lib/jira-adf';

interface IssueDetailModalProps {
  issueKey: string;
  cred: JiraCredentials | null;
  onClose: () => void;
  onStatusChange: (key: string, status: IssueStatus) => void;
  onTitleUpdate: (key: string, title: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new: { bg: '#F4F5F7', color: '#42526E' },
  indeterminate: { bg: '#DEEBFF', color: '#0052CC' },
  done: { bg: '#E3FCEF', color: '#00875A' },
  undefined: { bg: '#F4F5F7', color: '#42526E' },
};

function getTypeIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower === 'bug')
    return (
      <Bug
        className='h-4 w-4'
        style={{ color: '#DE350B' }}
      />
    );
  if (lower === 'story')
    return (
      <BookOpen
        className='h-4 w-4'
        style={{ color: '#00875A' }}
      />
    );
  return (
    <CheckSquare
      className='h-4 w-4'
      style={{ color: '#0052CC' }}
    />
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function UserAvatar({ avatarUrl, displayName, size = 32 }: { avatarUrl?: string; displayName?: string; size?: number }) {
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName ?? 'User'}
        width={size}
        height={size}
        className='rounded-full object-cover flex-shrink-0'
      />
    );
  }

  return (
    <div
      className='rounded-full flex items-center justify-center text-white font-bold flex-shrink-0'
      style={{
        width: size,
        height: size,
        background: '#0052CC',
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  );
}

function renderCommentBody(body: JiraComment['body'], issueUrl?: string) {
  if (typeof body === 'string') {
    return (
      <p
        className='text-sm'
        style={{ color: '#172B4D' }}
      >
        {body}
      </p>
    );
  }
  return renderAdf(body, issueUrl);
}

export function IssueDetailModal({ issueKey, cred, onClose, onStatusChange, onTitleUpdate }: IssueDetailModalProps) {
  const issueUrl = `${cred?.siteUrl}/browse/${issueKey}`;
  const [issue, setIssue] = useState<JiraIssueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  // Transition state
  const [transitions, setTransitions] = useState<JiraTransition[]>([]);
  const [showTransitions, setShowTransitions] = useState(false);
  const [loadingTransitions, setLoadingTransitions] = useState(false);
  const [applyingTransition, setApplyingTransition] = useState(false);
  const transitionRef = useRef<HTMLDivElement>(null);

  const fetchIssue = async () => {
    setError(null);
    try {
      const fetched = await jiraApi.getIssue(cred, issueKey);
      setIssue(fetched);
      setEditTitle(fetched.fields.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issue');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchIssue().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueKey]);

  // Close transition dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (transitionRef.current && !transitionRef.current.contains(e.target as Node)) {
        setShowTransitions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStatusClick = async () => {
    if (loadingTransitions || !issue) return;
    setLoadingTransitions(true);
    try {
      const t = await jiraApi.getTransitions(cred as JiraCredentials, issueKey);
      setTransitions(t);
      setShowTransitions(true);
    } catch (err) {
      console.error('Failed to load transitions', err);
    } finally {
      setLoadingTransitions(false);
    }
  };

  const handleTransition = async (transition: JiraTransition) => {
    setShowTransitions(false);
    setApplyingTransition(true);
    try {
      await jiraApi.doTransition(cred as JiraCredentials, issueKey, transition.id);
      const mappedStatus = categoryToStatus(transition.to.statusCategory.key);
      onStatusChange(issueKey, mappedStatus);
      await fetchIssue();
    } catch (err) {
      console.error('Failed to apply transition', err);
    } finally {
      setApplyingTransition(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim() || !issue) return;
    setSavingTitle(true);
    try {
      await jiraApi.updateSummary(cred as JiraCredentials, issueKey, editTitle.trim());
      onTitleUpdate(issueKey, editTitle.trim());
      await fetchIssue();
      setEditingTitle(false);
    } catch (err) {
      console.error('Failed to update title', err);
    } finally {
      setSavingTitle(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await jiraApi.addComment(cred as JiraCredentials, issueKey, commentText.trim());
      setCommentText('');
      await fetchIssue();
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const statusCategoryKey = issue?.fields.status.statusCategory.key ?? 'undefined';
  const statusColors = STATUS_COLORS[statusCategoryKey] ?? STATUS_COLORS.undefined;
  const comments = issue?.fields.comment?.comments ?? [];
  const subtasks = issue?.fields.subtasks ?? [];

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(9,30,66,0.54)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className='w-full rounded-lg shadow-2xl flex flex-col'
        style={{ background: 'white', maxWidth: '800px', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className='flex items-center gap-3 px-6 py-4 border-b flex-shrink-0'
          style={{ borderColor: '#DFE1E6' }}
        >
          {issue && (
            <>
              <span
                className='text-xs font-semibold px-2 py-1 rounded flex-shrink-0'
                style={{ background: '#F4F5F7', color: '#42526E' }}
              >
                {issue.key}
              </span>
              <span className='flex-shrink-0'>{getTypeIcon(issue.fields.issuetype.name)}</span>
            </>
          )}

          <div className='flex-1 min-w-0'>
            {editingTitle ? (
              <div className='flex items-center gap-2'>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setEditTitle(issue?.fields.summary ?? '');
                      setEditingTitle(false);
                    }
                  }}
                  className='flex-1 text-sm border rounded px-2 py-1 outline-none'
                  style={{
                    borderColor: '#0052CC',
                    color: '#172B4D',
                    boxShadow: '0 0 0 2px rgba(0,82,204,0.2)',
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={savingTitle}
                  className='flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-white'
                  style={{ background: '#0052CC' }}
                >
                  {savingTitle ? <Loader2 className='h-3 w-3 animate-spin' /> : <Check className='h-3 w-3' />}
                </button>
                <button
                  onClick={() => {
                    setEditTitle(issue?.fields.summary ?? '');
                    setEditingTitle(false);
                  }}
                  className='flex items-center gap-1 px-2 py-1 text-xs rounded border'
                  style={{ borderColor: '#DFE1E6', color: '#42526E' }}
                >
                  <X className='h-3 w-3' />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className='flex items-center gap-1.5 text-sm font-medium hover:underline text-left w-full group'
                style={{ color: '#172B4D' }}
              >
                <span className='truncate'>{issue?.fields.summary ?? 'Loading...'}</span>
                <Edit3
                  className='h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity'
                  style={{ color: '#6B778C' }}
                />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors flex-shrink-0'
            style={{ color: '#6B778C' }}
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className='flex items-center justify-center py-16'>
            <Loader2
              className='h-6 w-6 animate-spin'
              style={{ color: '#0052CC' }}
            />
          </div>
        ) : error ? (
          <div className='p-6'>
            <div
              className='px-3 py-2.5 rounded text-sm'
              style={{ background: '#FFEBE6', color: '#DE350B', border: '1px solid #FFBDAD' }}
            >
              {error}
            </div>
          </div>
        ) : issue ? (
          <div className='flex flex-1 overflow-hidden'>
            {/* Left: main content */}
            <div className='flex-1 overflow-y-auto px-6 py-5 space-y-6 min-w-0'>
              {/* Description */}
              <div>
                <h3
                  className='text-xs font-semibold mb-2'
                  style={{ color: '#6B778C' }}
                >
                  DESCRIPTION
                </h3>
                {issue.fields.description ? (
                  typeof issue.fields.description === 'string' ? (
                    <p
                      className='text-sm'
                      style={{ color: '#172B4D' }}
                    >
                      {issue.fields.description}
                    </p>
                  ) : (
                    renderAdf(issue.fields.description, issueUrl)
                  )
                ) : (
                  <p
                    className='text-sm'
                    style={{ color: '#6B778C' }}
                  >
                    No description provided.
                  </p>
                )}
              </div>

              {/* Subtasks */}
              {subtasks.length > 0 && (
                <div>
                  <h3
                    className='text-xs font-semibold mb-2 flex items-center gap-1.5'
                    style={{ color: '#6B778C' }}
                  >
                    <GitBranch className='h-3.5 w-3.5' />
                    CHILD ISSUES ({subtasks.length})
                  </h3>
                  <div className='space-y-1.5'>
                    {subtasks.map((sub) => {
                      const subCatKey = sub.fields.status.statusCategory.key;
                      const subColors = STATUS_COLORS[subCatKey] ?? STATUS_COLORS.undefined;
                      return (
                        <div
                          key={sub.id}
                          className='flex items-center gap-2 px-3 py-2 rounded border text-sm'
                          style={{ borderColor: '#DFE1E6', background: '#F4F5F7' }}
                        >
                          <span className='flex-shrink-0'>{getTypeIcon(sub.fields.issuetype.name)}</span>
                          <span
                            className='text-xs font-medium flex-shrink-0'
                            style={{ color: '#6B778C' }}
                          >
                            {sub.key}
                          </span>
                          <span
                            className='flex-1 truncate'
                            style={{ color: '#172B4D' }}
                          >
                            {sub.fields.summary}
                          </span>
                          <span
                            className='text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0'
                            style={{ background: subColors.bg, color: subColors.color }}
                          >
                            {sub.fields.status.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h3
                  className='text-xs font-semibold mb-3 flex items-center gap-1.5'
                  style={{ color: '#6B778C' }}
                >
                  <MessageSquare className='h-3.5 w-3.5' />
                  COMMENTS ({comments.length})
                </h3>

                <div className='space-y-4'>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className='flex gap-3'
                    >
                      <UserAvatar
                        avatarUrl={comment.author.avatarUrls['48x48']}
                        displayName={comment.author.displayName}
                        size={32}
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-baseline gap-2 mb-1'>
                          <span
                            className='text-xs font-semibold'
                            style={{ color: '#172B4D' }}
                          >
                            {comment.author.displayName}
                          </span>
                          <span
                            className='text-xs'
                            style={{ color: '#6B778C' }}
                          >
                            {formatDate(comment.created)}
                          </span>
                        </div>
                        <div
                          className='text-sm rounded p-2'
                          style={{ background: '#F4F5F7', color: '#172B4D' }}
                        >
                          {renderCommentBody(comment.body, issueUrl)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                <div className='mt-4'>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    placeholder='Add a comment...'
                    className='w-full px-3 py-2 rounded border text-sm outline-none resize-none transition-shadow focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    style={{ borderColor: '#DFE1E6', color: '#172B4D' }}
                  />
                  <div className='flex gap-2 mt-2'>
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || submittingComment}
                      className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      style={{ background: '#0052CC' }}
                    >
                      {submittingComment && <Loader2 className='h-3 w-3 animate-spin' />}
                      Save
                    </button>
                    <button
                      onClick={() => setCommentText('')}
                      className='px-3 py-1.5 text-xs font-medium rounded border hover:bg-gray-50 transition-colors'
                      style={{ borderColor: '#DFE1E6', color: '#42526E' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: details panel */}
            <div
              className='w-48 flex-shrink-0 border-l px-4 py-5 space-y-4 overflow-y-auto'
              style={{ borderColor: '#DFE1E6' }}
            >
              {/* Status */}
              <div>
                <p
                  className='text-xs font-semibold mb-1.5'
                  style={{ color: '#6B778C' }}
                >
                  STATUS
                </p>
                <div
                  className='relative'
                  ref={transitionRef}
                >
                  <button
                    onClick={handleStatusClick}
                    disabled={applyingTransition}
                    className='flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded w-full justify-between transition-colors hover:opacity-80'
                    style={{ background: statusColors.bg, color: statusColors.color }}
                  >
                    {applyingTransition ? <Loader2 className='h-3 w-3 animate-spin' /> : <span className='truncate'>{issue.fields.status.name}</span>}
                    {loadingTransitions ? <Loader2 className='h-3 w-3 animate-spin flex-shrink-0' /> : <ChevronDown className='h-3 w-3 flex-shrink-0' />}
                  </button>

                  {showTransitions && (
                    <div
                      className='absolute left-0 top-8 w-48 rounded shadow-lg border py-1 z-10'
                      style={{ background: 'white', borderColor: '#DFE1E6' }}
                    >
                      {transitions.map((t) => {
                        const tColors = STATUS_COLORS[t.to.statusCategory.key] ?? STATUS_COLORS.undefined;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleTransition(t)}
                            className='w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2'
                          >
                            <span
                              className='text-xs font-semibold px-1.5 py-0.5 rounded'
                              style={{ background: tColors.bg, color: tColors.color }}
                            >
                              {t.to.name}
                            </span>
                            <span style={{ color: '#6B778C' }}>{t.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              {issue.fields.priority && (
                <div>
                  <p
                    className='text-xs font-semibold mb-1.5'
                    style={{ color: '#6B778C' }}
                  >
                    PRIORITY
                  </p>
                  <div className='flex items-center gap-1.5'>
                    {issue.fields.priority.iconUrl && (
                      <Image
                        src={issue.fields.priority.iconUrl}
                        alt={issue.fields.priority.name}
                        width={16}
                        height={16}
                      />
                    )}
                    <span
                      className='text-xs'
                      style={{ color: '#172B4D' }}
                    >
                      {issue.fields.priority.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Assignee */}
              <div>
                <p
                  className='text-xs font-semibold mb-1.5'
                  style={{ color: '#6B778C' }}
                >
                  ASSIGNEE
                </p>
                {issue.fields.assignee ? (
                  <div className='flex items-center gap-1.5'>
                    <UserAvatar
                      avatarUrl={issue.fields.assignee.avatarUrls['24x24']}
                      displayName={issue.fields.assignee.displayName}
                      size={20}
                    />
                    <span
                      className='text-xs truncate'
                      style={{ color: '#172B4D' }}
                    >
                      {issue.fields.assignee.displayName}
                    </span>
                  </div>
                ) : (
                  <span
                    className='text-xs'
                    style={{ color: '#6B778C' }}
                  >
                    Unassigned
                  </span>
                )}
              </div>

              {/* Reporter */}
              {issue.fields.reporter && (
                <div>
                  <p
                    className='text-xs font-semibold mb-1.5'
                    style={{ color: '#6B778C' }}
                  >
                    REPORTER
                  </p>
                  <div className='flex items-center gap-1.5'>
                    <UserAvatar
                      avatarUrl={issue.fields.reporter.avatarUrls['24x24']}
                      displayName={issue.fields.reporter.displayName}
                      size={20}
                    />
                    <span
                      className='text-xs truncate'
                      style={{ color: '#172B4D' }}
                    >
                      {issue.fields.reporter.displayName}
                    </span>
                  </div>
                </div>
              )}

              {/* Parent */}
              {issue.fields.parent && (
                <div>
                  <p
                    className='text-xs font-semibold mb-1.5'
                    style={{ color: '#6B778C' }}
                  >
                    PARENT
                  </p>
                  <div className='flex items-center gap-1.5'>
                    <span
                      className='text-xs font-medium'
                      style={{ color: '#0052CC' }}
                    >
                      {issue.fields.parent.key}
                    </span>
                    <span
                      className='text-xs truncate'
                      style={{ color: '#172B4D' }}
                    >
                      {issue.fields.parent.fields.summary}
                    </span>
                  </div>
                </div>
              )}

              {/* Created */}
              <div>
                <p
                  className='text-xs font-semibold mb-1'
                  style={{ color: '#6B778C' }}
                >
                  CREATED
                </p>
                <p
                  className='text-xs'
                  style={{ color: '#172B4D' }}
                >
                  {formatDate(issue.fields.created)}
                </p>
              </div>

              {/* Updated */}
              <div>
                <p
                  className='text-xs font-semibold mb-1'
                  style={{ color: '#6B778C' }}
                >
                  UPDATED
                </p>
                <p
                  className='text-xs'
                  style={{ color: '#172B4D' }}
                >
                  {formatDate(issue.fields.updated)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
