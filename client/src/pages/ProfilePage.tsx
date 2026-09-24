import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-dark-800 border border-white/10 rounded-2xl p-8 shadow-2xl relative">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-primary-500/20">
            {(user?.name || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{user?.name}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Mail size={12} /> {user?.email}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-dark-900 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" /> Account Status
            </span>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Active / Verified
            </span>
          </div>

          <div className="bg-dark-900 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-2">
              <Calendar size={14} className="text-primary-400" /> Member Since
            </span>
            <span className="text-gray-200 font-mono">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'September 2026'}
            </span>
          </div>

          <div className="bg-dark-900 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" /> User ID
            </span>
            <span className="text-gray-400 font-mono text-[11px] truncate max-w-[200px]">
              {user?.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
