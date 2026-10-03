'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ArrowLeft, Plus, RefreshCw, UserPlus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { OriginButton } from '@/components/ui/origin-button';
import BoardColumnContainer from '@/components/BoardColumnContainer';
import TaskSideDrawer from '@/components/TaskSideDrawer';
import Spinner from '@/components/Spinner';
import Modal from '@/components/Modal';
import { getErrorMessage } from '@/lib/apiClient';
import { useUserPreferences } from '@/context/UserPreferencesContext';
import { getMembers } from '@/services/organizationService';
import {
  addProjectMember,
  getProjectById,
  getProjectMembers,
  recordProjectPresence,
} from '@/services/projectService';
import { createColumn, getColumns } from '@/services/boardService';
import {
  createTask,
  getTasksByProjectId,
  moveTask,
} from '@/services/taskService';
import type { BoardColumn, OrgRole, OrganizationMember, Project, ProjectMember, TaskItem, TaskPriority } from '@/types';

const PROJECT_ROLES: OrgRole[] = ['Admin', 'Manager', 'Developer', 'Viewer'];

export default function ProjectBoardPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { preferences } = useUserPreferences();

  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardNotice, setBoardNotice] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [activeColumnForTask, setActiveColumnForTask] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(preferences.defaultTaskPriority);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [creatingColumn, setCreatingColumn] = useState(false);
  const dragStartColumns = useRef<BoardColumn[] | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<OrganizationMember[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [projectMemberRole, setProjectMemberRole] = useState<OrgRole>('Developer');
  const [addingProjectMember, setAddingProjectMember] = useState(false);
  const [projectMemberError, setProjectMemberError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBoardNotice(null);
    try {
      try {
        const p = await getProjectById(projectId);
        setProject(p);
      } catch {
        setProject(null); // GET /projects/{id} may not exist; board still works.
      }

      const cols = await getColumns(projectId);

      let tasks: TaskItem[] = [];
      try {
        tasks = await getTasksByProjectId(projectId);
      } catch {
        setBoardNotice((prev) =>
          prev ? `${prev} Task list endpoint unavailable - showing empty board.` : 'Task list endpoint unavailable.'
        );
      }

      setColumns(
        cols
          .sort((a, b) => a.order - b.order)
          .map((col) => ({
            ...col,
            tasks: tasks
              .filter((t) => t.boardColumnId === col.id || t.columnId === col.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
          }))
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load board.'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const loadProjectMembers = useCallback(async () => {
    setProjectMembers(await getProjectMembers(projectId));
  }, [projectId]);

  useEffect(() => {
    let active = true;
    const refreshPresence = async () => {
      try {
        const members = await getProjectMembers(projectId);
        if (active) setProjectMembers(members);
        await recordProjectPresence(projectId);
        const updatedMembers = await getProjectMembers(projectId);
        if (active) setProjectMembers(updatedMembers);
      } catch {
        // The roster stays usable if presence polling briefly fails.
      }
    };
    void refreshPresence();
    const interval = window.setInterval(() => void refreshPresence(), 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [projectId]);

  const handleDragStart = () => {
    dragStartColumns.current = columns.map((column) => ({ ...column, tasks: [...column.tasks] }));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const initialColumns = dragStartColumns.current;
    dragStartColumns.current = null;
    if (!initialColumns) return;
    if (!over) {
      setColumns(initialColumns);
      return;
    }

    const taskId = String(active.id);
    const overId = String(over.id);
    const sourceColumn = initialColumns.find((column) => column.tasks.some((task) => task.id === taskId));
    const targetColumn = initialColumns.find((column) => column.id === overId)
      ?? initialColumns.find((column) => column.tasks.some((task) => task.id === overId));
    const task = sourceColumn?.tasks.find((item) => item.id === taskId);
    if (!sourceColumn || !targetColumn || !task) {
      setColumns(initialColumns);
      return;
    }

    const overIndex = targetColumn.tasks.findIndex((item) => item.id === overId);
    let newOrder = overIndex < 0 ? targetColumn.tasks.length - (sourceColumn.id === targetColumn.id ? 1 : 0) : overIndex;
    let nextColumns = initialColumns.map((column) => ({ ...column, tasks: [...column.tasks] }));

    if (sourceColumn.id === targetColumn.id) {
      const taskIndex = sourceColumn.tasks.findIndex((item) => item.id === taskId);
      newOrder = Math.max(0, Math.min(newOrder, sourceColumn.tasks.length - 1));
      if (taskIndex === newOrder) return;
      nextColumns = nextColumns.map((column) => column.id === sourceColumn.id
        ? { ...column, tasks: arrayMove(column.tasks, taskIndex, newOrder) }
        : column);
    } else {
      const targetTasks = nextColumns.find((column) => column.id === targetColumn.id)!.tasks;
      const sourceTasks = nextColumns.find((column) => column.id === sourceColumn.id)!.tasks;
      sourceTasks.splice(sourceTasks.findIndex((item) => item.id === taskId), 1);
      const movedTask = { ...task, boardColumnId: targetColumn.id, columnId: targetColumn.id };
      newOrder = Math.max(0, Math.min(newOrder, targetTasks.length));
      targetTasks.splice(newOrder, 0, movedTask);
    }

    nextColumns = nextColumns.map((column) => ({
      ...column,
      tasks: column.tasks.map((item, index) => ({ ...item, order: index })),
    }));
    setColumns(nextColumns);

    try {
      await moveTask(taskId, targetColumn.id, newOrder);
    } catch (err) {
      // Roll back the optimistic move so UI and server stay consistent.
      console.error('Failed to persist task move:', err);
      await fetchBoard();
      setBoardNotice(getErrorMessage(err, 'Move could not be saved - board refreshed.'));
    }
  };

  const openAddTask = (columnId: string) => {
    setActiveColumnForTask(columnId);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority(preferences.defaultTaskPriority);
    setTaskError(null);
    setIsAddTaskOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      setTaskError('Title is required.');
      return;
    }
    if (!activeColumnForTask) return;
    setCreatingTask(true);
    setTaskError(null);
    try {
      const target = columns.find((c) => c.id === activeColumnForTask);
      await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        projectId,
        boardColumnId: activeColumnForTask,
        priority: newTaskPriority,
        order: target ? target.tasks.length : 0,
      });
      setIsAddTaskOpen(false);
      await fetchBoard();
    } catch (err) {
      setTaskError(getErrorMessage(err, 'Failed to create task.'));
    } finally {
      setCreatingTask(false);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    setCreatingColumn(true);
    setBoardNotice(null);
    try {
      const col = await createColumn(projectId, newColumnName.trim(), columns.length);
      setColumns((prev) => [...prev, { ...col, tasks: [] }]);
      setIsAddColumnOpen(false);
      setNewColumnName('');
    } catch (err) {
      setBoardNotice(getErrorMessage(err, 'Failed to add column.'));
    } finally {
      setCreatingColumn(false);
    }
  };

  const openAddProjectMember = async () => {
    setIsAddMemberOpen(true);
    setProjectMemberError(null);
    setSelectedMemberId('');
    try {
      const members = await getMembers();
      setWorkspaceMembers(members.filter(
        member => !projectMembers.some(projectMember => projectMember.userId === member.userId)
      ));
    } catch (err) {
      setProjectMemberError(getErrorMessage(err, 'Unable to load workspace members.'));
    }
  };

  const handleAddProjectMember = async () => {
    if (!selectedMemberId) {
      setProjectMemberError('Choose a workspace member first.');
      return;
    }
    setAddingProjectMember(true);
    setProjectMemberError(null);
    try {
      await addProjectMember(projectId, selectedMemberId, projectMemberRole);
      await loadProjectMembers();
      setIsAddMemberOpen(false);
      setBoardNotice('Project member added. They will see this project the next time their project list refreshes.');
    } catch (err) {
      setProjectMemberError(getErrorMessage(err, 'Unable to add project member.'));
    } finally {
      setAddingProjectMember(false);
    }
  };

  const totalTasks = useMemo(() => columns.reduce((sum, c) => sum + c.tasks.length, 0), [columns]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/projects"
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {project?.name ?? 'Project board'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {project?.description || `${totalTasks} task${totalTasks === 1 ? '' : 's'} on this board`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Project members">
              {projectMembers.map((member) => (
                <span key={member.userId} title={`${member.fullName} · ${member.role}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {member.fullName || member.email}
                </span>
              ))}
              {projectMembers.length === 0 && <span className="text-xs text-slate-400">No project members yet</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OriginButton
              onClick={fetchBoard}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </OriginButton>
            <OriginButton
              onClick={() => setIsAddColumnOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Add column
            </OriginButton>
            <OriginButton
              onClick={openAddProjectMember}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserPlus className="h-4 w-4" /> Add member
            </OriginButton>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {boardNotice && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {boardNotice}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-10 w-10" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="hide-scrollbar flex items-start gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <BoardColumnContainer
                key={column.id}
                column={column}
                compact={preferences.boardDensity === 'compact'}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setIsDrawerOpen(true);
                }}
                onAddTask={openAddTask}
              />
            ))}
            <OriginButton
              onClick={() => setIsAddColumnOpen(true)}
              className="flex h-24 w-72 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
            >
              <Plus className="h-4 w-4" /> Add column
            </OriginButton>
          </div>
        </DndContext>
      )}

      {/* Add task modal */}
      <Modal open={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add project member">
        <div className="space-y-4">
          {projectMemberError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {projectMemberError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Workspace member</label>
            <select
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select a person</option>
              {workspaceMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName ?? member.email ?? member.userId}
                </option>
              ))}
            </select>
            {workspaceMembers.length === 0 && !projectMemberError && (
              <p className="mt-2 text-xs text-slate-500">All workspace members are already assigned to this project.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Project role</label>
            <select
              value={projectMemberRole}
              onChange={(event) => setProjectMemberRole(event.target.value as OrgRole)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {PROJECT_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <OriginButton onClick={() => setIsAddMemberOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </OriginButton>
            <OriginButton onClick={handleAddProjectMember} disabled={addingProjectMember || !selectedMemberId} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {addingProjectMember ? 'Adding...' : 'Add to project'}
            </OriginButton>
          </div>
        </div>
      </Modal>

      {/* Add task modal */}
      <Modal open={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} title="Add task">
        <div className="space-y-4">
          {taskError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {taskError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {(['Low', 'Medium', 'High', 'Urgent'] as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <OriginButton
              onClick={() => setIsAddTaskOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </OriginButton>
            <OriginButton
              onClick={handleCreateTask}
              disabled={creatingTask}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creatingTask ? 'Creating...' : 'Create task'}
            </OriginButton>
          </div>
        </div>
      </Modal>

      {/* Add column modal */}
      <Modal open={isAddColumnOpen} onClose={() => setIsAddColumnOpen(false)} title="Add column">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Column name</label>
            <input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Review"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn();
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <OriginButton
              onClick={() => setIsAddColumnOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </OriginButton>
            <OriginButton
              onClick={handleAddColumn}
              disabled={creatingColumn || !newColumnName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creatingColumn ? 'Adding...' : 'Add column'}
            </OriginButton>
          </div>
        </div>
      </Modal>

      <TaskSideDrawer
        task={selectedTask}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaved={fetchBoard}
        onDeleted={fetchBoard}
      />
    </DashboardLayout>
  );
}
