import React, { useState } from 'react';
import { Share2, Copy, Check, X, UserPlus, Shield, Trash2 } from 'lucide-react';
import { WorkspaceMember } from '../types';
import { useAuthStore } from '../store/authStore';

interface ShareModalProps {
  isOpen: boolean;
  workspaceId: string;
  workspaceName: string;
  members: WorkspaceMember[];
  onInviteMember: (email: string, role: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  workspaceId,
  workspaceName,
  members,
  onInviteMember,
  onRemoveMember,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [copied, setCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const inviteLink = `${window.location.origin}/workspace/${workspaceId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setIsInviting(true);
    try {
      await onInviteMember(email.trim(), role);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center">
              <Share2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Share "{workspaceName}"</h2>
              <p className="text-[11px] text-gray-400">Invite collaborators to code together</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded">
            <X size={16} />
          </button>
        </div>

        {/* Copy Invite Link */}
        <div className="mb-5 bg-dark-900 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="truncate text-xs text-gray-400 font-mono select-all">
            {inviteLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg shrink-0 transition"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Invite by Email */}
        <form onSubmit={handleInviteSubmit} className="mb-5">
          <label className="block text-xs font-semibold text-gray-300 mb-2">
            Invite by Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-gray-200 focus:outline-none"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={isInviting || !email.trim()}
              className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg shrink-0 transition"
            >
              {isInviting ? 'Sending...' : 'Invite'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
        </form>

        {/* Workspace Members List */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Workspace Members ({members.length})
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {members.map((mem) => {
              const isSelf = user?.id === mem.userId;
              return (
                <div
                  key={mem.id}
                  className="flex items-center justify-between p-2.5 bg-dark-900/60 border border-white/5 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-300 font-bold flex items-center justify-center text-xs">
                      {(mem.user?.name || 'U').slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {mem.user?.name || 'Collaborator'} {isSelf && '(You)'}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[150px]">
                        {mem.user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        mem.role === 'owner'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : mem.role === 'editor'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}
                    >
                      {mem.role}
                    </span>

                    {mem.role !== 'owner' && (
                      <button
                        onClick={() => onRemoveMember(mem.userId)}
                        className="p-1 text-gray-500 hover:text-red-400 transition"
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
