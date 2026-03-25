'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, Loader2, Send } from 'lucide-react';
import { JiraCredentials, JiraComment } from '@/types/jira';
import { IssueStatus, Priority } from '@/types/todo';
import { useMySubtasks, SubtaskItem, SubtaskGroup } from '@/hooks/useMySubtasks';
import { renderAdf } from '@/lib/jira-adf';
import { jiraApi } from '@/lib/jira-api';

const STATUS_COLORS: Record<IssueStatus, string> = {
  todo: '#42526E',
  devinprogress: '#0052CC',
  donedevelop: '#88dae7',
  qainprogress: '#6554C0',
  bug: '#FF5630',
  readytotest: '#FF991F',
  readytodeploy: '#00B8D9',
  onhold: '#97A0AF',
  done: '#00875A',
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  todo: 'TO DO',
  devinprogress: 'DEV IN PROGRESS',
  donedevelop: 'DONE DEVELOP',
  qainprogress: 'QA IN PROGRESS',
  bug: 'BUG',
  readytotest: 'READY TO TEST',
  readytodeploy: 'READY TO DEPLOY',
  onhold: 'ON HOLD',
  done: 'DONE',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  highest: '#FF5630',
  high: '#FF5630',
  medium: '#FF991F',
  low: '#97A0AF',
  lowest: '#97A0AF',
};

function PriorityTriangle({ priority }: { priority: Priority }) {
  return (
    <span
      style={{ color: PRIORITY_COLORS[priority], fontSize: '10px', lineHeight: 1 }}
      title={priority}
    >
      ▲
    </span>
  );
}

function StatusDot({ status }: { status: IssueStatus }) {
  return (
    <span
      className='inline-block w-2 h-2 rounded-full flex-shrink-0'
      style={{ background: STATUS_COLORS[status] }}
    />
  );
}

