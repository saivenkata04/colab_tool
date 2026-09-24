import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Users, 
  ArrowRight, 
  Clock, 
  FolderPlus, 
  LogOut, 
  User, 
  Settings,
  FolderGit2,
  Share2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { BrandLogo } from '../components/BrandLogo';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { workspaces, fetchWorkspaces, createWorkspace, isLoading } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const ws = await createWorkspace(newWsName.trim(), newWsDesc.trim());
    setIsModalOpen(false);
    setNewWsName('');
    setNewWsDesc('');
    navigate(`/workspace/${ws.id}`);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filtered = workspaces.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#F5F7FA] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-[#252A33] bg-[#111418] px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" showText={true} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] bg-[#171B21] px-3 py-1.5 rounded-lg border border-[#252A33]">
            <div className="w-5 h-5 rounded-full bg-[#6366F1]/20 text-[#818CF8] font-bold flex items-center justify-center text-[10px]">
              {(user?.name || 'U').slice(0, 1)}
            </div>
            <span className="text-[#F5F7FA] font-medium">{user?.name}</span>
          </div>

          <Link
            to="/profile"
            className="p-1.5 text-[#9CA3AF] hover:text-[#F5F7FA] hover:bg-[#171B21] rounded-lg transition"
            title="Profile"
          >
            <User size={15} />
          </Link>

          <Link
            to="/settings"
            className="p-1.5 text-[#9CA3AF] hover:text-[#F5F7FA] hover:bg-[#171B21] rounded-lg transition"
            title="Settings"
          >
            <Settings size={15} />
          </Link>

          <button
            onClick={logout}
            className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {/* Welcome Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">
              {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'Developer'}
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Continue where you left off.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
            >
              <Plus size={14} /> New Workspace
            </button>
          </div>
        </div>

        {/* Section Heading & Search */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            RECENT WORKSPACES
          </span>

          <div className="relative w-72">
            <Search size={13} className="absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111418] border border-[#252A33] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F5F7FA] placeholder-[#6B7280] outline-none focus:border-[#6366F1]"
            />
          </div>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ws) => (
            <div
              key={ws.id}
              className="bg-[#111418] border border-[#252A33] hover:border-[#6366F1]/50 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-150 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#171B21] border border-[#252A33] text-[#818CF8] flex items-center justify-center shrink-0">
                    <FolderGit2 size={16} />
                  </div>

                  <span className="text-[10px] font-medium bg-[#171B21] text-[#9CA3AF] px-2 py-0.5 rounded border border-[#252A33]">
                    {ws.ownerId === user?.id ? 'Owner' : 'Member'}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#F5F7FA] group-hover:text-[#818CF8] transition truncate">
                  {ws.name}
                </h3>
                <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2 h-8">
                  {ws.description || 'Collaborative coding and documentation space.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#252A33]">
                <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] mb-3">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {ws._count?.members || 1} collaborators
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    {new Date(ws.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <Link
                  to={`/workspace/${ws.id}`}
                  className="w-full bg-[#171B21] hover:bg-[#6366F1] text-[#F5F7FA] text-xs font-medium py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition"
                >
                  <span>Open</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && !isLoading && (
          <div className="py-16 text-center border border-dashed border-[#252A33] rounded-xl bg-[#111418]/50">
            <div className="w-10 h-10 rounded-xl bg-[#171B21] text-[#9CA3AF] mx-auto flex items-center justify-center mb-2.5">
              <FolderPlus size={18} />
            </div>
            <h3 className="text-sm font-medium text-[#F5F7FA]">No workspaces found</h3>
            <p className="text-xs text-[#9CA3AF] mt-1 mb-4">Create your first collaborative workspace to get started</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              + New Workspace
            </button>
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-[#111418] border border-[#252A33] rounded-xl w-full max-w-md p-6 shadow-modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-[#F5F7FA] mb-1">Create Workspace</h2>
            <p className="text-xs text-[#9CA3AF] mb-4">Set up a new space for coding files and rich notes</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">Workspace Name</label>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Lab"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#252A33] rounded-lg px-3 py-2 text-xs text-[#F5F7FA] placeholder-[#6B7280] outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5F7FA] mb-1.5">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Purpose of this workspace..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#252A33] rounded-lg p-2.5 text-xs text-[#F5F7FA] placeholder-[#6B7280] outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F5F7FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
