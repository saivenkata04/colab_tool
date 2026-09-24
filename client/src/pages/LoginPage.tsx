import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { BrandLogo } from '../components/BrandLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#080A0F] text-[#F8FAFC] flex flex-col lg:flex-row relative font-sans select-none">
      {/* Sophisticated Layered Radial Gradients */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.08), transparent 35%),
            radial-gradient(circle at 85% 80%, rgba(34, 211, 238, 0.05), transparent 35%)
          `
        }}
      />

      {/* Subtle Ambient Glow Behind Sections */}
      <div className="absolute top-1/4 left-1/4 w-[380px] h-[380px] bg-[#6366F1]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#8B5CF6]/5 rounded-full blur-[150px] pointer-events-none" />

      {/* LEFT COLUMN: Brand, Hero & Code Window (56-58%) */}
      <div className="lg:w-[56%] xl:w-[58%] lg:h-full lg:overflow-y-auto p-5 sm:p-7 md:p-8 xl:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[rgba(255,255,255,0.08)] bg-[#0C0F15]/60 backdrop-blur-md relative z-10">
        
        {/* Top Header: Logo + Live CRDT Status Badge */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <BrandLogo size="md" showText={true} showTagline={true} />

          {/* Section 15: CRDT WebSocket Live Badge */}
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0C0F15]/90 border border-[rgba(255,255,255,0.08)] text-[11px] text-[#94A3B8] shadow-sm hover:border-[#10B981]/40 transition-colors"
            title="Real-Time Yjs WebSocket Synchronization Engine Active"
          >
            <span 
              className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"
              style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)' }}
            />
            <span className="font-medium tracking-tight text-[#F8FAFC]">CRDT WebSocket Live</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="my-auto py-4 xl:py-6 max-w-xl">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#11151D] border border-[rgba(255,255,255,0.08)] text-[11px] font-medium text-[#A5B4FC] mb-3 shadow-sm">
            <Sparkles size={12} className="text-[#6366F1]" />
            <span className="tracking-wide">DEVELOPER COLLABORATION PLATFORM</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-4xl xl:text-[44px] font-extrabold tracking-tight text-[#F8FAFC] leading-[1.05]">
            Code together.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F8FAFC] via-[#C7D2FE] to-[#818CF8]">
              Think together.
            </span>
          </h1>

          {/* Body Description */}
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-2.5 leading-relaxed max-w-lg">
            A high-performance workspace combining Monaco code editing and Google Docs-style rich notes with conflict-free Yjs CRDT synchronization.
          </p>

          {/* Hero Code Window (Miniature IDE) */}
          <div className="mt-4 xl:mt-6 relative group">
            {/* Ambient Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300 pointer-events-none" />

            <div 
              className="relative rounded-xl bg-[#0C0F15] border border-[rgba(255,255,255,0.08)] group-hover:border-[rgba(99,102,241,0.30)] transition-colors overflow-hidden font-mono text-xs"
              style={{ boxShadow: '0 0 35px rgba(99, 102, 241, 0.10)' }}
            >
              {/* Window Top Bar */}
              <div className="h-8 bg-[#11151D] border-b border-[rgba(255,255,255,0.08)] px-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/90" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/90" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/90" />
                  </div>
                  <span className="text-[#94A3B8] text-[11px] ml-1.5 font-mono font-medium">algorithm.py</span>
                  <span className="text-[#10B981] text-[10px]" title="Auto-saved to cloud">✓</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                  <span className="px-1.5 py-0.2 rounded bg-[#151A23] border border-[rgba(255,255,255,0.05)]">
                    Python 3.12
                  </span>
                </div>
              </div>

              {/* Code Body */}
              <div className="p-3.5 space-y-1 leading-5 select-none relative font-mono text-[11px] sm:text-xs">
                {/* Line 1 */}
                <div className="flex items-center text-[#64748B]">
                  <span className="w-6 text-right pr-2.5 select-none text-[#475569]">1</span>
                  <span className="italic text-[#64748B]"># Real-Time Collaborative Code</span>
                </div>

                {/* Line 2 */}
                <div className="flex items-center">
                  <span className="w-6 text-right pr-2.5 select-none text-[#475569]">2</span>
                  <span>&nbsp;</span>
                </div>

                {/* Line 3 */}
                <div className="flex items-center">
                  <span className="w-6 text-right pr-2.5 select-none text-[#475569]">3</span>
                  <span className="text-[#8B5CF6] font-bold">def </span>
                  <span className="text-[#22D3EE] ml-1 font-semibold">calculate_convergence</span>
                  <span className="text-[#F8FAFC]">(data):</span>
                </div>

                {/* Line 4 (Active line with Sai Kumar cursor) */}
                <div className="flex items-center relative bg-[rgba(99,102,241,0.06)] rounded-sm -mx-1.5 px-1.5 py-0.2">
                  <span className="w-6 text-right pr-2.5 select-none text-[#A5B4FC] font-semibold">4</span>
                  <span className="text-[#F8FAFC] pl-2.5">return merge_changes(data)</span>

                  {/* Collaborator Cursor: Sai Kumar */}
                  <div className="inline-flex items-center ml-2 relative">
                    <span className="w-[2px] h-3.5 bg-[#6366F1] animate-pulse" />
                    <span 
                      className="bg-[#6366F1] text-white text-[9px] font-sans font-bold px-1.5 py-0.2 rounded shadow-sm flex items-center gap-1 -translate-y-2"
                      style={{ boxShadow: '0 0 8px rgba(99, 102, 241, 0.40)' }}
                    >
                      <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                      Sai Kumar
                    </span>
                  </div>
                </div>

                {/* Line 5 */}
                <div className="flex items-center">
                  <span className="w-6 text-right pr-2.5 select-none text-[#475569]">5</span>
                  <span>&nbsp;</span>
                </div>

                {/* Line 6 with Rahul cursor */}
                <div className="flex items-center relative">
                  <span className="w-6 text-right pr-2.5 select-none text-[#475569]">6</span>
                  <span className="text-[#F8FAFC]">print(</span>
                  <span className="text-[#10B981]">"CRDT merge complete"</span>
                  <span className="text-[#F8FAFC]">)</span>

                  {/* Collaborator Cursor: Rahul */}
                  <div className="inline-flex items-center ml-2 relative">
                    <span className="w-[2px] h-3.5 bg-[#10B981] animate-pulse" />
                    <span 
                      className="bg-[#10B981] text-white text-[9px] font-sans font-bold px-1.5 py-0.2 rounded shadow-sm -translate-y-2"
                      style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.40)' }}
                    >
                      Rahul
                    </span>
                  </div>
                </div>
              </div>

              {/* Window Footer: Latency & Sync Status */}
              <div className="h-7 bg-[#11151D] border-t border-[rgba(255,255,255,0.08)] px-3 flex items-center justify-between text-[10px] text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 font-medium text-[#F8FAFC]">
                    <span 
                      className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
                      style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)' }}
                    />
                    18ms Latency
                  </span>
                  <span className="text-[#475569]">•</span>
                  <span className="text-[#64748B]">0 Merge Conflicts</span>
                </div>
                <div className="flex items-center gap-1 text-[#10B981] font-medium">
                  <span>✓</span>
                  <span className="text-[#A5B4FC]">Synced</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-4 xl:mt-5 grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#10B981] shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
              <span className="text-[#F8FAFC]">Multi-user real-time editing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#10B981] shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
              <span className="text-[#F8FAFC]">Conflict-free Yjs synchronization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#10B981] shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
              <span className="text-[#F8FAFC]">Collaborative notes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#10B981] shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
              <span className="text-[#F8FAFC]">Live presence &amp; cursors</span>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="text-[11px] text-[#64748B] pt-3 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between shrink-0">
          <span>&copy; 2026 SyncCode</span>
          <span>Built for real-time engineering collaboration.</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Premium Glassmorphic Login Card (42-44%) */}
      <div className="lg:w-[44%] xl:w-[42%] lg:h-full lg:overflow-y-auto p-5 sm:p-7 md:p-8 xl:p-10 flex items-center justify-center relative z-10">
        
        {/* Card Wrapper with Subtle Radial Light Behind */}
        <div className="w-full max-w-[390px] relative my-auto">
          {/* Subtle Outer Glow Behind Card */}
          <div className="absolute -inset-2 bg-gradient-to-tr from-[#6366F1]/10 via-transparent to-[#22D3EE]/5 rounded-3xl blur-2xl pointer-events-none" />

          {/* Section 7: Login Card */}
          <div 
            className="w-full bg-[#11151D]/90 backdrop-blur-xl border border-[rgba(139,92,246,0.18)] rounded-2xl p-6 sm:p-7 xl:p-8 relative z-10"
            style={{ 
              boxShadow: '0 0 50px rgba(99, 102, 241, 0.08), 0 20px 45px rgba(0, 0, 0, 0.7)' 
            }}
          >
            {/* Form Header */}
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                Enter your credentials to access your collaborative workspaces
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs text-[#EF4444] animate-fade-in flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span>{error}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Work Email */}
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-3 text-[#64748B]" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0C0F15] border border-[rgba(255,255,255,0.08)] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition duration-150 focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_0_20px_rgba(99,102,241,0.12)]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[#F8FAFC]">Password</label>
                  <a 
                    href="#forgot" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      alert('Please contact your workspace administrator to reset your credentials.'); 
                    }} 
                    className="text-[11px] text-[#A5B4FC] hover:underline hover:text-white transition"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-3 text-[#64748B]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0C0F15] border border-[rgba(255,255,255,0.08)] rounded-xl pl-9 pr-9 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition duration-150 focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_0_20px_rgba(99,102,241,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#F8FAFC] transition p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center pt-0.5">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#0C0F15] border-[rgba(255,255,255,0.12)] accent-[#6366F1] cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-xs text-[#94A3B8] cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>

              {/* Primary Sign-In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:from-[#6D70F7] hover:to-[#8B5CF6] border-t border-white/20 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 shadow-[0_0_25px_rgba(99,102,241,0.30)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Registration Navigation */}
            <p className="mt-5 text-center text-xs text-[#94A3B8]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#A5B4FC] font-semibold hover:underline hover:text-white transition">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
