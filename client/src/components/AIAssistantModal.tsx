import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Play, 
  Check, 
  Copy, 
  HelpCircle, 
  Zap, 
  ShieldAlert, 
  TestTube,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { api } from '../utils/api';
import { Document } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onApplyCode?: (code: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  document,
  onApplyCode,
}) => {
  const [activeTab, setActiveTab] = useState<'explain' | 'optimize' | 'generate_tests' | 'refactor'>('explain');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    explanation: string;
    suggestedCode?: string | null;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !document) return null;

  const handleRunAI = async (action: 'explain' | 'optimize' | 'generate_tests' | 'refactor') => {
    setActiveTab(action);
    setIsLoading(true);
    setResult(null);

    try {
      const res = await api.post('/ai/assist', {
        action,
        code: document.content || '',
        language: document.language || 'javascript',
      });
      setResult(res);
    } catch (err: any) {
      setResult({
        explanation: `Error during AI processing: ${err.message || 'Server error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl h-[560px] bg-[#111418] border border-[#252A33] rounded-xl shadow-modal overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-12 border-b border-[#252A33] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <span className="font-semibold text-sm text-[#F5F7FA]">
              SyncCode AI Copilot & Code Assistant
            </span>
            <span className="text-xs text-[#9CA3AF]">
              • {document.name}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#9CA3AF] hover:text-[#F5F7FA] rounded hover:bg-[#171B21] transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Action Tabs */}
        <div className="h-10 border-b border-[#252A33] px-4 flex items-center gap-2 bg-[#0B0D10]">
          <button
            onClick={() => handleRunAI('explain')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'explain'
                ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            <HelpCircle size={13} className="text-[#38BDF8]" />
            <span>Explain Code</span>
          </button>

          <button
            onClick={() => handleRunAI('optimize')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'optimize'
                ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            <Zap size={13} className="text-[#F59E0B]" />
            <span>Find Bugs & Optimize</span>
          </button>

          <button
            onClick={() => handleRunAI('generate_tests')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'generate_tests'
                ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            <TestTube size={13} className="text-[#22C55E]" />
            <span>Generate Tests</span>
          </button>

          <button
            onClick={() => handleRunAI('refactor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition ${
              activeTab === 'refactor'
                ? 'bg-[#171B21] text-[#F5F7FA] font-medium'
                : 'text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
          >
            <Sparkles size={13} className="text-[#818CF8]" />
            <span>Clean Refactor</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
              <div className="text-xs text-[#9CA3AF]">
                Analyzing {document.name} with AI engine...
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Explanation Box */}
              <div className="p-4 rounded-xl bg-[#171B21] border border-[#252A33] text-xs text-[#F5F7FA] whitespace-pre-wrap leading-relaxed">
                {result.explanation}
              </div>

              {/* Suggested Code Box */}
              {result.suggestedCode && (
                <div className="rounded-xl border border-[#252A33] bg-[#0B0D10] overflow-hidden">
                  <div className="h-8 bg-[#171B21] px-3 flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span className="font-mono text-[11px] text-[#818CF8]">SUGGESTED CODE</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(result.suggestedCode!)}
                        className="flex items-center gap-1 hover:text-[#F5F7FA] transition"
                      >
                        {isCopied ? <Check size={12} className="text-[#22C55E]" /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {onApplyCode && (
                        <button
                          onClick={() => {
                            onApplyCode(result.suggestedCode!);
                            onClose();
                          }}
                          className="flex items-center gap-1 bg-[#22C55E] hover:bg-[#16A34A] text-white px-2 py-0.5 rounded text-[11px] font-medium transition"
                        >
                          <ArrowRight size={12} />
                          <span>Apply to Editor</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <pre className="p-4 font-mono text-xs text-[#F5F7FA] overflow-x-auto leading-relaxed select-text">
                    {result.suggestedCode}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-12 h-12 rounded-xl bg-[#171B21] border border-[#252A33] flex items-center justify-center text-[#818CF8]">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F5F7FA]">AI Code Intelligence</h4>
                <p className="text-xs text-[#9CA3AF] max-w-sm mt-1">
                  Select an action above to analyze code, find performance bottlenecks, or auto-generate unit tests for {document.name}.
                </p>
              </div>
              <button
                onClick={() => handleRunAI('explain')}
                className="bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                Start Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
