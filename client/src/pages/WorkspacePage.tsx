import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { YjsWebSocketProvider, PresenceUser, ConnectionStatus } from '../collaboration/yjsProvider';
import { Navbar } from '../components/Navbar';
import { FileExplorer } from '../components/FileExplorer';
import { EditorHeader } from '../components/EditorHeader';
import { CodeEditor } from '../components/CodeEditor';
import { NoteEditor } from '../components/NoteEditor';
import { RightCollabPanel } from '../components/RightCollabPanel';
import { ShareModal } from '../components/ShareModal';
import { CommandPalette } from '../components/CommandPalette';
import { TerminalPanel } from '../components/TerminalPanel';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { AIAssistantModal } from '../components/AIAssistantModal';
import { VoiceHuddle } from '../components/VoiceHuddle';
import { ArchitectureCanvas } from '../components/ArchitectureCanvas';
import { TimeTravelReplay } from '../components/TimeTravelReplay';
import { AISyncBotCollaborator } from '../components/AISyncBotCollaborator';
import { exportWorkspaceAsZip } from '../utils/exportWorkspace';
import { Document } from '../types';
import { Plus, FileCode, FileText } from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const {
    currentWorkspace,
    documents,
    currentDocument,
    members,
    comments,
    fetchWorkspaceById,
    createDocument,
    selectDocument,
    deleteDocument,
    inviteMember,
    removeMember,
    createComment,
    toggleResolveComment,
    deleteComment,
  } = useWorkspaceStore();

  const [provider, setProvider] = useState<YjsWebSocketProvider | null>(null);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [saveStatus, setSaveStatus] = useState<string>('saved');

  // Panels, View & Modals
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [commentLineTarget, setCommentLineTarget] = useState<number>(1);
  const [editorTheme, setEditorTheme] = useState<string>(() => {
    return localStorage.getItem('synccode_editor_theme') || 'vs-dark';
  });

  // 5 Super-Features State
  const [activeViewTab, setActiveViewTab] = useState<'editor' | 'whiteboard'>('editor');
  const [isVoiceHuddleOpen, setIsVoiceHuddleOpen] = useState(false);
  const [isSyncBotOpen, setIsSyncBotOpen] = useState(false);
  const [isTimeTravelOpen, setIsTimeTravelOpen] = useState(false);

  // Fetch workspace
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceById(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceById]);

  // Establish Yjs WebSocket provider when currentDocument changes
  useEffect(() => {
    if (!token || !workspaceId || !currentDocument) return;

    // Cleanup previous provider
    if (provider) {
      provider.destroy();
    }

    const newProvider = new YjsWebSocketProvider({
      token,
      workspaceId,
      documentId: currentDocument.id,
    });

    const unsubStatus = newProvider.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsubPresence = newProvider.onPresenceChange((users) => {
      setPresence(users);
    });

    const unsubSave = newProvider.onSaveStatus((status) => {
      setSaveStatus(status);
    });

    setProvider(newProvider);

    return () => {
      unsubStatus();
      unsubPresence();
      unsubSave();
      newProvider.destroy();
    };
  }, [workspaceId, currentDocument?.id, token]);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+B, Ctrl+/, Ctrl+`, Ctrl+I, Ctrl+H, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsRightPanelOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsAIAssistantOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsVersionHistoryOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsShareOpen(false);
        setIsVersionHistoryOpen(false);
        setIsAIAssistantOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setEditorTheme(newTheme);
    localStorage.setItem('synccode_editor_theme', newTheme);
  };

  const handleExportZip = async () => {
    if (!currentWorkspace) return;
    await exportWorkspaceAsZip(currentWorkspace, documents);
  };

  // Restore content from a historical snapshot
  const handleRestoreContent = async (restoredText: string) => {
    if (provider) {
      const ytext = provider.ydoc.getText('content');
      provider.ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, restoredText);
      });
    }
  };

  // Apply code suggested by AI
  const handleApplyAICode = (suggestedCode: string) => {
    if (provider) {
      const ytext = provider.ydoc.getText('content');
      provider.ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, suggestedCode);
      });
    }
  };

  const userMembership = members.find((m) => m.userId === user?.id);
  const isOwner = currentWorkspace?.ownerId === user?.id;
  const isViewer = !isOwner && userMembership?.role === 'viewer';

  const handleOpenCommentAtLine = (line: number) => {
    setCommentLineTarget(line);
    setIsRightPanelOpen(true);
  };

  const handleCreateQuickFile = async () => {
    if (!workspaceId) return;
    const name = `file_${documents.length + 1}.js`;
    await createDocument(workspaceId, name, 'code', 'javascript');
  };

  const handleCreateQuickNote = async () => {
    if (!workspaceId) return;
    const name = `Note_${documents.length + 1}.md`;
    await createDocument(workspaceId, name, 'note', 'markdown');
  };

  const handleInsertSyncBotCode = (textToInsert: string) => {
    if (!currentDocument || !provider) return;
    try {
      const ytext = provider.ydoc.getText('content');
      ytext.insert(ytext.length, textToInsert);
    } catch (e) {
      console.warn('SyncBot direct Yjs insert:', e);
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col bg-[#080A0F] text-[#F8FAFC] overflow-hidden select-none font-sans ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* 1. Global Top Navigation */}
      {!isFullscreen && (
        <Navbar
          presence={presence}
          connectionStatus={connectionStatus}
          saveStatus={saveStatus}
          onOpenShare={() => setIsShareOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onExportWorkspace={handleExportZip}
          onToggleVoiceHuddle={() => setIsVoiceHuddleOpen(!isVoiceHuddleOpen)}
          isVoiceHuddleOpen={isVoiceHuddleOpen}
        />
      )}

      {/* 2. Main Layout (Sidebar + Editor Area + Right Collab Panel) */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Collapsible File Explorer */}
        {!isFullscreen && (
          <FileExplorer
            documents={documents}
            currentDocument={currentDocument}
            onSelectDocument={selectDocument}
            onCreateDocument={(name, type, lang) => createDocument(workspaceId!, name, type, lang)}
            onDeleteDocument={deleteDocument}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            userRole={isViewer ? 'viewer' : 'editor'}
          />
        )}

        {/* Center Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#080A0F] relative">
          {/* Unified Editor Tab Bar & Compact Toolbar */}
          {documents.length > 0 && (
            <EditorHeader
              documents={documents}
              currentDocument={currentDocument}
              onSelectDocument={selectDocument}
              onCloseTab={(id) => {
                if (currentDocument?.id === id) {
                  const remaining = documents.filter((d) => d.id !== id);
                  if (remaining.length > 0) selectDocument(remaining[0]);
                }
              }}
              saveStatus={saveStatus}
              onRunCode={() => {
                setIsTerminalOpen(true);
              }}
              onToggleComments={() => setIsRightPanelOpen(!isRightPanelOpen)}
              isCommentsOpen={isRightPanelOpen}
              onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
              isTerminalOpen={isTerminalOpen}
              onOpenAIModal={() => setIsAIAssistantOpen(true)}
              onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
              editorTheme={editorTheme}
              onChangeTheme={handleThemeChange}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              activeMode={activeViewTab}
              onChangeMode={(mode) => setActiveViewTab(mode)}
              onOpenSyncBot={() => setIsSyncBotOpen(true)}
              onOpenTimeTravel={() => setIsTimeTravelOpen(!isTimeTravelOpen)}
            />
          )}

          {/* Active Workspace: Architecture Canvas OR Code/Note Editor */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {activeViewTab === 'whiteboard' ? (
              /* Feature 4: Architecture Whiteboard Canvas */
              <ArchitectureCanvas provider={provider} presence={presence} />
            ) : currentDocument ? (
              <div className="flex-1 min-h-0 relative">
                {currentDocument.type === 'code' ? (
                  <CodeEditor
                    key={currentDocument.id}
                    document={currentDocument}
                    provider={provider}
                    presence={presence}
                    onAddCommentAtLine={handleOpenCommentAtLine}
                    readOnly={isViewer}
                    theme={editorTheme}
                  />
                ) : (
                  <NoteEditor
                    key={currentDocument.id}
                    document={currentDocument}
                    provider={provider}
                    readOnly={isViewer}
                  />
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#151A23] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#818CF8] mb-4">
                  <FileCode size={24} />
                </div>
                <h3 className="text-base font-semibold text-[#F8FAFC] mb-1">No documents open</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mb-6">
                  Create a new code file or rich-text note to start collaborating in real time.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCreateQuickFile}
                    className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#7C3AED] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition shadow-sm"
                  >
                    <FileCode size={14} />
                    <span>+ New Code File</span>
                  </button>
                  <button
                    onClick={handleCreateQuickNote}
                    className="flex items-center gap-2 bg-[#151A23] hover:bg-[#1B212D] text-[#F8FAFC] text-xs font-medium px-3.5 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] transition"
                  >
                    <FileText size={14} className="text-[#818CF8]" />
                    <span>+ New Note</span>
                  </button>
                </div>
              </div>
            )}

            {/* Feature 2: Time-Travel Keystroke Replay Slider */}
            {isTimeTravelOpen && currentDocument && (
              <TimeTravelReplay
                documentId={currentDocument.id}
                currentContent={currentDocument.content}
                onApplyContent={handleRestoreContent}
                onClose={() => setIsTimeTravelOpen(false)}
              />
            )}

            {/* Feature 5: VS Code Docked Terminal & Benchmark Arena Panel */}
            <TerminalPanel
              isOpen={isTerminalOpen}
              onClose={() => setIsTerminalOpen(false)}
              workspaceId={workspaceId || ''}
              currentDocument={currentDocument}
            />
          </div>
        </main>

        {/* Right Collaboration Panel (Members, Comments, Chat, Activity) */}
        <RightCollabPanel
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(false)}
          workspaceId={workspaceId}
          members={members}
          presence={presence}
          comments={comments}
          documentName={currentDocument?.name || 'Document'}
          defaultLine={commentLineTarget}
          onAddComment={async (content, line) => {
            if (currentDocument) {
              await createComment(currentDocument.id, content, line);
            }
          }}
          onToggleResolve={toggleResolveComment}
          onDeleteComment={deleteComment}
        />
      </div>

      {/* Feature 3: WebRTC P2P Voice Huddle Floating Dialogue */}
      <VoiceHuddle
        provider={provider}
        presence={presence}
        isOpen={isVoiceHuddleOpen}
        onClose={() => setIsVoiceHuddleOpen(false)}
      />

      {/* Feature 1: AI SyncBot Live Peer Collaborator Modal */}
      {isSyncBotOpen && (
        <AISyncBotCollaborator
          provider={provider}
          isOpen={isSyncBotOpen}
          onClose={() => setIsSyncBotOpen(false)}
          currentCode={currentDocument?.content || ''}
          onInsertCode={handleInsertSyncBotCode}
        />
      )}

      {/* Share Workspace Modal */}
      {isShareOpen && currentWorkspace && (
        <ShareModal
          isOpen={isShareOpen}
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          members={members}
          onInviteMember={(email, role) => inviteMember(currentWorkspace.id, email, role)}
          onRemoveMember={(userId) => removeMember(currentWorkspace.id, userId)}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {/* Version History Modal */}
      {isVersionHistoryOpen && currentDocument && (
        <VersionHistoryModal
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          document={currentDocument}
          onRestoreContent={handleRestoreContent}
        />
      )}

      {/* AI Copilot Assistant Modal */}
      {isAIAssistantOpen && currentDocument && (
        <AIAssistantModal
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          document={currentDocument}
          onApplyCode={handleApplyAICode}
        />
      )}

      {/* Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        documents={documents}
        onSelectDocument={selectDocument}
        onCreateFile={handleCreateQuickFile}
        onCreateNote={handleCreateQuickNote}
        onOpenShare={() => setIsShareOpen(true)}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onToggleComments={() => setIsRightPanelOpen((prev) => !prev)}
        onToggleTerminal={() => setIsTerminalOpen((prev) => !prev)}
      />
    </div>
  );
};
