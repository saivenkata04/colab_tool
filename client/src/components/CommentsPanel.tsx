import React, { useState } from 'react';
import { MessageSquare, Plus, CheckCircle, Trash2, X, CornerDownRight } from 'lucide-react';
import { Comment } from '../types';
import { useAuthStore } from '../store/authStore';

interface CommentsPanelProps {
  comments: Comment[];
  documentName: string;
  defaultLine?: number;
  onAddComment: (content: string, lineNumber: number) => Promise<void>;
  onToggleResolve: (id: string, resolved: boolean) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  onClose: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  documentName,
  defaultLine = 1,
  onAddComment,
  onToggleResolve,
  onDeleteComment,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [line, setLine] = useState(defaultLine);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    await onAddComment(content.trim(), line);
    setContent('');
    setIsSubmitting(false);
  };

  return (
    <aside className="w-80 bg-dark-800 border-l border-white/10 flex flex-col h-full shrink-0 z-20">
      {/* Header */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
          <MessageSquare size={15} className="text-primary-400" />
          <span>COMMENTS ({comments.length})</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
          <X size={15} />
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.map((cmt) => {
          const isOwner = user?.id === cmt.userId;
          return (
            <div
              key={cmt.id}
              className={`p-3 rounded-xl border text-xs transition ${
                cmt.resolved
                  ? 'bg-dark-900/50 border-white/5 opacity-60'
                  : 'bg-dark-700/80 border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-300 font-bold flex items-center justify-center text-[10px]">
                    {(cmt.user?.name || 'U').slice(0, 1)}
                  </div>
                  <span className="font-semibold text-gray-200">{cmt.user?.name || 'Collaborator'}</span>
                </div>
                <span className="bg-primary-500/10 text-primary-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary-500/20">
                  Line {cmt.lineNumber}
                </span>
              </div>

              <p className="text-gray-300 my-2 leading-relaxed whitespace-pre-wrap">{cmt.content}</p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-gray-500">
                <span>{new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onToggleResolve(cmt.id, !cmt.resolved)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                      cmt.resolved ? 'text-gray-400 hover:text-white' : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <CheckCircle size={12} />
                    <span>{cmt.resolved ? 'Reopen' : 'Resolve'}</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => onDeleteComment(cmt.id)}
                      className="p-1 hover:text-red-400 text-gray-500 transition"
                      title="Delete Comment"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {comments.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-500">
            No comments on this document yet. Pin a comment to any line!
          </div>
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-dark-900 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Add Comment to Line:</span>
          <input
            type="number"
            min="1"
            value={line}
            onChange={(e) => setLine(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 bg-dark-800 border border-white/10 rounded px-2 py-0.5 text-white font-mono text-center"
          />
        </div>

        <textarea
          rows={3}
          placeholder="Why are we using recursion here?..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-dark-800 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-medium text-xs py-2 rounded-lg transition"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </aside>
  );
};
