import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  X, 
  CornerDownLeft, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Cpu,
  Award
} from 'lucide-react';
import { api } from '../utils/api';
import { Document } from '../types';
import { BenchmarkArena } from './BenchmarkArena';

interface TerminalLine {
  id: string;
  type: 'command' | 'stdout' | 'stderr' | 'system' | 'info';
  content: string;
  timestamp?: string;
  exitCode?: number;
  durationMs?: number;
}

interface TerminalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  currentDocument: Document | null;
  onRunCurrentDoc?: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  isOpen,
  onClose,
  workspaceId,
  currentDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'output' | 'problems' | 'benchmarks'>('terminal');
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number>(240); // px
  const [isExpanded, setIsExpanded] = useState(false);

  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      content: 'SyncCode Interactive Cloud Shell v1.0 [Node.js ' + (typeof process !== 'undefined' ? process.version : 'v20') + ' / Python 3.12]',
    },
    {
      id: 'init-2',
      type: 'info',
      content: 'Type "help" for a list of commands, or "run" to execute the active editor document.',
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new output lines arrive
  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, isOpen]);

  // Focus input on panel open or tab change
  useEffect(() => {
    if (isOpen && activeTab === 'terminal') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const appendLine = (line: Omit<TerminalLine, 'id'>) => {
    setLines((prev) => [
      ...prev,
      { ...line, id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` },
    ]);
  };

  const handleClear = () => {
    setLines([]);
  };

  // Execute active Monaco code file directly
  const handleRunActiveFile = async () => {
    if (!currentDocument) {
      appendLine({
        type: 'stderr',
        content: 'Error: No document currently active in Monaco editor.',
      });
      return;
    }

    setActiveTab('terminal');
    setIsRunning(true);

    const lang = currentDocument.language || (currentDocument.name.endsWith('.py') ? 'python' : 'javascript');
    const runnerCmd = lang === 'python' ? `python "${currentDocument.name}"` : `node "${currentDocument.name}"`;

    appendLine({
      type: 'command',
      content: runnerCmd,
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
      const res = await api.post('/terminal/execute', {
        code: currentDocument.content || '',
        language: lang,
        filename: currentDocument.name,
        workspaceId,
      });

      if (res.stdout) {
        appendLine({
          type: 'stdout',
          content: res.stdout,
        });
      }

      if (res.stderr) {
        appendLine({
          type: 'stderr',
          content: res.stderr,
        });
      }

      appendLine({
        type: res.exitCode === 0 ? 'info' : 'stderr',
        content: `Process exited with code ${res.exitCode} (${res.executionTimeMs}ms)`,
        exitCode: res.exitCode,
        durationMs: res.executionTimeMs,
      });
    } catch (err: any) {
      appendLine({
        type: 'stderr',
        content: `Execution failed: ${err.message || 'Unknown network error'}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit interactive terminal command
  const handleSubmitCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Add to history
    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInputVal('');

    // Handle client-side "clear"
    if (cmd === 'clear' || cmd === 'cls') {
      handleClear();
      return;
    }

    // Handle client-side "run"
    if (cmd === 'run') {
      await handleRunActiveFile();
      return;
    }

    appendLine({
      type: 'command',
      content: cmd,
      timestamp: new Date().toLocaleTimeString(),
    });

    setIsRunning(true);

    try {
      const res = await api.post('/terminal/execute', {
        command: cmd,
        workspaceId,
      });

      if (res.stdout) {
        appendLine({
          type: 'stdout',
          content: res.stdout,
        });
      }

      if (res.stderr) {
        appendLine({
          type: 'stderr',
          content: res.stderr,
        });
      }

      if (res.executionTimeMs > 0 && res.exitCode !== 0) {
        appendLine({
          type: 'stderr',
          content: `Command exited with code ${res.exitCode} (${res.executionTimeMs}ms)`,
          exitCode: res.exitCode,
          durationMs: res.executionTimeMs,
        });
      }
    } catch (err: any) {
      appendLine({
        type: 'stderr',
        content: `Error: ${err.message || 'Failed to communicate with execution server'}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Handle Command History (Up / Down arrows)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    }
  };

  return (
    <div 
      style={{ height: isExpanded ? '460px' : `${panelHeight}px` }}
      className="bg-[#0B0D10] border-t border-[#252A33] flex flex-col w-full select-none z-20 font-mono transition-all duration-150 relative shadow-2xl"
    >
      {/* 1. Header Toolbar */}
      <div className="h-8 bg-[#111418] border-b border-[#252A33] px-3 flex items-center justify-between text-xs select-none">
        {/* Left Tabs */}
        <div className="flex items-center gap-1 font-sans">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition ${
              activeTab === 'terminal'
                ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            <TerminalIcon size={12} className="text-[#6366F1]" />
            <span>TERMINAL</span>
          </button>

          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition ${
              activeTab === 'output'
                ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            <Cpu size={12} className="text-[#38BDF8]" />
            <span>OUTPUT</span>
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition ${
              activeTab === 'problems'
                ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            <AlertCircle size={12} className="text-[#F59E0B]" />
            <span>PROBLEMS</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition ${
              activeTab === 'benchmarks'
                ? 'bg-[#171B21] text-[#A5B4FC] font-bold border border-[#6366F1]/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
            }`}
          >
            <Award size={12} className="text-[#6366F1]" />
            <span>BENCHMARK ARENA</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 text-[#9CA3AF]">
          {/* Quick Run Button */}
          {currentDocument && currentDocument.type === 'code' && (
            <button
              onClick={handleRunActiveFile}
              disabled={isRunning}
              className="flex items-center gap-1 bg-[#171B21] hover:bg-[#1D222A] text-[#22C55E] border border-[#252A33] px-2 py-0.5 rounded text-[11px] font-sans font-medium transition disabled:opacity-50"
              title="Run Active File (Ctrl + Enter)"
            >
              <Play size={10} fill="#22C55E" />
              <span>{isRunning ? 'Running...' : `Run ${currentDocument.name}`}</span>
            </button>
          )}

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="p-1 hover:text-[#F5F7FA] hover:bg-[#171B21] rounded transition"
            title="Clear Terminal Output"
          >
            <Trash2 size={12} />
          </button>

          {/* Maximize / Resize Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:text-[#F5F7FA] hover:bg-[#171B21] rounded transition"
            title={isExpanded ? 'Restore Height' : 'Maximize Panel'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="p-1 hover:text-[#EF4444] hover:bg-[#171B21] rounded transition ml-1"
            title="Close Panel (Ctrl + `)"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* 2. Panel Content Body */}
      {activeTab === 'terminal' && (
        <div 
          onClick={() => inputRef.current?.focus()}
          className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed font-mono flex flex-col cursor-text select-text"
        >
          {lines.map((l) => (
            <div key={l.id} className="mb-1 leading-5">
              {l.type === 'command' && (
                <div className="flex items-center gap-2 text-[#818CF8]">
                  <span className="text-[#22C55E] font-bold">synccode@workspace</span>
                  <span className="text-[#9CA3AF]">:</span>
                  <span className="text-[#38BDF8]">~</span>
                  <span className="text-[#F5F7FA]">$</span>
                  <span className="text-[#F5F7FA] font-medium">{l.content}</span>
                  {l.timestamp && (
                    <span className="text-[10px] text-[#6B7280] ml-auto font-sans">{l.timestamp}</span>
                  )}
                </div>
              )}

              {l.type === 'stdout' && (
                <div className="text-[#F5F7FA] whitespace-pre-wrap pl-1">{l.content}</div>
              )}

              {l.type === 'stderr' && (
                <div className="text-[#EF4444] whitespace-pre-wrap pl-1 font-semibold">{l.content}</div>
              )}

              {l.type === 'system' && (
                <div className="text-[#6366F1] font-semibold">{l.content}</div>
              )}

              {l.type === 'info' && (
                <div className="text-[#9CA3AF] italic text-[11px]">{l.content}</div>
              )}
            </div>
          ))}

          {/* Active Command Input Line */}
          <form onSubmit={handleSubmitCommand} className="flex items-center gap-2 mt-1">
            <span className="text-[#22C55E] font-bold">synccode@workspace</span>
            <span className="text-[#9CA3AF]">:</span>
            <span className="text-[#38BDF8]">~</span>
            <span className="text-[#F5F7FA]">$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRunning}
              placeholder={isRunning ? 'Executing process...' : ''}
              className="flex-1 bg-transparent border-none outline-none text-[#F5F7FA] font-mono text-xs placeholder-[#6B7280] focus:ring-0 p-0"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </form>

          <div ref={terminalEndRef} />
        </div>
      )}

      {/* 3. Output Tab (Summary stream) */}
      {activeTab === 'output' && (
        <div className="flex-1 overflow-y-auto p-3 text-xs font-mono text-[#F5F7FA] select-text">
          <div className="text-[#9CA3AF] text-[11px] mb-2 font-sans">
            [SyncCode Execution Stream • Output Log]
          </div>
          {lines
            .filter((l) => l.type === 'stdout' || l.type === 'stderr')
            .map((l) => (
              <div
                key={l.id}
                className={`whitespace-pre-wrap mb-1 ${
                  l.type === 'stderr' ? 'text-[#EF4444]' : 'text-[#F5F7FA]'
                }`}
              >
                {l.content}
              </div>
            ))}
          {lines.filter((l) => l.type === 'stdout' || l.type === 'stderr').length === 0 && (
            <div className="text-[#6B7280] py-6 text-center text-xs font-sans">
              No process output generated yet. Run code from the editor or terminal.
            </div>
          )}
        </div>
      )}

      {/* 4. Problems Tab */}
      {activeTab === 'problems' && (
        <div className="flex-1 overflow-y-auto p-3 text-xs font-sans text-[#9CA3AF]">
          <div className="flex items-center gap-2 text-[#22C55E] mb-2 font-medium">
            <CheckCircle size={14} />
            <span>No compiler or linting issues detected in workspace files.</span>
          </div>
          <div className="text-[11px] text-[#6B7280]">
            Monaco real-time language server diagnostics active for JavaScript, TypeScript, and Python.
          </div>
        </div>
      )}

      {/* 5. Benchmark Arena Tab (Feature 5) */}
      {activeTab === 'benchmarks' && (
        <div className="flex-1 overflow-hidden">
          <BenchmarkArena
            currentCode={currentDocument?.content || ''}
            language={currentDocument?.language || 'python'}
          />
        </div>
      )}
    </div>
  );
};
