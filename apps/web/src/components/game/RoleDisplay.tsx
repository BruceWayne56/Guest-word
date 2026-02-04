import type { PlayerRole } from '@guest-word/shared';
import { cn } from '@/lib/utils';

interface RoleDisplayProps {
  role: PlayerRole | null;
}

const roleLabels: Record<PlayerRole, string> = {
  GUESSER: '猜字者',
  WORD_SETTER: '出題者',
  HINTER: '提示者',
  SPECTATOR: '觀眾',
};

const roleColors: Record<PlayerRole, string> = {
  GUESSER: 'bg-purple-100 text-purple-800 border-purple-300',
  WORD_SETTER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  HINTER: 'bg-blue-100 text-blue-800 border-blue-300',
  SPECTATOR: 'bg-gray-100 text-gray-800 border-gray-300',
};

export function RoleDisplay({ role }: RoleDisplayProps) {
  if (!role) return null;

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-sm font-medium border',
        roleColors[role]
      )}
    >
      {roleLabels[role]}
    </span>
  );
}
