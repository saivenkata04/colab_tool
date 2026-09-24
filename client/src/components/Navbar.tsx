import React, { useState } from 'react';
import { 
  Share2, 
  Check, 
  Wifi, 
  WifiOff, 
  LogOut, 
  User as UserIcon, 
  Settings, 
  ChevronRight,
  Command,
  Activity,
  Download,
  Radio
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { PresenceUser, ConnectionStatus } from '../collaboration/yjsProvider';
import { BrandLogo } from './BrandLogo';
import { Link } from 'react-router-dom';

interface NavbarProps {
  presence: PresenceUser[];
  connectionStatus: ConnectionStatus;
  saveStatus: string;
  onOpenShare: () => void;
  onOpenCommandPalette: () => void;
  onExportWorkspace?: () => void;
  onToggleVoiceHuddle?: () => void;
  isVoiceHuddleOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  presence,
  connectionStatus,
  saveStatus,
  onOpenShare,
  onOpenCommandPalette,
  onExportWorkspace,
  onToggleVoiceHuddle,
  isVoiceHuddleOpen = false,
}) => {
  const { user, logout } = useAuthStore();
  const { currentWorkspace, currentDocument } = useWorkspaceStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [connectionPopoverOpen, setConnectionPopoverOpen] = useState(false);

  return (
    <header className="h-12 bg-[#12151C] border-b border-[#222634] px-3.5 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Brand & Breadcrumbs */}
      <div className="flex items-center gap-2.5">
        <Link to="/dashboard" className="hover:opacity-90 transition">
          <BrandLogo size="sm" showText={true} />
        </Link>

        <span className="text-[#64748B] text-xs">/</span>

        <Link
          to="/dashboard"
          className="text-xs text-[#9CA3AF] hover:text-[#F5F7FA] font-medium transition truncate max-w-[140px]"
        >
          {currentWorkspace?.name || 'Workspace'}
        </Link>

        {currentDocument && (
          <>
            <span className="text-[#64748B] text-xs">/</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#181C26] border border-[#222634] text-xs font-mono text-[#F5F7FA]">
              <span>{currentDocument.name}</span>
              {saveStatus === 'saved' ? (
                <span className="text-[#10B981] text-[10px]" title="Saved">✓</span>
              ) : (
                <span className="text-[#F59E0B] text-[10px] animate-pulse" title="Saving...">●</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2 bg-[#181C26] hover:bg-[#1E2330] border border-[#222634] px-3 py-1 rounded-md text-xs text-[#9CA3AF] hover:text-[#F5F7FA] transition"
        title="Command Palette (Ctrl + K)"
      >
        <Command size={12} className="text-[#64748B]" />
        <span>Search or jump to...</span>
        <kbd className="px-1 py-0.2 rounded bg-[#12151C] border border-[#222634] text-[10px] font-mono">
          Ctrl K
        </kbd>
      </button>

      {/* Right: Connection, Collaborators, Share, Profile */}
      <div className="flex items-center gap-3">
        {/* Connection Status Pill with Info Popover */}
        <div className="relative">
          <button
            onClick={() => setConnectionPopoverOpen(!connectionPopoverOpen)}
            className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F5F7FA] bg-[#181C26] hover:bg-[#1E2330] px-2.5 py-1 rounded-md border border-[#222634] transition"
          >
            {connectionStatus === 'connected' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="hidden sm:inline text-[11px] font-medium">Live</span>
              </>
            ) : connectionStatus === 'reconnecting' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
                <span className="hidden sm:inline text-[11px] font-medium">Reconnecting...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span className="hidden sm:inline text-[11px] font-medium">Offline</span>
              </>
            )}
          </button>

          {connectionPopoverOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#181C26] border border-[#222634] rounded-lg shadow-elevated p-3 text-xs z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#222634] font-semibold text-[#F5F7FA]">
                <span className="flex items-center gap-1.5">
                  <Activity size={13} className="text-[#5E6AD2]" /> Connection Info
                </span>
                <span className={`text-[10px] uppercase font-bold ${
                  connectionStatus === 'connected' ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}>
                  {connectionStatus}
                </span>
              </div>
              <div className="space-y-1.5 pt-2 text-[11px] text-[#9CA3AF]">
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span className="font-mono text-[#F5F7FA]">Yjs WebSockets (ws)</span>
                </div>
                <div className="flex justify-between">
                  <span>Sync State:</span>
                  <span className="text-[#10B981]">Up to date</span>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="font-mono text-[#F5F7FA]">~18 ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collaborators Avatar Stack with Rich Hover Tooltip */}
        <div className="flex items-center">
          <div className="flex items-center -space-x-1.5">
            {presence.slice(0, 3).map((p, idx) => {
              const isSelf = p.userId === user?.id;
              return (
                <div
                  key={p.userId || idx}
                  className="group relative"
                >
                  <div
                    style={{ backgroundColor: p.color || '#5E6AD2' }}
                    className="w-6 h-6 rounded-full border-2 border-[#12151C] flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-pointer"
                  >
                    {(p.name || 'U').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Rich Presence Tooltip */}
                  <div className="hidden group-hover:block absolute right-0 top-8 w-44 bg-[#181C26] border border-[#222634] rounded-lg shadow-elevated p-2.5 text-xs z-50 pointer-events-none">
                    <div className="font-semibold text-[#F5F7FA] truncate">
                      {p.name} {isSelf && '(You)'}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] truncate">{p.email}</div>
                    <div className="mt-1 pt-1 border-t border-[#222634] flex items-center gap-1.5 text-[10px] text-[#10B981]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      <span>Online • Editing document</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {presence.length > 3 && (
            <span className="text-[11px] text-[#9CA3AF] ml-1.5 font-medium">
              +{presence.length - 3}
            </span>
          )}
        </div>

        {/* Voice Huddle Button (Feature 3) */}
        {onToggleVoiceHuddle && (
          <button
            onClick={onToggleVoiceHuddle}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border transition ${
              isVoiceHuddleOpen
                ? 'bg-[#6366F1]/20 border-[#6366F1]/50 text-[#A5B4FC] shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                : 'bg-[#181C26] hover:bg-[#1E2330] border-[#222634] text-[#9CA3AF] hover:text-[#F5F7FA]'
            }`}
            title="IDE P2P Voice Huddle"
          >
            <Radio size={13} className={isVoiceHuddleOpen ? 'text-[#10B981] animate-pulse' : 'text-[#818CF8]'} />
            <span className="hidden sm:inline">Voice Huddle</span>
          </button>
        )}

        {/* Export Button */}
        {onExportWorkspace && (
          <button
            onClick={onExportWorkspace}
            className="flex items-center gap-1.5 bg-[#181C26] hover:bg-[#1E2330] text-[#9CA3AF] hover:text-[#F5F7FA] text-xs font-medium px-2.5 py-1 rounded-md border border-[#222634] transition"
            title="Download Workspace as ZIP"
          >
            <Download size={13} className="text-[#38BDF8]" />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 bg-[#181C26] hover:bg-[#1E2330] text-[#F5F7FA] text-xs font-medium px-2.5 py-1 rounded-md border border-[#222634] transition"
        >
          <Share2 size={13} className="text-[#818CF8]" />
          <span>Share</span>
        </button>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-7 h-7 rounded-full bg-[#181C26] hover:bg-[#1E2330] border border-[#222634] flex items-center justify-center text-xs font-semibold text-[#818CF8] transition"
            title={user?.name || 'Account'}
          >
            {(user?.name || 'U').slice(0, 1).toUpperCase()}
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#181C26] border border-[#222634] rounded-xl shadow-modal py-1 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-[#222634]">
                <div className="text-xs font-semibold text-[#F5F7FA]">{user?.name}</div>
                <div className="text-[11px] text-[#9CA3AF] truncate">{user?.email}</div>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#9CA3AF] hover:bg-[#12151C] hover:text-[#F5F7FA] transition"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <UserIcon size={14} /> Profile
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#9CA3AF] hover:bg-[#12151C] hover:text-[#F5F7FA] transition"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <Settings size={14} /> Settings
              </Link>
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 text-left transition"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