function StatusBadge({ status }: { status: IssueStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <span
      className='text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap'
      style={{ background: `${color}20`, color }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ParentTypeBadge({ type }: { type: string }) {
  const isEpic = type.toLowerCase() === 'epic';
  return (
    <span
      className='text-xs px-1.5 py-0.5 rounded font-medium'
      style={{
        background: isEpic ? '#EAE6FF' : '#DEEBFF',
        color: isEpic ? '#6554C0' : '#0052CC',
      }}
    >
      {type}
    </span>
  );
}

function GroupRow({ group, isOpen, onToggle, selectedKey, onSelect }: { group: SubtaskGroup; isOpen: boolean; onToggle: () => void; selectedKey: string | null; onSelect: (task: SubtaskItem) => void }) {
  return (
    <div
      className='border-b'
      style={{ borderColor: '#DFE1E6' }}
    >
      <button
        onClick={onToggle}
        className='w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-200 transition-colors text-left'
        style={{ background: isOpen ? '#EBECF0' : 'transparent' }}
      >
        <ChevronRight
          className='h-3.5 w-3.5 flex-shrink-0 transition-transform duration-150'
          style={{
            color: '#6B778C',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1.5 flex-wrap'>
            <span
              className='text-xs font-semibold'
              style={{ color: '#0052CC' }}
            >
              {group.parentKey}
            </span>
            <ParentTypeBadge type={group.parentType} />
          </div>
          <p
            className='text-xs truncate mt-0.5'
            style={{ color: '#172B4D' }}
          >
            {group.parentTitle || '(No parent)'}
          </p>
        </div>
        <span
          className='text-xs flex-shrink-0 font-medium tabular-nums'
          style={{ color: '#6B778C' }}
        >
          {group.doneCount}/{group.subtasks.length}
        </span>
      </button>

      {isOpen && (
        <div className='pb-1'>
          {group.subtasks.map((task) => {
            const isActive = selectedKey === task.key;
            return (
              <button
                key={task.key}
                onClick={() => onSelect(task)}
                className='w-full flex items-center gap-2 py-1.5 pr-2 text-left hover:bg-blue-50 transition-colors'
                style={{
                  background: isActive ? '#DEEBFF' : 'transparent',
                  borderLeft: isActive ? '3px solid #0052CC' : '3px solid transparent',
                  paddingLeft: 'calc(1.75rem + 2px)',
                }}
              >
                <StatusDot status={task.status} />
                <span
                  className='flex-1 text-xs truncate min-w-0'
                  style={{ color: '#172B4D' }}
                >
                  {task.title}
                </span>
                <span
                  className='text-xs flex-shrink-0 mr-1.5'
                  style={{ color: '#6B778C' }}
                >
                  {task.key}
                </span>
                <StatusBadge status={task.status} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ALL_STATUSES: IssueStatus[] = ['todo', 'devinprogress', 'donedevelop', 'qainprogress', 'bug', 'readytotest', 'readytodeploy', 'onhold', 'done'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function DetailPanel({ task, cred, onStatusChange }: { task: SubtaskItem | null; cred: JiraCredentials | null; onStatusChange: (key: string, status: IssueStatus) => void }) {
  const [comments, setComments] = useState<JiraComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!task) return;
    setComments([]);
    setLoadingComments(true);
    jiraApi
      .getIssue(cred, task.key)
      .then((issue) => setComments(issue.fields.comment?.comments ?? []))
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [task?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitComment = async () => {
    if (!task || !commentText.trim() || !cred) return;
    setSubmitting(true);
    try {
      const newComment = await jiraApi.addComment(cred, task.key, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  if (!task || !cred) return null;

  const issueUrl = `${cred.siteUrl}/browse/${task.key}`;

  return (
    <div
      className='flex-1 overflow-y-auto p-6'
      style={{ background: 'white' }}
    >
      {/* Badge + key */}
      <div className='flex items-center gap-2 mb-3'>
        <span
          className='text-xs px-2 py-0.5 rounded font-medium'
          style={{ background: '#EAE6FF', color: '#6554C0' }}
        >
          Sub-task
        </span>
        <span
          className='text-xs font-semibold'
          style={{ color: '#0052CC' }}
        >
          {task.key}
        </span>
      </div>

      {/* Title */}
      <h2
        className='text-lg font-semibold mb-4 leading-snug'
        style={{ color: '#172B4D' }}
      >
        {task.title}
      </h2>

      {/* Parent issue block */}
      {task.parentKey && (
        <div
          className='mb-5 p-3 rounded border'
          style={{ borderColor: '#DFE1E6', background: '#F4F5F7' }}
        >
          <p
            className='text-xs mb-1.5'
            style={{ color: '#6B778C' }}
          >
            Parent issue
          </p>
          <div className='flex items-center gap-2 mb-1'>
            <span
              className='text-sm font-semibold'
              style={{ color: '#0052CC' }}
            >
              {task.parentKey}
            </span>
            <ParentTypeBadge type={task.parentType} />
          </div>
          <p
            className='text-sm'
            style={{ color: '#172B4D' }}
          >
            {task.parentTitle}
          </p>
        </div>
      )}

      {/* Metadata grid */}
      <div className='grid grid-cols-2 gap-x-4 gap-y-3 mb-5'>
        {[
          {
            label: 'Status',
            value: (
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task.key, e.target.value as IssueStatus)}
                className='text-xs px-1.5 py-0.5 rounded font-medium border-0 cursor-pointer outline-none'
                style={{
                  background: `${STATUS_COLORS[task.status]}20`,
                  color: STATUS_COLORS[task.status],
                }}
              >
                {ALL_STATUSES.map((s) => (
                  <option
                    key={s}
                    value={s}
                  >
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            ),
          },
          {
            label: 'Priority',
            value: (
              <div className='flex items-center gap-1.5'>
                <PriorityTriangle priority={task.priority} />
                <span
                  className='text-sm capitalize'
                  style={{ color: '#172B4D' }}
                >
                  {task.priority}
                </span>
              </div>
            ),
          },
          {
            label: 'Assignee',
            value: (
              <span
                className='text-sm'
                style={{ color: '#172B4D' }}
              >
                {task.assigneeDisplayName ?? 'Unassigned'}
              </span>
            ),
          },
          {
            label: 'Updated',
            value: (
              <span
                className='text-sm'
                style={{ color: '#172B4D' }}
              >
                {new Date(task.updatedAt).toLocaleDateString()}
              </span>
            ),
          },
        ].map(({ label, value }) => (
          <div key={label}>
            <p
              className='text-xs mb-1'
              style={{ color: '#6B778C' }}
            >
              {label}
            </p>
            {value}
          </div>
        ))}
      </div>

      {/* Description */}
      <div>
        <p
          className='text-xs mb-2'
          style={{ color: '#6B778C' }}
        >
          Description
        </p>
        {task.description ? (
          <div
            className='text-sm prose-sm'
            style={{ color: '#172B4D' }}
          >
            {typeof task.description === 'string' ? task.description : renderAdf(task.description, issueUrl)}
          </div>
        ) : (
          <p
            className='text-sm'
            style={{ color: '#97A0AF' }}
          >
            No description
          </p>
        )}
      </div>

      {/* Comments */}
      <div
        className='mt-6 pt-5 border-t'
        style={{ borderColor: '#DFE1E6' }}
      >
        <p
          className='text-xs font-semibold mb-3 uppercase tracking-wide'
          style={{ color: '#6B778C' }}
        >
          Comments {comments.length > 0 && `(${comments.length})`}
        </p>

        {loadingComments && (
          <div className='flex items-center gap-2 py-2'>
            <Loader2
              className='h-3.5 w-3.5 animate-spin'
              style={{ color: '#6B778C' }}
            />
            <span
              className='text-xs'
              style={{ color: '#6B778C' }}
            >
              Loading comments...
            </span>
          </div>
        )}

        <div className='space-y-4 mb-4'>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className='flex gap-3'
            >
              <div
                className='w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0'
                style={{ background: '#0052CC', color: 'white' }}
              >
                {comment.author.displayName[0].toUpperCase()}
              </div>
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
                    style={{ color: '#97A0AF' }}
                  >
                    {formatDate(comment.created)}
                  </span>
                </div>
                <div
                  className='rounded p-2.5 text-sm'
                  style={{ background: '#F4F5F7', color: '#172B4D' }}
                >
                  {typeof comment.body === 'string' ? <p>{comment.body}</p> : renderAdf(comment.body, issueUrl)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add comment */}
        <div className='flex gap-2 items-end'>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment();
            }}
            placeholder='Add a comment... (⌘+Enter to send)'
            rows={2}
            className='flex-1 text-sm rounded border px-3 py-2 resize-none outline-none focus:ring-1'
            style={{
              borderColor: '#DFE1E6',
              color: '#172B4D',
              background: 'white',
            }}
          />
          <button
            onClick={submitComment}
            disabled={!commentText.trim() || submitting}
            className='flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-colors disabled:opacity-40'
            style={{ background: '#0052CC', color: 'white' }}
          >
            {submitting ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Send className='h-3.5 w-3.5' />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SubTasksSidePanelProps {
  cred: JiraCredentials | null;
}

export function SubTasksSidePanel({ cred }: SubTasksSidePanelProps) {
  const { groups, loading, error, refresh, moveSubtask } = useMySubtasks(cred, cred?.projectKey ?? null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<SubtaskItem | null>(null);
  const [panelWidth, setPanelWidth] = useState(260);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = panelWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [panelWidth]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      setPanelWidth(Math.min(480, Math.max(180, startWidth.current + delta)));
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-expand all groups when data loads
  useEffect(() => {
    if (groups.length > 0) {
      setOpenGroups(new Set(groups.map((g) => g.parentKey)));
    }
  }, [groups]);

  const handleStatusChange = (key: string, status: IssueStatus) => {
    moveSubtask(key, status);
    if (selectedTask?.key === key) {
      setSelectedTask((prev) => (prev ? { ...prev, status, statusName: STATUS_LABELS[status] } : null));
    }
  };

  const toggleGroup = (parentKey: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(parentKey)) next.delete(parentKey);
      else next.add(parentKey);
      return next;
    });
  };

  return (
    <div className='flex flex-1 overflow-hidden'>
      {/* Left panel — resizable */}
      <div
        className='flex-shrink-0 flex flex-col overflow-y-auto'
        style={{ width: selectedTask ? panelWidth : '100%', background: '#F4F5F7' }}
      >
        <div
          className='px-3 py-2.5 border-b flex items-center justify-between flex-shrink-0'
          style={{ borderColor: '#DFE1E6' }}
        >
          <span
            className='text-sm font-semibold'
            style={{ color: '#172B4D' }}
          >
            My Sub-tasks
          </span>
          {loading && (
            <Loader2
              className='h-3.5 w-3.5 animate-spin'
              style={{ color: '#6B778C' }}
            />
          )}
        </div>

        {error && (
          <p
            className='px-3 py-2 text-xs'
            style={{ color: '#FF5630' }}
          >
            {error}
          </p>
        )}

        {!loading && groups.length === 0 && !error && (
          <p
            className='px-3 py-6 text-xs text-center'
            style={{ color: '#97A0AF' }}
          >
            No sub-tasks in current sprint
          </p>
        )}

        <div className='flex-1'>
          {groups.map((group) => (
            <GroupRow
              key={group.parentKey}
              group={group}
              isOpen={openGroups.has(group.parentKey)}
              onToggle={() => toggleGroup(group.parentKey)}
              selectedKey={selectedTask?.key ?? null}
              onSelect={setSelectedTask}
            />
          ))}
        </div>
      </div>

      {/* Drag handle + Right panel — only when task selected */}
      {selectedTask && (
        <>
          <div
            onMouseDown={onMouseDown}
            className='flex-shrink-0 w-1 hover:w-1.5 transition-all cursor-col-resize relative'
            style={{ background: '#DFE1E6' }}
          >
            <div
              className='absolute inset-y-0 -left-1 -right-1'
              style={{ cursor: 'col-resize' }}
            />
          </div>
          <DetailPanel
            task={selectedTask}
            cred={cred}
            onStatusChange={handleStatusChange}
          />
        </>
      )}
    </div>
  );
}
