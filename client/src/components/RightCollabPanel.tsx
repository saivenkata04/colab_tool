import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Activity as ActivityIcon, 
  X, 
  CheckCircle, 
  Trash2, 
  CornerDownRight,
  Shield,
  Circle,
  MessageCircle,
  Send,
  Code
} from 'lucide-react';
import { WorkspaceMember, Comment } from '../types';
import { PresenceUser } from '../collaboration/yjsProvider';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';

export interface ChatMessage {
  id: string;
  workspaceId: string;
  userId: string;
  content: string;
  isCode?: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface RightCollabPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  members: WorkspaceMember[];
  presence: PresenceUser[];
  comments: Comment[];
  documentName: string;
  defaultLine?: number;
  onAddComment: (content: string, lineNumber: number) => Promise<void>;
  onToggleResolve: (id: string, resolved: boolean) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}

export const RightCollabPanel: React.FC<RightCollabPanelProps> = ({
  isOpen,
  onClose,
  workspaceId,
  members,
  presence,
  comments,
  documentName,
  defaultLine = 1,
  onAddComment,
  onToggleResolve,
  onDeleteComment,
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'comments' | 'members' | 'chat' | 'activity'>('comments');
  const [commentContent, setCommentContent] = useState('');
  const [commentLine, setCommentLine] = useState(defaultLine);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat messages when workspaceId changes or tab switches to chat
  useEffect(() => {
    if (workspaceId && (activeTab === 'chat' || chatMessages.length === 0)) {
      api.get<ChatMessage[]>(`/workspaces/${workspaceId}/messages`)
        .then((data) => {
          setChatMessages(data);
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        })
        .catch(() => {});
    }
  }, [workspaceId, activeTab]);

  if (!isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setIsSubmitting(true);
    await onAddComment(commentContent.trim(), commentLine);
    setCommentContent('');
    setIsSubmitting(false);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !workspaceId) return;

    const content = chatInput.trim();
    const isCode = isSendingCode;
    setChatInput('');
    setIsSendingCode(false);

    try {
      const newMsg = await api.post<ChatMessage>(`/workspaces/${workspaceId}/messages`, {
        content,
        isCode,
      });
      setChatMessages((prev) => [...prev, newMsg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      console.error('Failed to send chat message', err);
    }
  };

  return (
    <aside className="w-80 bg-[#111418] border-l border-[#252A33] flex flex-col h-full shrink-0 select-none z-20 font-sans">
      {/* Panel Tab Header */}
      <div className="h-10 border-b border-[#252A33] px-2 flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-2 py-1 rounded text-xs font-medium transition shrink-0 ${
              activeTab === 'comments'
                ? 'bg-[#171B21] text-[#F5F7FA]'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            Comments ({comments.length})
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2 py-1 rounded text-xs font-medium transition shrink-0 ${
              activeTab === 'chat'
                ? 'bg-[#171B21] text-[#F5F7FA]'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            Chat ({chatMessages.length})
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-2 py-1 rounded text-xs font-medium transition shrink-0 ${
              activeTab === 'members'
                ? 'bg-[#171B21] text-[#F5F7FA]'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            Members ({members.length})
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-2 py-1 rounded text-xs font-medium transition shrink-0 ${
              activeTab === 'activity'
                ? 'bg-[#171B21] text-[#F5F7FA]'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            Activity
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-[#9CA3AF] hover:text-[#F5F7FA] hover:bg-[#171B21] rounded shrink-0 ml-1"
          title="Close Panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab 1: Comments */}
      {activeTab === 'comments' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {comments.map((cmt) => {
              const isOwner = user?.id === cmt.userId;
              return (
                <div
                  key={cmt.id}
                  className={`p-3 rounded-lg border text-xs transition ${
                    cmt.resolved
                      ? 'bg-[#0B0D10]/60 border-[#252A33] opacity-60'
                      : 'bg-[#171B21] border-[#252A33]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#6366F1]/20 text-[#818CF8] font-bold flex items-center justify-center text-[10px]">
                        {(cmt.user?.name || 'U').slice(0, 1)}
                      </div>
                      <span className="font-semibold text-[#F5F7FA]">{cmt.user?.name || 'Collaborator'}</span>
                    </div>
                    <span className="bg-[#6366F1]/10 text-[#818CF8] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#6366F1]/20">
                      Line {cmt.lineNumber}
                    </span>
                  </div>

                  <p className="text-[#F5F7FA] my-2 leading-relaxed whitespace-pre-wrap">{cmt.content}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#252A33] text-[10px] text-[#9CA3AF]">
                    <span>{new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleResolve(cmt.id, !cmt.resolved)}
                        className={`flex items-center gap-1 text-[11px] ${
                          cmt.resolved ? 'text-[#9CA3AF]' : 'text-[#22C55E]'
                        }`}
                      >
                        <CheckCircle size={11} />
                        <span>{cmt.resolved ? 'Reopen' : 'Resolve'}</span>
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => onDeleteComment(cmt.id)}
                          className="text-[#9CA3AF] hover:text-[#EF4444]"
                          title="Delete comment"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {comments.length === 0 && (
              <div className="py-12 text-center text-xs text-[#9CA3AF]">
                No comments on {documentName} yet.
              </div>
            )}
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="p-3 border-t border-[#252A33] bg-[#0B0D10] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <span>Comment on Line:</span>
              <input
                type="number"
                min="1"
                value={commentLine}
                onChange={(e) => setCommentLine(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 bg-[#111418] border border-[#252A33] rounded px-1.5 py-0.5 text-[#F5F7FA] font-mono text-center text-xs outline-none"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Add code review feedback..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full bg-[#111418] border border-[#252A33] rounded-md p-2 text-xs text-[#F5F7FA] placeholder-[#6B7280] outline-none resize-none focus:border-[#6366F1]"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentContent.trim()}
              className="w-full bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-50 text-white font-medium text-xs py-1.5 rounded-md transition"
            >
              {isSubmitting ? 'Posting...' : 'Comment'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Live Workspace Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg) => {
              const isSelf = user?.id === msg.userId;
              return (
                <div key={msg.id} className="flex flex-col text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center font-bold text-[9px]">
                      {(msg.user?.name || 'U').slice(0, 1)}
                    </div>
                    <span className="font-semibold text-[#F5F7FA] text-[11px]">
                      {msg.user?.name || 'Teammate'} {isSelf && '(You)'}
                    </span>
                    <span className="text-[10px] text-[#6B7280] ml-auto">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.isCode ? (
                    <pre className="p-2.5 rounded-lg bg-[#0B0D10] border border-[#252A33] font-mono text-[11px] text-[#F5F7FA] whitespace-pre-wrap overflow-x-auto select-text">
                      {msg.content}
                    </pre>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-[#171B21] border border-[#252A33] text-[#F5F7FA] leading-relaxed select-text">
                      {msg.content}
                    </div>
                  )}
                </div>
              );
            })}

            {chatMessages.length === 0 && (
              <div className="py-12 text-center text-xs text-[#9CA3AF]">
                No messages yet. Send a message to chat with room collaborators in real time.
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-[#252A33] bg-[#0B0D10] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <button
                type="button"
                onClick={() => setIsSendingCode(!isSendingCode)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition ${
                  isSendingCode ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'hover:bg-[#171B21] text-[#9CA3AF]'
                }`}
                title="Send formatted code snippet"
              >
                <Code size={12} />
                <span>Code Snippet</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isSendingCode ? 'Paste code snippet...' : 'Message collaborators...'}
                className="flex-1 bg-[#111418] border border-[#252A33] rounded px-2.5 py-1.5 text-xs text-[#F5F7FA] placeholder-[#6B7280] outline-none focus:border-[#6366F1]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-50 text-white p-1.5 rounded transition"
                title="Send Message"
              >
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Members */}
      {activeTab === 'members' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
            Collaborators ({members.length})
          </div>

          {members.map((mem) => {
            const isOnline = presence.some((p) => p.userId === mem.userId);
            const isSelf = user?.id === mem.userId;

            return (
              <div
                key={mem.id}
                className="p-2.5 rounded-lg bg-[#171B21] border border-[#252A33] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-[#111418] border border-[#252A33] flex items-center justify-center font-bold text-[#818CF8] text-xs">
                      {(mem.user?.name || 'U').slice(0, 1)}
                    </div>
                    {isOnline && (
                      <span className="w-2 h-2 rounded-full bg-[#22C55E] absolute -bottom-0.5 -right-0.5 border border-[#111418]" />
                    )}
                  </div>

                  <div>
                    <div className="font-medium text-[#F5F7FA] leading-tight">
                      {mem.user?.name} {isSelf && '(You)'}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] leading-tight mt-0.5">
                      {isOnline ? 'Online now' : 'Offline'}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                  mem.role === 'owner'
                    ? 'bg-[#6366F1]/15 text-[#818CF8]'
                    : mem.role === 'editor'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                    : 'bg-[#9CA3AF]/15 text-[#9CA3AF]'
                }`}>
                  {mem.role}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Real Activity Feed */}
      {activeTab === 'activity' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">
            Recent Events
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#171B21] border border-[#252A33]">
              <div className="text-[#F5F7FA] font-medium">Session Connected</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">Connected to WebSocket room with Yjs CRDT synchronization.</div>
            </div>

            {presence.map((p) => (
              <div key={p.userId} className="p-2.5 rounded-lg bg-[#171B21] border border-[#252A33]">
                <div className="text-[#22C55E] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  <span>{p.name} active</span>
                </div>
                <div className="text-[11px] text-[#9CA3AF] mt-0.5">Collaborating on {documentName}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
