import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Building2, User, Mail, Phone, Lock, Upload, AlertCircle } from 'lucide-react';

export const RegisterCompanyPage: React.FC = () => {
  const { signUpCompany, isLoading } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('Odoo India');
  const [adminName, setAdminName] = useState('Mithilesh Kulkarni');
  const [email, setEmail] = useState('admin@odooindia.com');
  const [phone, setPhone] = useState('+91 99001 12233');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim() || !adminName.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await signUpCompany({
      companyName,
      adminName,
      email,
      phone,
      password,
    });

    if (result.error) {
      setError(result.error);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-radial from-purple-950/20 via-neutral-950 to-[#090a0f] py-12">
      <div className="w-full max-w-lg bg-neutral-900/90 border border-neutral-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header matching Wireframe 1 */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center shadow-lg shadow-purple-600/30 mb-3">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 tracking-tight">
            Register Company
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Setup your organization workspace on Dayflow HRMS
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form matching Wireframe 1 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              placeholder="e.g. Odoo India"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              leftIcon={<Building2 className="w-4 h-4" />}
              required
            />

            {/* Logo Upload Placeholder matching wireframe upload button */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-300">Company Logo</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-neutral-950 border border-dashed border-neutral-700 hover:border-purple-500 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo</span>
                </button>
              </div>
            </div>
          </div>

          <Input
            label="Admin Full Name"
            placeholder="e.g. Mithilesh Kulkarni"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          {/* Wireframe Note Box */}
          <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-[11px] text-neutral-400 space-y-1">
            <p className="font-semibold text-neutral-300">ℹ️ Note on Employee Accounts:</p>
            <p>
              Regular employees cannot self-register. Once your company is onboarded, HR Admins can provision employee accounts with automatically generated Login IDs (e.g. <code>OIJODO20220001</code>).
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500"
              isLoading={isLoading}
            >
              Sign Up (Register Company)
            </Button>
          </div>
        </form>

        {/* Footer Link matching Wireframe */}
        <div className="mt-6 text-center text-xs text-neutral-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
