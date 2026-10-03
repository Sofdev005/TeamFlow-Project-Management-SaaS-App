import apiClient, { getErrorMessage } from '@/lib/apiClient';
import type { OrgRole, OrganizationMember } from '@/types';

export async function getMembers(): Promise<OrganizationMember[]> {
  try {
    const { data } = await apiClient.get<OrganizationMember[]>('/organizations/members');
    return data ?? [];
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load team members.'));
  }
}

export async function inviteMember(email: string, role: OrgRole): Promise<string> {
  // Backend OrgRole enum: Owner=1, Admin=2, Manager=3, Developer=4, Viewer=5
  const roleValue: Record<OrgRole, number> = {
    Owner: 1,
    Admin: 2,
    Manager: 3,
    Developer: 4,
    Viewer: 5,
  };
  try {
    const { data } = await apiClient.post<{ memberId: string }>(
      '/organizations/members/invite',
      { email, role: roleValue[role] }
    );
    return data?.memberId ?? '';
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to invite member.'));
  }
}
