import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.tsx';
import { Network, Lock, Mail, AlertCircle, Sparkles, UserPlus, LogIn, User, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';
import { useNavigate } from 'react-router-dom';
import { ApiService, api } from '../../services/api.ts';

const authFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type AuthFormData = z.infer<typeof authFormSchema>;

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // If already authenticated, redirect immediately to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<AuthFormData>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      fullName: 'System Administrator',
      email: 'admin@network.local',
      password: 'Admin@123456'
    }
  });

  const onSubmit = async (data: AuthFormData) => {
    setErrorMsg(null);
    setSeedNotice(null);
    try {
      if (isRegisterMode) {
        // Register new account
        const res = await api.post('/auth/register', {
          fullName: data.fullName || 'Network Administrator',
          email: data.email.trim().toLowerCase(),
          password: data.password,
          role: 'ADMIN'
        });
        if (res.data?.data?.token) {
          localStorage.setItem('auth_token', res.data.data.token);
          window.location.href = '/';
        }
      } else {
        // Sign in
        await login({
          email: data.email.trim().toLowerCase(),
          password: data.password
        });
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          (isRegisterMode ? 'Registration failed.' : 'Invalid email or password.')
      );
    }
  };

  const handleFillDefaultAdmin = () => {
    setValue('email', 'admin@network.local');
    setValue('password', 'Admin@123456');
    setValue('fullName', 'System Administrator');
    setIsRegisterMode(false);
    setErrorMsg(null);
    setSeedNotice('Pre-filled with default administrator credentials.');
  };

  const handleSeedAdmin = async () => {
    setIsSeeding(true);
    setSeedNotice(null);
    setErrorMsg(null);
    try {
      const res = await ApiService.seedAdmin();
      setSeedNotice(res.message || 'Default admin user initialized successfully.');
      handleFillDefaultAdmin();
    } catch (err: any) {
      handleFillDefaultAdmin();
      setSeedNotice('Default admin exists: admin@network.local / Admin@123456');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center px-4 relative overflow-hidden noc-grid-bg">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 items-center justify-center shadow-xl shadow-cyan-600/25 text-white mb-3 ring-4 ring-cyan-500/10">
            <Network className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            SwitchGuard NOC
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Multi-Vendor SNMP Network Monitoring & Trap Engine
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-slate-950/80 border border-slate-800 p-1 text-xs mb-5">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isRegisterMode
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isRegisterMode
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Register Admin
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {seedNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{seedNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    {...register('fullName')}
                    className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    placeholder="Administrator Name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-xs"
                  placeholder="admin@network.local"
                />
              </div>
              {errors.email && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              {isRegisterMode ? 'Create Admin Account' : 'Sign In to Dashboard'}
            </Button>
          </form>

          {/* Default Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Default Credentials
                </span>
                <button
                  type="button"
                  onClick={handleFillDefaultAdmin}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono text-[11px] font-semibold cursor-pointer"
                >
                  Click to Fill
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-200">admin@network.local</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Password:</span>
                  <span className="text-slate-200">Admin@123456</span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={handleSeedAdmin}
                disabled={isSeeding}
                className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Reset or Re-seed Default Admin User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
