import React, { useState } from 'react';
import { 
  FileCode, 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  FolderPlus, 
  Folder, 
  ChevronRight, 
  ChevronDown,
  Copy,
  Code,
  BookOpen,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { Document } from '../types';

interface FileExplorerProps {
  documents: Document[];
  currentDocument: Document | null;
  onSelectDocument: (doc: Document) => void;
  onCreateDocument: (name: string, type: 'code' | 'note', language?: string) => Promise<any>;
  onDeleteDocument: (id: string) => Promise<any>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  documents,
  currentDocument,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument,
  isCollapsed,
  onToggleCollapse,
  userRole = 'editor',
}) => {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'code' | 'note'>('code');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [srcFolderOpen, setSrcFolderOpen] = useState(true);
  const [docsFolderOpen, setDocsFolderOpen] = useState(true);

  const codeFiles = documents.filter((d) => d.type === 'code' && d.name.toLowerCase().includes(search.toLowerCase()));
  const noteFiles = documents.filter((d) => d.type === 'note' && d.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let finalName = newFileName.trim();
    let language = 'javascript';

    if (newFileType === 'code') {
      if (!finalName.includes('.')) finalName += '.js';
      const ext = finalName.split('.').pop()?.toLowerCase();
      if (ext === 'py') language = 'python';
      else if (ext === 'ts') language = 'typescript';
      else if (ext === 'java') language = 'java';
      else if (ext === 'cpp' || ext === 'c') language = 'cpp';
      else if (ext === 'html') language = 'html';
      else if (ext === 'css') language = 'css';
      else if (ext === 'json') language = 'json';
    } else {
      if (!finalName.includes('.')) finalName += '.md';
      language = 'markdown';
    }

    await onCreateDocument(finalName, newFileType, language);
    setNewFileName('');
    setIsCreating(false);
  };

  const getFileIcon = (doc: Document) => {
    if (doc.type === 'note') {
      return <FileText size={14} className="text-[#818CF8] shrink-0" />;
    }
    const ext = doc.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return <FileCode size={14} className="text-[#F59E0B] shrink-0" />;
      case 'ts':
        return <FileCode size={14} className="text-[#38BDF8] shrink-0" />;
      case 'html':
        return <FileCode size={14} className="text-[#F97316] shrink-0" />;
      case 'css':
        return <FileCode size={14} className="text-[#06B6D4] shrink-0" />;
      case 'json':
        return <FileCode size={14} className="text-[#22C55E] shrink-0" />;
      default:
        return <FileCode size={14} className="text-[#6366F1] shrink-0" />;
    }
  };

  // Collapsed View (64px)
  if (isCollapsed) {
    return (
      <aside className="w-14 bg-[#0B0D10] border-r border-[#252A33] flex flex-col items-center py-3 select-none shrink-0 transition-all duration-200">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-[#9CA3AF] hover:text-[#F5F7FA] hover:bg-[#171B21] rounded-lg mb-4 transition"
          title="Expand Explorer (Ctrl + B)"
        >
          <PanelLeft size={16} />
        </button>

        <div className="flex flex-col gap-2">
          {documents.slice(0, 8).map((doc) => (
            <button
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className={`p-2 rounded-lg transition relative ${
                doc.id === currentDocument?.id
                  ? 'bg-[#171B21] text-[#F5F7FA]'
                  : 'text-[#9CA3AF] hover:text-[#F5F7FA] hover:bg-[#111418]'
              }`}
              title={doc.name}
            >
              {getFileIcon(doc)}
              {doc.id === currentDocument?.id && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#6366F1] rounded-r" />
              )}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  // Expanded View (260px)
  return (
    <aside className="w-[260px] bg-[#0B0D10] border-r border-[#252A33] flex flex-col h-full select-none shrink-0 transition-all duration-200 font-sans">
      {/* Workspace Header */}
      <div className="h-10 border-b border-[#252A33] px-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          EXPLORER
        </span>
        <div className="flex items-center gap-1">
          {userRole !== 'viewer' && (
            <button
              onClick={() => setIsCreating(true)}
              className="p-1 text-[#9CA3AF] hover:text-[#F5F7FA] hover:bg-[#171B21] rounded transition"
              title="New File / Note"
            >
              <Plus size={14} />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 text-[#9CA3AF] hover:text-[#F5F7FA] hover:bg-[#171B21] rounded transition"
            title="Collapse Sidebar (Ctrl + B)"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111418] border border-[#252A33] rounded-md pl-7 pr-2 py-1 text-xs text-[#F5F7FA] placeholder-[#6B7280] focus:outline-none focus:border-[#6366F1]"
          />
        </div>
      </div>

      {/* Creation Box */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2.5 m-2 bg-[#171B21] border border-[#252A33] rounded-lg flex flex-col gap-2">
          <div className="flex gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => setNewFileType('code')}
              className={`flex-1 py-1 rounded font-medium flex items-center justify-center gap-1 ${
                newFileType === 'code' ? 'bg-[#6366F1] text-white' : 'bg-[#111418] text-[#9CA3AF]'
              }`}
            >
              <Code size={11} /> Code
            </button>
            <button
              type="button"
              onClick={() => setNewFileType('note')}
              className={`flex-1 py-1 rounded font-medium flex items-center justify-center gap-1 ${
                newFileType === 'note' ? 'bg-[#818CF8] text-white' : 'bg-[#111418] text-[#9CA3AF]'
              }`}
            >
              <BookOpen size={11} /> Note
            </button>
          </div>

          <input
            autoFocus
            type="text"
            placeholder={newFileType === 'code' ? 'script.py, app.js' : 'notes.md'}
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="bg-[#111418] border border-[#252A33] rounded px-2 py-1 text-xs text-white outline-none"
          />

          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2 py-0.5 text-xs text-[#9CA3AF] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 text-xs bg-[#6366F1] hover:bg-[#818CF8] text-white rounded font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Modern IDE Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Source Code Section */}
        <div className="mb-2">
          <div
            onClick={() => setSrcFolderOpen(!srcFolderOpen)}
            className="flex items-center gap-1 px-3 py-1 cursor-pointer text-[#9CA3AF] hover:text-[#F5F7FA] text-[11px] font-semibold tracking-wider uppercase"
          >
            {srcFolderOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>CODE FILES ({codeFiles.length})</span>
          </div>

          {srcFolderOpen && (
            <div className="mt-0.5">
              {codeFiles.map((doc) => {
                const isActive = doc.id === currentDocument?.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className={`group flex items-center justify-between px-3.5 py-1 text-xs cursor-pointer transition ${
                      isActive
                        ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                        : 'text-[#9CA3AF] hover:bg-[#111418] hover:text-[#F5F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(doc)}
                      <span className="font-mono text-[12px] truncate">{doc.name}</span>
                    </div>

                    {userRole !== 'viewer' && documents.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${doc.name}?`)) onDeleteDocument(doc.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#6B7280] hover:text-[#EF4444] transition"
                        title="Delete file"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rich Notes Section */}
        <div>
          <div
            onClick={() => setDocsFolderOpen(!docsFolderOpen)}
            className="flex items-center gap-1 px-3 py-1 cursor-pointer text-[#9CA3AF] hover:text-[#F5F7FA] text-[11px] font-semibold tracking-wider uppercase"
          >
            {docsFolderOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>RICH NOTES ({noteFiles.length})</span>
          </div>

          {docsFolderOpen && (
            <div className="mt-0.5">
              {noteFiles.map((doc) => {
                const isActive = doc.id === currentDocument?.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className={`group flex items-center justify-between px-3.5 py-1 text-xs cursor-pointer transition ${
                      isActive
                        ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                        : 'text-[#9CA3AF] hover:bg-[#111418] hover:text-[#F5F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(doc)}
                      <span className="truncate">{doc.name}</span>
                    </div>

                    {userRole !== 'viewer' && documents.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${doc.name}?`)) onDeleteDocument(doc.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#6B7280] hover:text-[#EF4444] transition"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
