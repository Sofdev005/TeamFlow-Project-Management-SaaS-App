'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, Clock, FolderKanban, Plus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Spinner from '@/components/Spinner';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/apiClient';
import { createProject, deleteProject, getProjects } from '@/services/projectService';
import { getTasksByProjectId } from '@/services/taskService';
import type { Project, TaskItem } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getProjects();
      setProjects(list);
      // Best-effort total task count across projects.
      const counts = await Promise.allSettled(list.map((p) => getTasksByProjectId(p.id)));
      const total = counts.reduce(
        (sum, r) => (r.status === 'fulfilled' ? sum + r.value.length : sum),
        0
      );
      setTaskCount(total);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(() => {
      getProjects().then(setProjects).catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setModalError('Project name is required.');
      return;
    }
    setCreating(true);
    setModalError(null);
    try {
      await createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        organizationId: user?.organizationId ?? '',
      });
      setIsModalOpen(false);
      setProjectName('');
      setProjectDescription('');
      await load();
    } catch (err) {
      setModalError(getErrorMessage(err, 'Failed to create project.'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(project.id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete project.'));
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good to see you, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here is what is happening in your workspace.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-10 w-10" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                  <FolderKanban className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-slate-500">Projects</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{taskCount ?? '—'}</p>
                  <p className="text-sm text-slate-500">Total tasks</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.filter((p) => !p.isArchived).length}</p>
                  <p className="text-sm text-slate-500">Active projects</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent projects */}
          <h2 className="mb-4 text-lg font-semibold">Recent projects</h2>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
              <FolderKanban className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-700">No projects yet</p>
              <p className="mt-1 text-sm text-slate-500">Create your first project to get started.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                New project
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <div
                  key={project.id}
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <Link href={`/projects/${project.id}`} className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 group-hover:text-indigo-600">
                        {project.name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {project.description || 'No description'}
                      </p>
                    </Link>
                    <button
                      onClick={() => handleDelete(project)}
                      className="rounded-md p-1 text-xs text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="New project">
        <div className="space-y-4">
          {modalError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {modalError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Website redesign"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
