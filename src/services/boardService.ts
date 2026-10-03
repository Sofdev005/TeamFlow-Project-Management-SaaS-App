import apiClient, { getErrorMessage, isRoutingError } from '@/lib/apiClient';
import type { BoardColumn } from '@/types';

export interface BoardColumnResponse {
  id: string;
  boardId?: string;
  projectId?: string;
  name: string;
  order: number;
}

function mapColumn(c: BoardColumnResponse): BoardColumn {
  return { id: c.id, title: c.name, name: c.name, order: c.order, tasks: [] };
}

export async function getColumns(projectId: string): Promise<BoardColumn[]> {
  try {
    const { data } = await apiClient.get<BoardColumnResponse[]>(
      `/boards/columns/${projectId}`
    );
    return (data ?? []).map(mapColumn);
  } catch (error) {
    if (!isRoutingError(error)) throw new Error(getErrorMessage(error, 'Failed to load board columns.'));
    // Endpoint missing on this backend build: caller falls back to local columns.
    throw error;
  }
}

export async function createColumn(
  projectId: string,
  name: string,
  order: number
): Promise<BoardColumn> {
  const { data } = await apiClient.post<BoardColumnResponse>('/boards/columns', {
    projectId,
    name,
    order,
  });
  return mapColumn(data);
}

export interface ColumnOrder {
  columnId: string;
  newOrder: number;
}

export async function reorderColumns(boardId: string, columnOrders: ColumnOrder[]): Promise<void> {
  await apiClient.put('/boards/columns/reorder', { boardId, columnOrders });
}
