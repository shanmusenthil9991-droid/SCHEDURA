import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-6">
        <Logo size="lg" />
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-border shadow-card max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">403</h1>
        <h2 className="text-lg font-bold text-slate-800 mt-1">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          You do not have the required role permissions to view or edit this resource.
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Go Back
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/')} leftIcon={<Home className="w-4 h-4" />}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
