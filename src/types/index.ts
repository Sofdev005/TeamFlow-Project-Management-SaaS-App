export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  boardColumnId?: string;
  columnId?: string;
  status?: string | number;
  order?: number;
  priority?: TaskPriority | number | string;
  assigneeId?: string;
  reporterId?: string;
  dueDate?: string;
  parentTaskId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  name?: string;
  order: number;
  tasks: TaskItem[];
}

export interface Project {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  description?: string;
  teamId?: string;
  isArchived?: boolean;
}

export interface CreateProjectRequest {
  name: string;
  organizationId: string;
  description?: string;
}

export interface CreateTaskRequest {
  title: string;
  projectId: string;
  boardColumnId: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  order?: number;
  parentTaskId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  organizationId?: string;
}

export interface OrganizationMember {
  memberId: string;
  userId: string;
  role: string | number;
  status: string | number;
  joinedAt: string;
  email?: string;
  fullName?: string;
}

export interface ProjectMember {
  userId: string;
  email: string;
  fullName: string;
  role: OrgRole | number;
  isOnline: boolean;
}

export type OrgRole = 'Owner' | 'Admin' | 'Manager' | 'Developer' | 'Viewer';

export interface AuthenticationResult {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  orgId: string;
  token: string;
}
