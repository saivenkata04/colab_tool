import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { BrandLogo } from '../components/BrandLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-[#151A23]' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-[#EF4444]' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'bg-[#F59E0B]' };
    return { score: 3, label: 'Strong', color: 'bg-[#10B981]' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC] flex flex-col items-center justify-center p-4 relative overflow-x-hidden font-sans select-none">
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

      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-[#6366F1]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Register Card */}
      <div className="w-full max-w-[440px] relative z-10">
        <div className="absolute -inset-2 bg-gradient-to-tr from-[#6366F1]/10 via-transparent to-[#22D3EE]/5 rounded-3xl blur-2xl pointer-events-none" />

        <div 
          className="w-full bg-[#11151D]/90 backdrop-blur-xl border border-[rgba(139,92,246,0.18)] rounded-2xl p-7 sm:p-8 relative z-10"
          style={{ 
            boxShadow: '0 0 50px rgba(99, 102, 241, 0.08), 0 20px 45px rgba(0, 0, 0, 0.7)' 
          }}
        >
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="md" showText={false} />
            <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight mt-3">
              Create your SyncCode account
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1">Start collaborating with your team in real time</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs text-[#EF4444] animate-fade-in flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-3.5 text-[#64748B]" />
                <input
                  type="text"
                  required
                  placeholder="Sai Krishna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0C0F15] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition duration-150 focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_0_20px_rgba(99,102,241,0.12)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-3.5 text-[#64748B]" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0C0F15] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition duration-150 focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_0_20px_rgba(99,102,241,0.12)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-3.5 text-[#64748B]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0C0F15] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition duration-150 focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_0_20px_rgba(99,102,241,0.12)]"
                />
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span>Strength: <strong className="text-[#F8FAFC]">{strength.label}</strong></span>
                  <div className="flex gap-1">
                    <div className={`w-7 h-1 rounded ${strength.score >= 1 ? strength.color : 'bg-[#151A23]'}`} />
                    <div className={`w-7 h-1 rounded ${strength.score >= 2 ? strength.color : 'bg-[#151A23]'}`} />
                    <div className={`w-7 h-1 rounded ${strength.score >= 3 ? strength.color : 'bg-[#151A23]'}`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-3.5 text-[#64748B]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0C0F15] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition duration-150 focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_0_20px_rgba(99,102,241,0.12)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:from-[#6D70F7] hover:to-[#8B5CF6] border-t border-white/20 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 shadow-[0_0_25px_rgba(99,102,241,0.30)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#94A3B8]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#A5B4FC] font-semibold hover:underline hover:text-white transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
