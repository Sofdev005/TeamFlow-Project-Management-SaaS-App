'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FolderKanban, Plus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Spinner from '@/components/Spinner';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/apiClient';
import { createProject, deleteProject, getProjects } from '@/services/projectService';
import type { Project } from '@/types';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await getProjects());
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load projects.'));
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
    if (!name.trim()) {
      setModalError('Project name is required.');
      return;
    }
    setCreating(true);
    setModalError(null);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        organizationId: user?.organizationId ?? '',
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
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
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">All projects in your workspace.</p>
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
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <FolderKanban className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-700">No projects yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="hidden px-6 py-3 font-medium sm:table-cell">Created</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <Link href={`/projects/${project.id}`} className="hover:text-indigo-600">
                      {project.name}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-slate-500">
                    {project.description || '—'}
                  </td>
                  <td className="hidden px-6 py-4 text-slate-500 sm:table-cell">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {project.isArchived ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Archived
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                      >
                        Board <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(project)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
