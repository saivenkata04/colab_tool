import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  Plus, 
  X, 
  Clock, 
  Check, 
  User, 
  FileCode,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { api } from '../utils/api';
import { Document } from '../types';

export interface DocumentVersion {
  id: string;
  documentId: string;
  name: string;
  content: string;
  createdBy: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onRestoreContent: (content: string) => Promise<void>;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  document,
  onRestoreContent,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      loadVersions();
    }
  }, [isOpen, document?.id]);

  const loadVersions = async () => {
    if (!document) return;
    setIsLoading(true);
    try {
      const data = await api.get<DocumentVersion[]>(`/documents/${document.id}/versions`);
      setVersions(data);
      if (data.length > 0) {
        setSelectedVersion(data[0]);
      } else {
        setSelectedVersion(null);
      }
    } catch (err) {
      console.error('Failed to load document versions', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !document) return null;

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotName.trim()) return;

    try {
      const created = await api.post<DocumentVersion>(`/documents/${document.id}/versions`, {
        name: newSnapshotName.trim(),
        content: document.content || '',
      });
      setVersions((prev) => [created, ...prev]);
      setSelectedVersion(created);
      setNewSnapshotName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create snapshot', err);
    }
  };

  const handleRestore = async (version: DocumentVersion) => {
    if (!window.confirm(`Are you sure you want to restore to snapshot "${version.name}"? Current unsaved changes will be overwritten.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      await api.post(`/documents/${document.id}/restore`, {
        versionId: version.id,
      });
      await onRestoreContent(version.content);
      onClose();
    } catch (err) {
      console.error('Failed to restore snapshot', err);
    } finally {
      setIsRestoring(false);
    }
  };

  // Simple visual diff calculator
  const computeDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff: Array<{ type: 'same' | 'added' | 'removed'; text: string; lineNum: number }> = [];

    let i = 0;
    let j = 0;
    let lineCount = 1;

    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        diff.push({ type: 'same', text: oldLines[i], lineNum: lineCount++ });
        i++;
        j++;
      } else if (j < newLines.length && (i >= oldLines.length || !oldLines.includes(newLines[j]))) {
        diff.push({ type: 'added', text: newLines[j], lineNum: lineCount++ });
        j++;
      } else if (i < oldLines.length) {
        diff.push({ type: 'removed', text: oldLines[i], lineNum: lineCount++ });
        i++;
      } else {
        j++;
      }
    }

    return diff;
  };

  const diffLines = selectedVersion
    ? computeDiff(selectedVersion.content || '', document.content || '')
    : [];

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[600px] bg-[#111418] border border-[#252A33] rounded-xl shadow-modal overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-12 border-b border-[#252A33] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History size={16} className="text-[#6366F1]" />
            <span className="font-semibold text-sm text-[#F5F7FA]">
              Version History & Checkpoints
            </span>
            <span className="text-xs text-[#9CA3AF]">
              • {document.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs px-2.5 py-1 rounded-md font-medium transition"
            >
              <Plus size={13} />
              <span>Save Checkpoint</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-[#9CA3AF] hover:text-[#F5F7FA] rounded hover:bg-[#171B21] transition"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Snapshot Creation Bar */}
        {isCreating && (
          <form onSubmit={handleCreateSnapshot} className="p-3 bg-[#171B21] border-b border-[#252A33] flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Optimized recursive search, Fixed loop bounds..."
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              className="flex-1 bg-[#0B0D10] border border-[#252A33] rounded px-3 py-1.5 text-xs text-[#F5F7FA] placeholder-[#6B7280] outline-none focus:border-[#6366F1]"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newSnapshotName.trim()}
              className="bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded font-medium transition"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-[#9CA3AF] hover:text-[#F5F7FA] text-xs px-2 py-1.5"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Body (Left Timeline + Right Diff Viewer) */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Snapshots List */}
          <div className="w-72 border-r border-[#252A33] flex flex-col bg-[#0B0D10]/50 overflow-y-auto p-2 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-2 py-1">
              Snapshots ({versions.length})
            </div>

            {versions.map((ver) => {
              const isSelected = selectedVersion?.id === ver.id;
              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`p-2.5 rounded-lg cursor-pointer transition text-xs border ${
                    isSelected
                      ? 'bg-[#171B21] border-[#6366F1] text-[#F5F7FA]'
                      : 'border-transparent hover:bg-[#171B21]/60 text-[#9CA3AF] hover:text-[#F5F7FA]'
                  }`}
                >
                  <div className="font-medium text-[#F5F7FA] truncate">{ver.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mt-1">
                    <Clock size={11} />
                    <span>{new Date(ver.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <div className="text-[10px] text-[#818CF8] mt-1 truncate">
                    by {ver.user?.name || 'Collaborator'}
                  </div>
                </div>
              );
            })}

            {versions.length === 0 && !isLoading && (
              <div className="py-12 text-center text-xs text-[#9CA3AF] px-4">
                No checkpoints created yet. Click "Save Checkpoint" to snapshot the current document.
              </div>
            )}
          </div>

          {/* Right: Visual Diff Viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0B0D10] overflow-hidden">
            {selectedVersion ? (
              <>
                {/* Diff Header */}
                <div className="h-10 border-b border-[#252A33] bg-[#111418] px-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[#9CA3AF]">
                      Comparing snapshot: <strong className="text-[#F5F7FA]">{selectedVersion.name}</strong> vs <strong className="text-[#22C55E]">Current Document</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    disabled={isRestoring}
                    className="flex items-center gap-1.5 bg-[#171B21] hover:bg-[#1D222A] text-[#22C55E] border border-[#252A33] px-3 py-1 rounded text-xs font-medium transition"
                  >
                    <RotateCcw size={12} />
                    <span>{isRestoring ? 'Restoring...' : 'Restore This Version'}</span>
                  </button>
                </div>

                {/* Diff Output Stream */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-5 select-text">
                  {diffLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start px-2 py-0.5 rounded ${
                        line.type === 'added'
                          ? 'bg-[#22C55E]/15 text-[#22C55E]'
                          : line.type === 'removed'
                          ? 'bg-[#EF4444]/15 text-[#EF4444] line-through'
                          : 'text-[#9CA3AF]'
                      }`}
                    >
                      <span className="w-8 shrink-0 text-[#6B7280] select-none text-right pr-3 text-[10px]">
                        {line.lineNum}
                      </span>
                      <span className="w-4 shrink-0 select-none font-bold">
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap">{line.text || ' '}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#9CA3AF]">
                Select a snapshot from the timeline to view diff analysis.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
