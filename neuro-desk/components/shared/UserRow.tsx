import {
  BsShieldLockFill, BsShieldFillCheck,
  BsRobot, BsChatDotsFill, BsBarChartFill, BsPersonBadge,
  BsCheckCircleFill, BsXCircleFill, BsTrashFill
} from 'react-icons/bs';
import { UserRecord } from '@/lib/features/users/usersSlice';

const roleBadge: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  User: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
};

function ActionBtn({
  icon, label, variant = 'default', onClick, theme,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  onClick?: () => void;
  theme: string;
}) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer';
  const variants: Record<string, string> = {
    default: theme === 'dark'
      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-600',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400',
    warning: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    success: 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400',
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`} title={label}>
      <span className="text-sm">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function UserRow({
  user, isSelf, theme, viewMode, onAction, onViewProfile
}: {
  user: UserRecord; isSelf: boolean; theme: string; viewMode: 'admin' | 'manager';
  onAction: (u: UserRecord, act: 'block' | 'unblock' | 'restrictAi' | 'allowAi' | 'delete') => void;
  onViewProfile?: (u: UserRecord) => void;
}) {
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`group flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border transition-all ${
      theme === 'dark'
        ? 'bg-white/3 border-white/5 hover:bg-white/6'
        : 'bg-white border-gray-100 hover:bg-gray-50'
    } ${isSelf ? (theme === 'dark' ? 'ring-1 ring-primary/40' : 'ring-1 ring-primary/30') : ''}`}>

      {/* Avatar + Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary to-primary-dark flex items-center justify-center text-white text-sm font-black">
            {initials}
          </div>
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
            theme === 'dark' ? 'border-[#0a0a0a]' : 'border-white'
          } ${isSelf ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {user.fullName}
            </span>
            {isSelf && (
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20">
                (You)
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${roleBadge[user.role] ?? roleBadge.User}`}>
              {user.role}
            </span>
          </div>
          <p className={`text-xs mt-0.5 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {user.email}
          </p>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
          user.isActive
            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
            : 'bg-red-500/10 text-red-500 dark:text-red-400'
        }`}>
          {user.isActive ? <BsCheckCircleFill /> : <BsXCircleFill />}
          {user.isActive ? 'Active' : 'Blocked'}
        </span>
        {user.isAiRestricted && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <BsRobot />
            AI Off
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {!isSelf && !(viewMode === 'manager' && user.role === 'Admin') && (
          <ActionBtn
            icon={user.isActive ? <BsShieldLockFill /> : <BsShieldFillCheck />}
            label={user.isActive ? 'Block' : 'Unblock'}
            variant={user.isActive ? 'danger' : 'success'}
            theme={theme}
            onClick={() => onAction(user, user.isActive ? 'block' : 'unblock')}
          />
        )}

        {!isSelf && (
          <ActionBtn
            icon={<BsRobot />}
            label={user.isAiRestricted ? 'Unrestrict AI Use' : 'Restrict AI'}
            variant={user.isAiRestricted ? 'success' : 'warning'}
            theme={theme}
            onClick={() => onAction(user, user.isAiRestricted ? 'allowAi' : 'restrictAi')}
          />
        )}

        {!isSelf && viewMode === 'admin' && (
          <ActionBtn
            icon={<BsTrashFill />}
            label="Delete"
            variant="danger"
            theme={theme}
            onClick={() => onAction(user, 'delete')}
          />
        )}

        <ActionBtn icon={<BsChatDotsFill />} label="Chat" theme={theme} />
        <ActionBtn icon={<BsBarChartFill />} label="Stats" theme={theme} />
        {user.role !== 'Manager' && user.role !== 'Admin' && (
          <ActionBtn 
            icon={<BsPersonBadge />} 
            label="Profile" 
            theme={theme} 
            onClick={() => onViewProfile?.(user)}
          />
        )}
      </div>
    </div>
  );
}
