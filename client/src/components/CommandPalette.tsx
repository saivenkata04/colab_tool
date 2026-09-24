import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileCode, 
  FileText, 
  UserPlus, 
  PanelLeft, 
  MessageSquare, 
  Play, 
  Copy, 
  X,
  Keyboard,
  ArrowRight
} from 'lucide-react';
import { Document } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
  onCreateFile: () => void;
  onCreateNote: () => void;
  onOpenShare: () => void;
  onToggleSidebar: () => void;
  onToggleComments: () => void;
  onToggleTerminal?: () => void;
  onRunCode?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  documents,
  onSelectDocument,
  onCreateFile,
  onCreateNote,
  onOpenShare,
  onToggleSidebar,
  onToggleComments,
  onToggleTerminal,
  onRunCode,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultActions: CommandItem[] = [
    {
      id: 'create-file',
      title: 'Create New Code File',
      category: 'Actions',
      icon: <FileCode size={15} className="text-[#38BDF8]" />,
      shortcut: 'Alt + N',
      action: () => { onClose(); onCreateFile(); },
    },
    {
      id: 'create-note',
      title: 'Create New Rich Note',
      category: 'Actions',
      icon: <FileText size={15} className="text-[#818CF8]" />,
      action: () => { onClose(); onCreateNote(); },
    },
    {
      id: 'share-workspace',
      title: 'Invite Collaborator to Workspace',
      category: 'Collaboration',
      icon: <UserPlus size={15} className="text-[#22C55E]" />,
      action: () => { onClose(); onOpenShare(); },
    },
    {
      id: 'toggle-sidebar',
      title: 'Toggle Left Explorer Sidebar',
      category: 'View',
      icon: <PanelLeft size={15} className="text-[#9CA3AF]" />,
      shortcut: 'Ctrl + B',
      action: () => { onClose(); onToggleSidebar(); },
    },
    {
      id: 'toggle-comments',
      title: 'Toggle Comments Panel',
      category: 'View',
      icon: <MessageSquare size={15} className="text-[#9CA3AF]" />,
      action: () => { onClose(); onToggleComments(); },
    },
    ...(onToggleTerminal ? [{
      id: 'toggle-terminal',
      title: 'Toggle Integrated Terminal',
      category: 'View',
      icon: <Keyboard size={15} className="text-[#6366F1]" />,
      shortcut: 'Ctrl + `',
      action: () => { onClose(); onToggleTerminal(); },
    }] : []),
    ...(onRunCode ? [{
      id: 'run-code',
      title: 'Execute Active Code',
      category: 'Editor',
      icon: <Play size={15} className="text-[#22C55E]" />,
      shortcut: 'Ctrl + Enter',
      action: () => { onClose(); onRunCode(); },
    }] : []),
  ];

  // Map documents to command items
  const docActions: CommandItem[] = documents.map((doc) => ({
    id: `doc-${doc.id}`,
    title: `Open ${doc.name}`,
    category: 'Files',
    icon: doc.type === 'note' ? <FileText size={15} className="text-[#818CF8]" /> : <FileCode size={15} className="text-[#38BDF8]" />,
    action: () => { onClose(); onSelectDocument(doc); },
  }));

  const allItems: CommandItem[] = [...defaultActions, ...docActions];
  const filtered = allItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-start justify-center pt-24 px-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#111418] border border-[#252A33] rounded-xl shadow-modal overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="h-12 border-b border-[#252A33] px-3.5 flex items-center gap-3">
          <Search size={16} className="text-[#9CA3AF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search files..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-xs text-[#F5F7FA] placeholder-[#9CA3AF] outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-[#171B21] border border-[#252A33] text-[10px] text-[#9CA3AF] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9CA3AF]">
              No commands found for "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? 'bg-[#171B21] text-[#F5F7FA]'
                      : 'text-[#9CA3AF] hover:bg-[#171B21]/60 hover:text-[#F5F7FA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span className="font-medium text-[#F5F7FA]">{item.title}</span>
                    <span className="text-[10px] text-[#6B7280] font-normal uppercase tracking-wider ml-1">
                      {item.category}
                    </span>
                  </div>

                  {item.shortcut ? (
                    <kbd className="px-1.5 py-0.5 rounded bg-[#111418] border border-[#252A33] text-[10px] text-[#9CA3AF] font-mono">
                      {item.shortcut}
                    </kbd>
                  ) : isSelected ? (
                    <ArrowRight size={13} className="text-[#6366F1]" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="h-8 bg-[#171B21] border-t border-[#252A33] px-3.5 flex items-center justify-between text-[11px] text-[#9CA3AF]">
          <span>Use ↑ and ↓ to navigate</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
