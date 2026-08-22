import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Tabs } from '../components/common/Tabs';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { employeeService } from '../services/employeeService';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import type { Profile } from '../types';
import {
  FileText,
  ShieldCheck,
  DollarSign,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Plus,
  Lock,
  Save,
  CheckCircle2,
  Camera,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile: currentAuthProfile, role } = useAuth();
  const [searchParams] = useSearchParams();

  // If query parameter `?id=...` is present, view that profile; otherwise view own profile
  const viewId = searchParams.get('id') || currentAuthProfile?.id;
  const isViewingSelf = Boolean(currentAuthProfile && viewId === currentAuthProfile.id);
  const isAdmin = role === 'admin';
  const canAccessConfidential = isViewingSelf || isAdmin;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [salaryStructure, setSalaryStructure] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('resume');

  // Resume Form State
  const [aboutText, setAboutText] = useState('');
  const [jobLoveText, setJobLoveText] = useState('');
  const [hobbiesText, setHobbiesText] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Private Info Form State
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [phone, setPhone] = useState('');
  const [bankAccNo, setBankAccNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [panNo, setPanNo] = useState('');
  const [uanNo, setUanNo] = useState('');

  // Salary Form State
  const [monthlyWage, setMonthlyWage] = useState<number>(100000);

  // Security Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!viewId) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data: profData, error: profErr } = await employeeService.getProfileById(viewId);
      if (profErr) throw profErr;
      if (profData) {
        setProfile(profData);
        setAboutText(profData.about || '');
        setJobLoveText(profData.job_love || '');
        setHobbiesText(profData.hobbies || '');
        setSkills(profData.skills || []);
        setCertifications(profData.certifications || []);
        setDob(profData.date_of_birth || '');
        setAddress(profData.residential_address || '');
        setPersonalEmail(profData.personal_email || '');
        setGender(profData.gender || '');
        setMaritalStatus(profData.marital_status || '');
        setPhone(profData.phone || '');
        setBankAccNo(profData.bank_account_no || '');
        setBankName(profData.bank_name || '');
        setIfscCode(profData.ifsc_code || '');
        setPanNo(profData.pan_no || '');
        setUanNo(profData.uan_no || '');
      }

      if (canAccessConfidential) {
        const { data: salData } = await employeeService.getSalaryStructure(viewId);
        if (salData) {
          setSalaryStructure(salData);
          setMonthlyWage(Number(salData.monthly_wage || 100000));
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch profile details:', err);
      setError(err.message || 'Unable to retrieve employee profile from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, [viewId, canAccessConfidential]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);

    try {
      const { publicUrl, error: upErr } = await employeeService.uploadAvatar(profile.id, file);
      if (upErr) throw upErr;
      if (publicUrl) {
        setProfile({ ...profile, avatar_url: publicUrl });
        showSuccess('Profile photo updated successfully in Supabase Storage!');
      }
    } catch (err: any) {
      alert('Avatar upload failed: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveResume = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { error: upErr } = await employeeService.updateResume(profile.id, {
        about: aboutText,
        job_love: jobLoveText,
        hobbies: hobbiesText,
        skills,
        certifications,
      });
      if (upErr) throw upErr;
      showSuccess('Resume details saved successfully to Supabase!');
    } catch (err: any) {
      alert('Failed to save resume: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivateInfo = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { error: upErr } = await employeeService.updatePrivateInfo(profile.id, {
        date_of_birth: dob || null,
        residential_address: address,
        personal_email: personalEmail,
        gender,
        marital_status: maritalStatus,
        phone,
        bank_account_no: bankAccNo,
        bank_name: bankName,
        ifsc_code: ifscCode,
        pan_no: panNo,
        uan_no: uanNo,
      });
      if (upErr) throw upErr;
      showSuccess('Private information updated securely in Supabase!');
    } catch (err: any) {
      alert('Failed to save private info: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSalary = async () => {
    if (!profile || !isAdmin) return;
    setIsSaving(true);
    try {
      const { data, error: salErr } = await employeeService.updateSalaryStructure(
        profile.id,
        profile.company_id,
        Number(monthlyWage)
      );
      if (salErr) throw salErr;
      if (data) setSalaryStructure(data);
      showSuccess('Salary structure updated in Supabase database!');
    } catch (err: any) {
      alert('Failed to update salary structure: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
      if (passErr) throw passErr;
      showSuccess('Password updated in Supabase Auth successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert('Password update failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Salary calculations
  const basicSalary = monthlyWage * 0.5;
  const hra = basicSalary * 0.5;
  const standardAllowance = 4167.0;
  const performanceBonus = Number((basicSalary * 0.0833).toFixed(2));
  const lta = Number((basicSalary * 0.0833).toFixed(2));
  const sumFixedComponents = basicSalary + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, Number((monthlyWage - sumFixedComponents).toFixed(2)));
  const pfEmployee = Number((basicSalary * 0.12).toFixed(2));
  const pfEmployer = Number((basicSalary * 0.12).toFixed(2));
  const professionalTax = 200.0;

  const profileTabs = [
    { id: 'resume', label: 'Resume', icon: <FileText className="w-4 h-4" /> },
    { id: 'private_info', label: 'Private Info', icon: <User className="w-4 h-4" /> },
    { id: 'salary_info', label: 'Salary Info', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return <LoadingState message="Loading profile from Supabase..." />;
  }

  if (error || !profile) {
    return <ErrorState message={error || 'Profile not found.'} onRetry={fetchProfileData} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Save Notification Banner */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Profile Header matching Wireframe 3 & 6 */}
      <Card className="p-6 sm:p-8 bg-neutral-900/90 border-neutral-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group">
              <Avatar
                src={profile.avatar_url}
                name={`${profile.first_name} ${profile.last_name}`}
                size="xl"
                className="ring-4 ring-purple-600/30"
              />
              {isViewingSelf && (
                <label className="absolute bottom-0 right-0 p-1.5 bg-purple-600 hover:bg-purple-500 rounded-full text-white cursor-pointer shadow-lg transition-transform hover:scale-105">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {profile.first_name} {profile.last_name}
                </h1>
                <Badge variant={profile.role === 'admin' ? 'admin' : 'employee'}>
                  {profile.role.toUpperCase()}
                </Badge>
                {isViewingSelf && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60">
                    Your Profile
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-purple-300 mt-1">
                {profile.job_position || 'Associate'} • {profile.department || 'General'}
              </p>

              <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{profile.location || 'India'}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-neutral-500">ID:</span>
                  <code className="text-neutral-200 bg-neutral-800 px-1.5 py-0.5 rounded">
                    {profile.login_id}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 4 Exact Canonical Profile Tabs */}
      <Tabs tabs={profileTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: RESUME */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                  About Me / Professional Bio
                </h3>
                {canAccessConfidential && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSaveResume}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save
                  </Button>
                )}
              </div>
              <textarea
                rows={4}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Share your professional journey, core expertise, and accomplishments..."
                disabled={!canAccessConfidential}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 resize-none"
              />
            </Card>

            <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                What I Love About My Job
              </h3>
              <textarea
                rows={3}
                value={jobLoveText}
                onChange={(e) => setJobLoveText(e.target.value)}
                placeholder="What excites you most about your daily work and projects?"
                disabled={!canAccessConfidential}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 resize-none"
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                Skills & Technologies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="text-xs font-medium px-2.5 py-1 bg-purple-950/60 text-purple-300 border border-purple-800/60 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {canAccessConfidential && (
                <div className="pt-2">
                  {isAddingSkill ? (
                    <div className="flex gap-2">
                      <Input
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        placeholder="New skill..."
                        className="py-1 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          if (newSkillInput.trim()) {
                            setSkills([...skills, newSkillInput.trim()]);
                            setNewSkillInput('');
                            setIsAddingSkill(false);
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingSkill(true)}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Skill
                    </Button>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                Interests & Hobbies
              </h3>
              <textarea
                rows={2}
                value={hobbiesText}
                onChange={(e) => setHobbiesText(e.target.value)}
                placeholder="Photography, open source, reading..."
                disabled={!canAccessConfidential}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500/80 resize-none"
              />
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVATE INFO */}
      {activeTab === 'private_info' && (
        <>
          {!canAccessConfidential ? (
            <Card className="p-8 text-center bg-neutral-900/60 border-neutral-800">
              <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Confidential Information Restricted</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                Under Dayflow privacy policies and PostgreSQL RLS, private identity and banking records are restricted to the employee and HR Administrators.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                    Personal Details
                  </h3>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSavePrivateInfo}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                  <Input
                    label="Gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Male / Female / Other"
                  />
                </div>

                <Input
                  label="Residential Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, PIN"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Personal Email"
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="personal@gmail.com"
                  />
                  <Input
                    label="Marital Status"
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    placeholder="Single / Married"
                  />
                </div>
              </Card>

              <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider pb-2 border-b border-neutral-800">
                  Statutory & Banking Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Bank Account Number"
                    value={bankAccNo}
                    onChange={(e) => setBankAccNo(e.target.value)}
                    placeholder="XXXXXXXXXXXX"
                  />
                  <Input
                    label="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="HDFC Bank"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="IFSC Code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="HDFC0001234"
                  />
                  <Input
                    label="PAN Number"
                    value={panNo}
                    onChange={(e) => setPanNo(e.target.value)}
                    placeholder="ABCDE1234F"
                  />
                  <Input
                    label="UAN Number"
                    value={uanNo}
                    onChange={(e) => setUanNo(e.target.value)}
                    placeholder="100987654321"
                  />
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* TAB 3: SALARY INFO */}
      {activeTab === 'salary_info' && (
        <>
          {!canAccessConfidential ? (
            <Card className="p-8 text-center bg-neutral-900/60 border-neutral-800">
              <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Compensation Details Restricted</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                Salary structure records are protected by PostgreSQL RLS.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Gross Hero Card */}
              <div className="p-6 bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border border-purple-800/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-purple-400">
                    Gross Monthly Compensation
                  </span>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {formatCurrency(monthlyWage)}
                  </div>
                  <span className="text-xs text-neutral-400">
                    Annual CTC: {formatCurrency(monthlyWage * 12)}
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={monthlyWage}
                      onChange={(e) => setMonthlyWage(Number(e.target.value))}
                      className="w-40 py-1.5 text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSaveSalary}
                      isLoading={isSaving}
                    >
                      Update Wage
                    </Button>
                  </div>
                )}
              </div>

              {/* Salary Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-3">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider pb-2 border-b border-neutral-800 flex justify-between">
                    <span>Earnings Components</span>
                    <span>{formatCurrency(monthlyWage)}</span>
                  </h3>

                  <div className="space-y-2 text-xs text-neutral-300">
                    <div className="flex justify-between py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-400">Basic Salary (50%)</span>
                      <span className="font-mono font-medium">{formatCurrency(basicSalary)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-400">House Rent Allowance (HRA 50%)</span>
                      <span className="font-mono font-medium">{formatCurrency(hra)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-400">Standard Allowance</span>
                      <span className="font-mono font-medium">{formatCurrency(standardAllowance)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-400">Performance Bonus (8.33%)</span>
                      <span className="font-mono font-medium">{formatCurrency(performanceBonus)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-400">Leave Travel Allowance (8.33%)</span>
                      <span className="font-mono font-medium">{formatCurrency(lta)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-400">Fixed Allowance (Balance)</span>
                      <span className="font-mono font-medium">{formatCurrency(fixedAllowance)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-3">
                  <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider pb-2 border-b border-neutral-800 flex justify-between">
                    <span>Statutory Deductions</span>
                    <span>{formatCurrency(pfEmployee + professionalTax)}</span>
                  </h3>

                  <div className="space-y-2 text-xs text-neutral-300">
                    <div className="flex justify-between py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-400">Provident Fund (EPF 12% Basic)</span>
                      <span className="font-mono font-medium text-red-300">
                        {formatCurrency(pfEmployee)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-800/60">
                      <span className="text-neutral-400">Professional Tax (PT)</span>
                      <span className="font-mono font-medium text-red-300">
                        {formatCurrency(professionalTax)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-neutral-400">
                      <span>Employer PF Contribution</span>
                      <span className="font-mono">{formatCurrency(pfEmployer)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 4: SECURITY */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider pb-2 border-b border-neutral-800">
              Account Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-neutral-400 block mb-1">Assigned Login ID:</span>
                <code className="font-mono font-bold text-sm text-purple-400">{profile.login_id}</code>
                <p className="text-[11px] text-neutral-500 mt-1">
                  You can use either your work email or Login ID to authenticate.
                </p>
              </div>

              <div className="flex justify-between py-2 border-b border-neutral-800">
                <span className="text-neutral-400">Primary Email:</span>
                <span className="text-neutral-200">{profile.email}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-neutral-800">
                <span className="text-neutral-400">System Role:</span>
                <Badge variant={profile.role === 'admin' ? 'admin' : 'employee'}>
                  {profile.role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </Card>

          {isViewingSelf && (
            <Card className="p-6 bg-neutral-900/80 border-neutral-800 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider pb-2 border-b border-neutral-800">
                Change Password
              </h3>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  Update Password
                </Button>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
