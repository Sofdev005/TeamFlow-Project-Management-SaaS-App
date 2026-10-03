'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Spinner from '@/components/Spinner';
import Modal from '@/components/Modal';
import { getErrorMessage } from '@/lib/apiClient';
import { getMembers, inviteMember } from '@/services/organizationService';
import { addProjectMember, getProjects } from '@/services/projectService';
import type { OrgRole, OrganizationMember, Project } from '@/types';

const ROLES: OrgRole[] = ['Admin', 'Manager', 'Developer', 'Viewer'];

const ROLE_LABELS: Record<string, string> = {
  '1': 'Owner',
  '2': 'Admin',
  '3': 'Manager',
  '4': 'Developer',
  '5': 'Viewer',
};

const STATUS_LABELS: Record<string, string> = {
  '1': 'Invited',
  '2': 'Active',
  '3': 'Suspended',
};

function label(map: Record<string, string>, value: string | number | undefined): string {
  if (value === undefined) return '—';
  return map[String(value)] ?? String(value);
}

export default function TeamPage() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('Developer');
  const [inviteProjectId, setInviteProjectId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await getMembers());
      setProjects(await getProjects());
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load team members.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Email is required.');
      return;
    }
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const email = inviteEmail.trim();
      await inviteMember(email, inviteRole);
      if (inviteProjectId) {
        const updatedMembers = await getMembers();
        const invitedMember = updatedMembers.find(
          member => member.email?.toLowerCase() === email.toLowerCase()
        );
        if (!invitedMember) throw new Error('Member was added to the workspace but could not be found for project assignment.');
        await addProjectMember(inviteProjectId, invitedMember.userId, inviteRole);
        const project = projects.find(item => item.id === inviteProjectId);
        setInviteSuccess(`${email} was added to ${project?.name ?? 'the project'} as ${inviteRole}.`);
      } else {
        setInviteSuccess(`${email} was added to the workspace as ${inviteRole}.`);
      }
      setInviteEmail('');
      await load();
    } catch (err) {
      setInviteError(getErrorMessage(err, 'Failed to invite member.'));
    } finally {
      setInviting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-slate-500">Manage members of your organization.</p>
        </div>
        <button
          onClick={() => {
            setInviteError(null);
            setInviteSuccess(null);
            setIsInviteOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Invite member
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
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-700">No members found</p>
          <p className="mt-1 text-sm text-slate-500">Invite someone to your workspace to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="hidden px-6 py-3 font-medium sm:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.memberId} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {(member.fullName ?? member.email ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{member.fullName ?? '—'}</p>
                        <p className="text-xs text-slate-500">{member.email ?? member.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {label(ROLE_LABELS, member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        label(STATUS_LABELS, member.status) === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {label(STATUS_LABELS, member.status)}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-500 sm:table-cell">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite member">
        <div className="space-y-4">
          {inviteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {inviteSuccess}
            </div>
          )}
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
            The user must already have a TeamFlow account with this email. They are added to your
            organization immediately (the current backend does not send invitation emails).
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="teammate@example.com"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Project (optional)</label>
              <select
                value={inviteProjectId}
                onChange={(e) => setInviteProjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Workspace only</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {inviting ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
