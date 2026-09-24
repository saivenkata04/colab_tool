import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as Y from 'yjs';
import { YjsWebSocketProvider, PresenceUser } from '../collaboration/yjsProvider';
import { Document } from '../types';
import { Play, Terminal, MessageSquarePlus } from 'lucide-react';

interface CodeEditorProps {
  document: Document;
  provider: YjsWebSocketProvider | null;
  presence: PresenceUser[];
  onAddCommentAtLine?: (line: number) => void;
  readOnly?: boolean;
  theme?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  document,
  provider,
  presence,
  onAddCommentAtLine,
  readOnly = false,
  theme = 'vs-dark',
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const isSettingRemoteValue = useRef(false);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [output, setOutput] = useState<string | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // Setup Monaco mounting & Yjs CRDT listeners
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom SyncCode theme
    monaco.editor.defineTheme('synccode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818CF8' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'F59E0B' },
      ],
      colors: {
        'editor.background': '#0B0D10',
        'editor.lineHighlightBackground': '#171B21',
        'editorLineNumber.foreground': '#4B5563',
        'editorLineNumber.activeForeground': '#818CF8',
      },
    });

    // Track local cursor movement to broadcast awareness
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
      if (provider) {
        provider.sendCursor({
          line: e.position.lineNumber,
          column: e.position.column,
        });
      }
    });

    // Add context menu action to comment on line
    editor.addAction({
      id: 'add-comment-action',
      label: 'Add Comment to this line',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (ed: any) => {
        const line = ed.getPosition()?.lineNumber || 1;
        if (onAddCommentAtLine) onAddCommentAtLine(line);
      },
    });

    // Sync initial content from Y.Text into Monaco
    if (provider) {
      const ytext = provider.ydoc.getText('content');
      editor.setValue(ytext.toString() || document.content || '');

      // Listen for local editor changes and apply incremental delta to Yjs
      editor.onDidChangeModelContent((event: any) => {
        if (isSettingRemoteValue.current) return;

        // Apply incremental changes to Y.Text
        provider.ydoc.transact(() => {
          for (let i = event.changes.length - 1; i >= 0; i--) {
            const change = event.changes[i];
            ytext.delete(change.rangeOffset, change.rangeLength);
            ytext.insert(change.rangeOffset, change.text);
          }
        });
      });

      // Listen for remote Yjs updates and apply incrementally to Monaco
      ytext.observe(() => {
        const currentText = editor.getValue();
        const yTextStr = ytext.toString();
        if (currentText !== yTextStr) {
          isSettingRemoteValue.current = true;
          const pos = editor.getPosition();
          editor.setValue(yTextStr);
          if (pos) editor.setPosition(pos);
          isSettingRemoteValue.current = false;
        }
      });
    }
  };

  // Render collaborator remote cursors in Monaco
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const newDecorations: any[] = [];

    presence.forEach((peer) => {
      if (peer.cursor && peer.cursor.line) {
        newDecorations.push({
          range: new monaco.Range(
            peer.cursor.line,
            peer.cursor.column,
            peer.cursor.line,
            peer.cursor.column + 1
          ),
          options: {
            className: 'yRemoteSelectionHead',
            hoverMessage: { value: `**${peer.name}** is editing here` },
          },
        });
      }
    });

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [presence]);

  // Execute JavaScript / Algorithm run logic
  const handleRunCode = () => {
    if (!editorRef.current) return;
    setIsConsoleOpen(true);
    const code = editorRef.current.getValue();
    const logs: string[] = [];

    const originalLog = console.log;
    try {
      console.log = (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        originalLog.apply(console, args);
      };

      const result = new Function(code)();
      if (result !== undefined) {
        logs.push(`↳ Return Value: ${JSON.stringify(result)}`);
      }
      if (logs.length === 0) {
        logs.push('✓ Executed successfully with no console output.');
      }
      setOutput(logs.join('\n'));
    } catch (err: any) {
      setOutput(`Runtime Error: ${err.message}`);
    } finally {
      console.log = originalLog;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0B0D10] relative">


      {/* Monaco Container */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={document.language || 'javascript'}
          theme={theme || 'vs-dark'}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
            minimap: { enabled: true },
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {/* Editor Status Bar */}
      <div className="h-6 bg-[#0B0D10] border-t border-[#252A33] px-3 flex items-center justify-between text-[11px] text-[#9CA3AF] select-none font-mono">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsConsoleOpen(!isConsoleOpen)} 
            className="hover:text-[#F5F7FA] flex items-center gap-1 transition"
          >
            <Terminal size={12} />
            <span>Console</span>
          </button>
          <span className="text-[#22C55E]">● CRDT Synced</span>
        </div>
      </div>

      {/* Collapsible Console Output */}
      {isConsoleOpen && (
        <div className="h-44 bg-[#0B0D10] border-t border-[#252A33] flex flex-col font-mono text-xs z-20">
          <div className="h-7 bg-[#111418] border-b border-[#252A33] px-3 flex items-center justify-between text-[#9CA3AF]">
            <span className="font-semibold text-[11px]">CONSOLE OUTPUT</span>
            <button
              onClick={() => setIsConsoleOpen(false)}
              className="text-[#9CA3AF] hover:text-[#F5F7FA] text-xs"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto whitespace-pre-wrap text-[#F5F7FA]">
            {output || 'No output. Click "Run" or press Ctrl+Enter to execute.'}
          </div>
        </div>
      )}
    </div>
  );
};
