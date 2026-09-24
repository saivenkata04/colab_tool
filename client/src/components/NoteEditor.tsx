import React, { useState, useEffect, useRef } from 'react';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  Columns, 
  Edit3, 
  Eye, 
  Clock, 
  FileText 
} from 'lucide-react';
import { YjsWebSocketProvider } from '../collaboration/yjsProvider';
import { Document } from '../types';

interface NoteEditorProps {
  document: Document;
  provider: YjsWebSocketProvider | null;
  readOnly?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  document,
  provider,
  readOnly = false,
}) => {
  const [content, setContent] = useState(document.content || '');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSettingRemoteValue = useRef(false);

  // Bind with Y.Doc
  useEffect(() => {
    if (!provider) return;
    const ytext = provider.ydoc.getText('content');
    const initialText = ytext.toString() || document.content || '';
    setContent(initialText);

    const observer = () => {
      const current = ytext.toString();
      isSettingRemoteValue.current = true;
      setContent(current);
      setTimeout(() => {
        isSettingRemoteValue.current = false;
      }, 20);
    };

    ytext.observe(observer);
    return () => {
      ytext.unobserve(observer);
    };
  }, [provider, document.id]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (provider && !isSettingRemoteValue.current) {
      const ytext = provider.ydoc.getText('content');
      provider.ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, val);
      });
    }
  };

  const insertFormat = (prefix: string, suffix: string = '') => {
    if (readOnly) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);

    const newText = before + prefix + selected + suffix + after;
    setContent(newText);

    if (provider) {
      const ytext = provider.ydoc.getText('content');
      provider.ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, newText);
      });
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 0);
  };

  // Basic markdown parser for live preview
  const renderMarkdown = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n');
    let html = '';
    let inCodeBlock = false;
    let codeContent: string[] = [];

    lines.forEach((line) => {
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          html += `<pre class="bg-dark-900 border border-white/10 p-3 rounded-lg text-primary-300 font-mono text-xs my-2 overflow-x-auto"><code>${codeContent.join('\n')}</code></pre>`;
          codeContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        return;
      }

      if (line.match(/^-\s*\[([ xX])\]\s*(.+)/)) {
        const checked = line.includes('[x]') || line.includes('[X]');
        const taskText = line.replace(/^-\s*\[([ xX])\]\s*/, '');
        html += `<div class="flex items-center gap-2 my-1 text-sm">
          <input type="checkbox" ${checked ? 'checked' : ''} disabled class="rounded accent-purple-500" />
          <span class="${checked ? 'line-through text-gray-500' : 'text-gray-200'}">${taskText}</span>
        </div>`;
        return;
      }

      if (line.startsWith('# ')) {
        html += `<h1 class="text-2xl font-bold text-white mb-2 pb-1 border-b border-white/10">${line.slice(2)}</h1>`;
        return;
      }
      if (line.startsWith('## ')) {
        html += `<h2 class="text-xl font-bold text-gray-100 mt-4 mb-2">${line.slice(3)}</h2>`;
        return;
      }
      if (line.startsWith('### ')) {
        html += `<h3 class="text-lg font-semibold text-gray-200 mt-3 mb-1">${line.slice(4)}</h3>`;
        return;
      }
      if (line.startsWith('> ')) {
        html += `<blockquote class="border-l-4 border-purple-500 pl-3 py-1 my-2 bg-purple-500/10 rounded-r text-purple-200 italic">${line.slice(2)}</blockquote>`;
        return;
      }
      if (line.trim() === '---') {
        html += `<hr class="border-white/10 my-4" />`;
        return;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        html += `<li class="ml-4 list-disc text-gray-300 text-sm my-0.5">${line.slice(2)}</li>`;
        return;
      }
      if (!line.trim()) {
        html += `<div class="h-3"></div>`;
        return;
      }

      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-dark-900 px-1 py-0.5 rounded text-purple-300 font-mono text-xs">$1</code>');

      html += `<p class="text-sm text-gray-300 leading-relaxed mb-2">${formatted}</p>`;
    });

    return html;
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;

  return (
    <div className="h-full w-full flex flex-col bg-[#0f111a]">
      {/* Rich Note Toolbar */}
      <div className="h-10 bg-dark-800 border-b border-white/10 px-3 flex items-center justify-between text-xs text-gray-400 select-none flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => insertFormat('# ')}
            className="p-1 hover:bg-white/10 rounded"
            title="Heading 1"
          >
            <Heading1 size={15} />
          </button>
          <button
            onClick={() => insertFormat('## ')}
            className="p-1 hover:bg-white/10 rounded"
            title="Heading 2"
          >
            <Heading2 size={15} />
          </button>
          <button
            onClick={() => insertFormat('### ')}
            className="p-1 hover:bg-white/10 rounded"
            title="Heading 3"
          >
            <Heading3 size={15} />
          </button>

          <span className="text-gray-700 mx-1">|</span>

          <button
            onClick={() => insertFormat('**', '**')}
            className="p-1 hover:bg-white/10 rounded"
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => insertFormat('*', '*')}
            className="p-1 hover:bg-white/10 rounded"
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => insertFormat('`', '`')}
            className="p-1 hover:bg-white/10 rounded"
            title="Inline Code"
          >
            <Code size={14} />
          </button>

          <span className="text-gray-700 mx-1">|</span>

          <button
            onClick={() => insertFormat('- ')}
            className="p-1 hover:bg-white/10 rounded"
            title="Bullet List"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => insertFormat('1. ')}
            className="p-1 hover:bg-white/10 rounded"
            title="Numbered List"
          >
            <ListOrdered size={15} />
          </button>
          <button
            onClick={() => insertFormat('- [ ] ')}
            className="p-1 hover:bg-white/10 rounded"
            title="Checklist"
          >
            <CheckSquare size={14} />
          </button>
          <button
            onClick={() => insertFormat('> ')}
            className="p-1 hover:bg-white/10 rounded"
            title="Quote"
          >
            <Quote size={14} />
          </button>
          <button
            onClick={() => insertFormat('\n```\n', '\n```\n')}
            className="p-1 hover:bg-white/10 rounded"
            title="Code Block"
          >
            <Code size={14} />
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('edit')}
            className={`p-1 rounded ${viewMode === 'edit' ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-white/10 text-gray-400'}`}
            title="Edit Only"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1 rounded ${viewMode === 'split' ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-white/10 text-gray-400'}`}
            title="Split View"
          >
            <Columns size={14} />
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`p-1 rounded ${viewMode === 'preview' ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-white/10 text-gray-400'}`}
            title="Preview Only"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>

      {/* Editor & Preview Panes */}
      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'split' || viewMode === 'edit') && (
          <textarea
            ref={textareaRef}
            readOnly={readOnly}
            value={content}
            onChange={handleTextChange}
            placeholder="Write collaborative notes, meeting agendas, and markdown docs..."
            className="flex-1 bg-transparent text-gray-100 p-8 outline-none resize-none leading-relaxed text-sm font-sans overflow-y-auto"
          />
        )}

        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            className="flex-1 p-8 bg-[#0a0c13] border-l border-white/5 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
      </div>

      {/* Status Footer */}
      <div className="h-6 bg-dark-900 border-t border-white/5 px-3 flex items-center justify-between text-[11px] text-gray-400 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileText size={12} /> {words} words • {chars} characters
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> ~{Math.ceil(words / 200)} min read
          </span>
        </div>
        <div className="text-purple-400">
          ● Yjs Collaborative Note Mode
        </div>
      </div>
    </div>
  );
};
