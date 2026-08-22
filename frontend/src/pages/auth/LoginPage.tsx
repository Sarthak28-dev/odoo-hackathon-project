import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Layers, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('john.doe@dayflow.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your Email or Login ID');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    const result = await signIn(identifier, password);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-radial from-purple-950/20 via-neutral-950 to-[#090a0f]">
      <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header matching Wireframe */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center shadow-lg shadow-purple-600/30 mb-3">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 tracking-tight">
            Sign In to Dayflow
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Every workday, perfectly aligned.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Login ID / Email"
            placeholder="e.g. OIJODO20220001 or name@company.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500"
              isLoading={isLoading}
            >
              SIGN IN
            </Button>
          </div>
        </form>

        {/* Demo Quick Fill buttons for hackathon judges/testing */}
        <div className="mt-6 pt-6 border-t border-neutral-800/80">
          <p className="text-[11px] text-neutral-400 text-center uppercase tracking-wider font-semibold mb-2.5">
            Quick Test Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setIdentifier('john.doe@dayflow.io');
                setPassword('password123');
              }}
              className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 text-neutral-300 text-left transition-colors cursor-pointer"
            >
              <div className="font-medium text-white">Employee</div>
              <div className="text-[10px] text-neutral-500">OIJODO20220001</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('admin@dayflow.io');
                setPassword('admin123');
              }}
              className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 text-neutral-300 text-left transition-colors cursor-pointer"
            >
              <div className="font-medium text-white">HR Admin</div>
              <div className="text-[10px] text-neutral-500">OIADMI20220001</div>
            </button>
          </div>
        </div>

        {/* Footer Link matching Wireframe */}
        <div className="mt-6 text-center text-xs text-neutral-400">
          Don't have an Account?{' '}
          <Link
            to="/register"
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            Sign Up (Company)
          </Link>
        </div>
      </div>
    </div>
  );
};
