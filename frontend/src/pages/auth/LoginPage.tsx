import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Lock, Mail, Shield, User, GraduationCap, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      toast.error('Missing credentials', 'Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome to SCHEDURA', 'Logged in successfully.');
      
      const stored = localStorage.getItem('schedura_user');
      const user = stored ? JSON.parse(stored) : null;
      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else if (user?.role === 'FACULTY_COORDINATOR') {
        navigate('/coordinator');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      toast.error('Login Failed', err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Logo size="lg" showTagline={true} />
        </div>
        <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
          Sign in to access your class schedules, timetable management system, and academic records.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-8 bg-white border border-border shadow-card">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. admin@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to SCHEDURA
            </Button>
          </form>

          {/* Quick Demo Credentials Selection Box */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1-Click Demo Accounts
              </span>
              <span className="text-[10px] text-brand-600 font-semibold">Ready to test</span>
            </div>

            <div className="space-y-2">
              {/* Admin Demo */}
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@college.edu', 'Admin@123')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-100 text-brand-700">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-brand-700">
                      Administrator
                    </div>
                    <div className="text-[10px] text-slate-500">admin@college.edu • Full System Access</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-brand-600 group-hover:underline">Select</span>
              </button>

              {/* Faculty Coordinator Demo */}
              <button
                type="button"
                onClick={() => handleQuickDemo('faculty.coordinator@college.edu', 'Faculty@123')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      Faculty Coordinator
                    </div>
                    <div className="text-[10px] text-slate-500">Dr. Arun Kumar • CSE Timetables</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 group-hover:underline">Select</span>
              </button>

              {/* Student Demo */}
              <button
                type="button"
                onClick={() => handleQuickDemo('student@college.edu', 'Student@123')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-purple-100 text-purple-700">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                      Student
                    </div>
                    <div className="text-[10px] text-slate-500">II CSE — Section A (Semester 3)</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-purple-600 group-hover:underline">Select</span>
              </button>
            </div>
          </div>
        </Card>

        <div className="text-center mt-6 text-xs text-slate-400">
          SCHEDURA Academic Platform • PS63 Timetable & Schedule Viewer
        </div>
      </div>
    </div>
  );
};
