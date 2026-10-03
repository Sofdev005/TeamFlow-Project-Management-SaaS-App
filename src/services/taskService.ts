import apiClient, { getErrorMessage, isRoutingError } from '@/lib/apiClient';
import type { CreateTaskRequest, TaskItem, TaskPriority } from '@/types';

/**
 * Backend enum values (TeamFlow.Domain.Enums.TaskPriority):
 * Low = 1, Medium = 2, High = 3, Urgent = 4
 */
const PRIORITY_TO_API: Record<TaskPriority, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Urgent: 4,
};

export function priorityToApi(priority?: TaskPriority | number | string): number {
  if (typeof priority === 'number') return priority;
  if (priority && priority in PRIORITY_TO_API) return PRIORITY_TO_API[priority as TaskPriority];
  return PRIORITY_TO_API.Medium;
}

export function priorityFromApi(priority?: number | string): TaskPriority {
  const map: Record<number, TaskPriority> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent' };
  if (typeof priority === 'number' && map[priority]) return map[priority];
  const normalized = String(priority ?? '').toLowerCase();
  if (normalized.startsWith('urg')) return 'Urgent';
  if (normalized.startsWith('hig')) return 'High';
  if (normalized.startsWith('low')) return 'Low';
  return 'Medium';
}

export async function getTasksByProjectId(projectId: string): Promise<TaskItem[]> {
  try {
    // Preferred route matching the intended contract.
    const { data } = await apiClient.get<TaskItem[]>('/tasks', {
      params: { projectId },
    });
    return data ?? [];
  } catch (error) {
    // Only fall back for missing endpoint/wrong method - real failures (500, network) must surface.
    if (!isRoutingError(error)) throw new Error(getErrorMessage(error, 'Failed to load tasks.'));
  }

  try {
    const { data } = await apiClient.get<TaskItem[]>(`/projects/${projectId}/tasks`);
    return data ?? [];
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load tasks.'));
  }
}

export async function createTask(request: CreateTaskRequest): Promise<TaskItem> {
  const { data } = await apiClient.post<TaskItem>('/tasks', {
    projectId: request.projectId,
    boardColumnId: request.boardColumnId,
    title: request.title,
    description: request.description ?? '',
    priority: priorityToApi(request.priority),
    order: request.order ?? 0,
    ...(request.assigneeId ? { assigneeId: request.assigneeId } : {}),
    ...(request.dueDate ? { dueDate: request.dueDate } : {}),
    ...(request.parentTaskId ? { parentTaskId: request.parentTaskId } : {}),
  });
  return data;
}

export async function moveTask(
  taskId: string,
  targetColumnId: string,
  newOrder: number
): Promise<void> {
  try {
    await apiClient.patch(`/tasks/${taskId}/move`, { targetColumnId, newOrder });
  } catch (error) {
    if (!isRoutingError(error)) throw new Error(getErrorMessage(error, 'Failed to move task.'));
    // Backend PATCH route missing -> try the PUT fallback.
    await updateTask(taskId, { boardColumnId: targetColumnId, order: newOrder });
  }
}

export interface UpdateTaskInput {
  boardColumnId?: string;
  order?: number;
  assigneeId?: string | null;
  dueDate?: string | null;
  title?: string;
  description?: string;
  priority?: TaskPriority;
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<TaskItem> {
  const body: Record<string, unknown> = { id: taskId };
  if (input.boardColumnId !== undefined) body.boardColumnId = input.boardColumnId;
  if (input.order !== undefined) body.order = input.order;
  if (input.assigneeId !== undefined) body.assigneeId = input.assigneeId;
  if (input.dueDate !== undefined) body.dueDate = input.dueDate;
  if (input.title !== undefined) body.title = input.title;
  if (input.description !== undefined) body.description = input.description;
  if (input.priority !== undefined) body.priority = priorityToApi(input.priority);

  const { data } = await apiClient.put<TaskItem>(`/tasks/${taskId}`, body);
  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}`);
}
