import apiClient, { getErrorMessage, isRoutingError } from '@/lib/apiClient';
import type { CreateProjectRequest, OrgRole, Project, ProjectMember } from '@/types';

export async function getProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>('/projects');
  return data ?? [];
}

export async function getProjectById(projectId: string): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/projects/${projectId}`);
  return data;
}

export async function createProject(input: CreateProjectRequest): Promise<Project> {
  const { data } = await apiClient.post<Project>('/projects', input);
  return data;
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data } = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
  return data ?? [];
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: OrgRole
): Promise<void> {
  const roleValues: Record<OrgRole, number> = {
    Owner: 1,
    Admin: 2,
    Manager: 3,
    Developer: 4,
    Viewer: 5,
  };
  await apiClient.post(`/projects/${projectId}/members`, { userId, role: roleValues[role] });
}

export async function recordProjectPresence(projectId: string): Promise<void> {
  await apiClient.post(`/projects/${projectId}/presence`);
}

/**
 * Deletes a project.
 * NOTE: the current backend only exposes GET/POST /api/projects - if the
 * backend returns 404/405 the error is re-thrown with a clear message so the
 * UI can surface it instead of silently succeeding.
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    await apiClient.delete(`/projects/${projectId}`);
  } catch (error) {
    if (isRoutingError(error)) {
      throw new Error(
        'The backend does not expose DELETE /api/projects/{id} yet. Remove the endpoint or add the controller action.'
      );
    }
    throw new Error(getErrorMessage(error, 'Failed to delete project.'));
  }
}
