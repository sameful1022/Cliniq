import { Member } from './supabase';

export function getDisplayName(member: Member, allMembers: Member[]): string {
  const membersWithSameName = allMembers
    .filter(m => m.name === member.name)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (membersWithSameName.length === 1) {
    return member.name;
  }

  const index = membersWithSameName.findIndex(m => m.id === member.id);

  if (index === 0) {
    return member.name;
  }

  const suffix = String.fromCharCode(65 + index); // 65 is 'A', so index 1 = 'B', index 2 = 'C', etc.
  return `${member.name} ${suffix}`;
}
