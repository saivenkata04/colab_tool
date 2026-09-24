import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Moon, Sun, Monitor, Code } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [theme, setTheme] = useState('dark');
  const [tabSize, setTabSize] = useState('2');
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(true);

  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-dark-800 border border-white/10 rounded-2xl p-8 shadow-2xl relative">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Application Settings</h1>
            <p className="text-xs text-gray-400">Configure your IDE and collaboration preferences</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Theme */}
          <div className="bg-dark-900 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-gray-300 font-medium">Editor Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-dark-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-200 outline-none"
            >
              <option value="dark">Slate Dark (Default)</option>
              <option value="vs-dark">VS Dark</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          {/* Tab size */}
          <div className="bg-dark-900 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-gray-300 font-medium">Tab Size</span>
            <select
              value={tabSize}
              onChange={(e) => setTabSize(e.target.value)}
              className="bg-dark-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-200 outline-none"
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
            </select>
          </div>

          {/* Word wrap */}
          <div className="bg-dark-900 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-gray-300 font-medium">Word Wrap</span>
            <button
              onClick={() => setWordWrap(!wordWrap)}
              className={`w-10 h-5 rounded-full transition relative ${wordWrap ? 'bg-primary-600' : 'bg-dark-700'}`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                  wordWrap ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Minimap */}
          <div className="bg-dark-900 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-gray-300 font-medium">Show Minimap</span>
            <button
              onClick={() => setMinimap(!minimap)}
              className={`w-10 h-5 rounded-full transition relative ${minimap ? 'bg-primary-600' : 'bg-dark-700'}`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                  minimap ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
