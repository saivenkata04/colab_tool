import React, { useState } from 'react';
import { 
  FileCode, 
  FileText, 
  X, 
  Play, 
  Search, 
  Maximize2, 
  Minimize2, 
  MessageSquare,
  Sparkles,
  Terminal,
  Clock,
  Palette,
  Layers,
  Bot,
  RotateCcw
} from 'lucide-react';
import { Document } from '../types';

interface EditorHeaderProps {
  documents: Document[];
  currentDocument: Document | null;
  onSelectDocument: (doc: Document) => void;
  onCloseTab?: (id: string) => void;
  saveStatus: string;
  onRunCode?: () => void;
  onToggleComments: () => void;
  isCommentsOpen: boolean;
  onToggleTerminal?: () => void;
  isTerminalOpen?: boolean;
  onOpenAIModal?: () => void;
  onOpenVersionHistory?: () => void;
  editorTheme?: string;
  onChangeTheme?: (theme: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenCommandPalette: () => void;
  activeMode?: 'editor' | 'whiteboard';
  onChangeMode?: (mode: 'editor' | 'whiteboard') => void;
  onOpenSyncBot?: () => void;
  onOpenTimeTravel?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  documents,
  currentDocument,
  onSelectDocument,
  onCloseTab,
  saveStatus,
  onRunCode,
  onToggleComments,
  isCommentsOpen,
  onToggleTerminal,
  isTerminalOpen,
  onOpenAIModal,
  onOpenVersionHistory,
  editorTheme = 'vs-dark',
  onChangeTheme,
  isFullscreen,
  onToggleFullscreen,
  onOpenCommandPalette,
  activeMode = 'editor',
  onChangeMode,
  onOpenSyncBot,
  onOpenTimeTravel,
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const themes = [
    { id: 'vs-dark', label: 'VS Code Dark' },
    { id: 'synccode-dark', label: 'SyncCode Charcoal' },
    { id: 'hc-black', label: 'High Contrast' },
    { id: 'vs', label: 'Clean Light' },
  ];

  return (
    <div className="flex flex-col select-none border-b border-[#252A33] bg-[#0B0D10] shrink-0 font-sans">
      {/* 1. Tab Bar */}
      <div className="h-9 flex items-center overflow-x-auto border-b border-[#252A33]">
        {documents.map((doc) => {
          const isActive = doc.id === currentDocument?.id;
          const isNote = doc.type === 'note';

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className={`h-full flex items-center gap-2 px-3.5 border-r border-[#252A33] cursor-pointer text-xs transition-colors duration-100 shrink-0 ${
                isActive
                  ? 'bg-[#111418] text-[#F5F7FA] font-medium border-t-2 border-t-[#6366F1]'
                  : 'text-[#9CA3AF] hover:bg-[#171B21]/50 hover:text-[#F5F7FA] border-t-2 border-t-transparent'
              }`}
            >
              {isNote ? (
                <FileText size={13} className="text-[#818CF8]" />
              ) : (
                <FileCode size={13} className="text-[#38BDF8]" />
              )}

              <span className="font-mono text-[12px]">{doc.name}</span>

              {/* Saved status dot */}
              {isActive && (
                <span className="text-[10px]">
                  {saveStatus === 'saved' ? (
                    <span className="text-[#22C55E]">✓</span>
                  ) : (
                    <span className="text-[#F59E0B] animate-pulse">●</span>
                  )}
                </span>
              )}

              {documents.length > 1 && onCloseTab && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(doc.id);
                  }}
                  className="p-0.5 rounded text-[#6B7280] hover:text-[#EF4444] hover:bg-white/5 ml-1"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}

        {/* Feature 4: Architecture Whiteboard Tab Button */}
        {onChangeMode && (
          <div
            onClick={() => onChangeMode(activeMode === 'whiteboard' ? 'editor' : 'whiteboard')}
            className={`h-full flex items-center gap-2 px-3.5 border-r border-[#222634] cursor-pointer text-xs transition-colors duration-100 shrink-0 ${
              activeMode === 'whiteboard'
                ? 'bg-[#12151C] text-[#F8FAFC] font-medium border-t-2 border-t-[#8B5CF6] shadow-sm'
                : 'text-[#94A3B8] hover:bg-[#181C26]/60 hover:text-[#F8FAFC] border-t-2 border-t-transparent'
            }`}
          >
            <Layers size={13} className="text-[#8B5CF6]" />
            <span className="font-mono text-[12px]">Architecture Whiteboard</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          </div>
        )}
      </div>

      {/* 2. Compact Editor Toolbar */}
      <div className="h-8 bg-[#111418] px-3.5 flex items-center justify-between text-xs text-[#9CA3AF]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#F5F7FA]">
            {activeMode === 'whiteboard' ? 'System Architecture Whiteboard' : currentDocument?.name}
          </span>
          <span className="text-[#252A33]">|</span>
          <span className="font-mono text-[11px] text-[#818CF8] uppercase">
            {activeMode === 'whiteboard' ? 'CANVAS' : currentDocument?.language || 'TEXT'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Feature 1: SyncBot AI Live Peer Trigger */}
          {onOpenSyncBot && (
            <button
              onClick={onOpenSyncBot}
              className="flex items-center gap-1.5 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#A5B4FC] border border-[#8B5CF6]/40 px-2 py-0.5 rounded text-[11px] font-medium transition shadow-[0_0_12px_rgba(139,92,246,0.2)]"
              title="Summon SyncBot (AI Live Peer Collaborator)"
            >
              <Bot size={12} className="text-[#8B5CF6]" />
              <span>SyncBot AI</span>
            </button>
          )}

          {/* Feature 2: Time-Travel Replay Trigger */}
          {onOpenTimeTravel && (
            <button
              onClick={onOpenTimeTravel}
              className="flex items-center gap-1 bg-[#181C26] hover:bg-[#1E2330] text-[#9CA3AF] hover:text-[#F5F7FA] border border-[#222634] px-2 py-0.5 rounded text-[11px] font-medium transition"
              title="Time-Travel Keystroke Replay Slider"
            >
              <RotateCcw size={11} className="text-[#38BDF8]" />
              <span className="hidden sm:inline">Replay</span>
            </button>
          )}

          {/* Run Code Button */}
          {currentDocument?.type === 'code' && onRunCode && (
            <button
              onClick={onRunCode}
              className="flex items-center gap-1.5 bg-[#171B21] hover:bg-[#1D222A] text-[#22C55E] border border-[#252A33] px-2 py-0.5 rounded text-[11px] font-medium transition"
              title="Run Code (Ctrl + Enter)"
            >
              <Play size={11} fill="#22C55E" />
              <span>Run</span>
            </button>
          )}

          {/* AI Assistant Trigger */}
          {onOpenAIModal && (
            <button
              onClick={onOpenAIModal}
              className="flex items-center gap-1 bg-[#6366F1]/15 hover:bg-[#6366F1]/25 text-[#818CF8] border border-[#6366F1]/30 px-2 py-0.5 rounded text-[11px] font-medium transition"
              title="AI Copilot Assistant (Ctrl + I)"
            >
              <Sparkles size={11} />
              <span>AI Copilot</span>
            </button>
          )}

          {/* Version History Trigger */}
          {onOpenVersionHistory && (
            <button
              onClick={onOpenVersionHistory}
              className="p-1 hover:bg-[#171B21] rounded text-[#9CA3AF] hover:text-[#F5F7FA] transition"
              title="Document Version History & Checkpoints"
            >
              <Clock size={13} />
            </button>
          )}

          {/* Theme Switcher Trigger */}
          {onChangeTheme && (
            <div className="relative">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-1 hover:bg-[#171B21] rounded text-[#9CA3AF] hover:text-[#F5F7FA] transition"
                title="Monaco Pro Theme"
              >
                <Palette size={13} />
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-[#171B21] border border-[#252A33] rounded-lg shadow-modal py-1 z-50">
                  <div className="text-[10px] uppercase font-semibold text-[#6B7280] px-3 py-1">
                    Theme
                  </div>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChangeTheme(t.id);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition ${
                        editorTheme === t.id
                          ? 'bg-[#6366F1]/15 text-[#818CF8] font-medium'
                          : 'text-[#9CA3AF] hover:bg-[#111418] hover:text-[#F5F7FA]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="p-1 hover:bg-[#171B21] rounded text-[#9CA3AF] hover:text-[#F5F7FA]"
            title="Search (Ctrl + K)"
          >
            <Search size={13} />
          </button>

          {/* Comments Panel Trigger */}
          <button
            onClick={onToggleComments}
            className={`p-1 rounded transition ${
              isCommentsOpen ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'hover:bg-[#171B21] text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
            title="Toggle Comments"
          >
            <MessageSquare size={13} />
          </button>

          {/* Terminal Toggle Button */}
          {onToggleTerminal && (
            <button
              onClick={onToggleTerminal}
              className={`p-1 rounded transition ${
                isTerminalOpen ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'hover:bg-[#171B21] text-[#9CA3AF] hover:text-[#F5F7FA]'
              }`}
              title="Toggle Terminal (Ctrl + `)"
            >
              <Terminal size={13} />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-1 hover:bg-[#171B21] rounded text-[#9CA3AF] hover:text-[#F5F7FA]"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};
