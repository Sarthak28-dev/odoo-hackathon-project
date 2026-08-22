import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Tabs } from '../components/common/Tabs';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { mockProfiles, mockSalaryStructure } from '../services/mockData';
import { formatCurrency } from '../lib/utils';
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
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile: currentAuthProfile, role } = useAuth();
  const [searchParams] = useSearchParams();

  // If query parameter `?id=...` is present, view that profile; otherwise view own profile
  const viewId = searchParams.get('id') || currentAuthProfile?.id;
  const targetProfile = mockProfiles.find((p) => p.id === viewId) || currentAuthProfile;

  const isViewingSelf = currentAuthProfile?.id === targetProfile?.id;
  const canEditAll = role === 'admin';
  const canEditLimited = isViewingSelf || canEditAll;

  const [activeTab, setActiveTab] = useState('resume');
  const [skills, setSkills] = useState<string[]>(targetProfile?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Resume form state
  const [aboutText, setAboutText] = useState(targetProfile?.about || '');
  const [jobLoveText, setJobLoveText] = useState(targetProfile?.job_love || '');
  const [hobbiesText, setHobbiesText] = useState(targetProfile?.hobbies || '');

  // Salary form state (Admin editable)
  const [monthlyWage, setMonthlyWage] = useState<number>(mockSalaryStructure.monthly_wage);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Computed salary components matching wireframe 4 & 5
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

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
      setIsAddingSkill(false);
    }
  };

  const handleSaveProfile = () => {
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const profileTabs = [
    { id: 'resume', label: 'Resume', icon: <FileText className="w-4 h-4" /> },
    { id: 'private_info', label: 'Private Info', icon: <User className="w-4 h-4" /> },
    { id: 'salary_info', label: 'Salary Info', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Save Confirmation Alert */}
      {isSavedAlert && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Main Profile Header matching Wireframe 3 & 6 */}
      <Card className="p-6 sm:p-8 bg-neutral-900/90 border-neutral-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar
              src={targetProfile?.avatar_url}
              name={`${targetProfile?.first_name} ${targetProfile?.last_name}`}
              size="2xl"
              isEditable={canEditLimited}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {targetProfile?.first_name} {targetProfile?.last_name}
                </h1>
                <Badge variant={targetProfile?.role === 'admin' ? 'admin' : 'employee'} />
              </div>
              <p className="text-sm font-mono text-purple-400 font-semibold mt-1">
                {targetProfile?.login_id}
              </p>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-400 mt-2">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  {targetProfile?.job_position || 'Employee'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-neutral-500" />
                  {targetProfile?.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  {targetProfile?.email}
                </span>
                {targetProfile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-500" />
                    {targetProfile?.phone}
                  </span>
                )}
                {targetProfile?.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    {targetProfile?.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {canEditLimited && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveProfile}
              className="shrink-0"
            >
              Save Changes
            </Button>
          )}
        </div>

        {/* Tab Navigation matching Wireframe 3 & 6 */}
        <div className="mt-8">
          <Tabs tabs={profileTabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* TAB CONTENT AREA */}
      <div className="mt-6">
        {/* TAB 1: RESUME */}
        {activeTab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* About Box */}
              <Card className="p-6 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                  About
                </h3>
                {canEditLimited ? (
                  <textarea
                    rows={3}
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    className="w-full bg-neutral-950 text-neutral-200 text-sm p-3 rounded-lg border border-neutral-800 focus:border-purple-500 focus:outline-none"
                    placeholder="Write a brief professional summary..."
                  />
                ) : (
                  <p className="text-sm text-neutral-300 leading-relaxed">{aboutText}</p>
                )}
              </Card>

              {/* What I love about my job */}
              <Card className="p-6 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                  What I love about my job
                </h3>
                {canEditLimited ? (
                  <textarea
                    rows={2}
                    value={jobLoveText}
                    onChange={(e) => setJobLoveText(e.target.value)}
                    className="w-full bg-neutral-950 text-neutral-200 text-sm p-3 rounded-lg border border-neutral-800 focus:border-purple-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm text-neutral-300 leading-relaxed">{jobLoveText}</p>
                )}
              </Card>

              {/* My interests and hobbies */}
              <Card className="p-6 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                  My interests and hobbies
                </h3>
                {canEditLimited ? (
                  <textarea
                    rows={2}
                    value={hobbiesText}
                    onChange={(e) => setHobbiesText(e.target.value)}
                    className="w-full bg-neutral-950 text-neutral-200 text-sm p-3 rounded-lg border border-neutral-800 focus:border-purple-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm text-neutral-300 leading-relaxed">{hobbiesText}</p>
                )}
              </Card>
            </div>

            {/* Skills & Certifications Sidebar */}
            <div className="space-y-6">
              {/* Skills Card with + Add Skills */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                    Skills
                  </h3>
                  {canEditLimited && !isAddingSkill && (
                    <button
                      type="button"
                      onClick={() => setIsAddingSkill(true)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Skill</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-950/40 text-purple-300 border border-purple-800/50 rounded-lg text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {isAddingSkill && (
                  <form onSubmit={handleAddSkill} className="flex gap-2 pt-2">
                    <Input
                      placeholder="e.g. React, SQL"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="py-1 text-xs"
                      autoFocus
                    />
                    <Button type="submit" variant="primary" size="sm">
                      Add
                    </Button>
                  </form>
                )}
              </Card>

              {/* Certifications Card */}
              <Card className="p-6 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                  Certifications
                </h3>
                <div className="space-y-2">
                  {targetProfile?.certifications && targetProfile.certifications.length > 0 ? (
                    targetProfile.certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-300 font-medium flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{cert}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500 italic">No certifications listed.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: PRIVATE INFO (Personal & Bank Details matching Wireframe 6) */}
        {activeTab === 'private_info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Personal Information */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider pb-2 border-b border-neutral-800">
                Personal Information
              </h3>
              <div className="space-y-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  defaultValue={targetProfile?.date_of_birth || ''}
                  disabled={!canEditAll}
                />
                <Input
                  label="Residential Address"
                  defaultValue={targetProfile?.residential_address || ''}
                  disabled={!canEditLimited}
                />
                <Input
                  label="Nationality"
                  defaultValue={targetProfile?.nationality || 'Indian'}
                  disabled={!canEditAll}
                />
                <Input
                  label="Personal Email"
                  type="email"
                  defaultValue={targetProfile?.personal_email || ''}
                  disabled={!canEditLimited}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Gender"
                    defaultValue={targetProfile?.gender || 'Not specified'}
                    disabled={!canEditAll}
                  />
                  <Input
                    label="Marital Status"
                    defaultValue={targetProfile?.marital_status || 'Single'}
                    disabled={!canEditLimited}
                  />
                </div>
                <Input
                  label="Date of Joining"
                  type="date"
                  defaultValue={targetProfile?.date_of_joining || ''}
                  disabled={!canEditAll}
                />
              </div>
            </Card>

            {/* Right Column: Bank & Identification Details */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider pb-2 border-b border-neutral-800">
                Bank & Identification Details
              </h3>
              <div className="space-y-3">
                <Input
                  label="Bank Name"
                  defaultValue={targetProfile?.bank_name || 'HDFC Bank'}
                  disabled={!canEditAll}
                />
                <Input
                  label="Bank Account Number"
                  defaultValue={targetProfile?.bank_account_no || '••••••••1928'}
                  disabled={!canEditAll}
                />
                <Input
                  label="IFSC Code"
                  defaultValue={targetProfile?.ifsc_code || 'HDFC0001234'}
                  disabled={!canEditAll}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="PAN Number"
                    defaultValue={targetProfile?.pan_no || 'ABCDE1234F'}
                    disabled={!canEditAll}
                  />
                  <Input
                    label="UAN Number"
                    defaultValue={targetProfile?.uan_no || '100982347162'}
                    disabled={!canEditAll}
                  />
                </div>
                <Input
                  label="Employee Code"
                  defaultValue={targetProfile?.emp_code || 'EMP-001'}
                  disabled={!canEditAll}
                />
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: SALARY INFO (Formula table matching Wireframe 4 & 5) */}
        {activeTab === 'salary_info' && (
          <div className="space-y-6">
            {/* Header Wage Controls */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div>
                  <h3 className="text-base font-semibold text-neutral-100">
                    Salary Configuration
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {canEditAll
                      ? 'Adjust monthly fixed wage to recompute salary structure components.'
                      : 'Salary details are read-only for employees.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">Monthly Gross Wage</p>
                    <p className="text-xl font-bold text-purple-400">
                      {formatCurrency(monthlyWage)}
                    </p>
                  </div>
                  <div className="text-right pl-4 border-l border-neutral-800">
                    <p className="text-xs text-neutral-400">Yearly Wage</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(monthlyWage * 12)}
                    </p>
                  </div>
                </div>
              </div>

              {canEditAll && (
                <div className="mt-4 pt-2 max-w-xs">
                  <Input
                    label="Edit Monthly Fixed Wage (₹)"
                    type="number"
                    value={monthlyWage}
                    onChange={(e) => setMonthlyWage(Number(e.target.value) || 0)}
                    leftIcon={<DollarSign className="w-4 h-4" />}
                  />
                </div>
              )}
            </Card>

            {/* Salary Components Breakdown Table matching Wireframe 4 & 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Breakdown */}
              <Card className="p-6 space-y-4">
                <h4 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                  Salary Components (Earnings)
                </h4>
                <div className="divide-y divide-neutral-800 text-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">Basic Salary</p>
                      <p className="text-xs text-neutral-500">50.00% of Monthly Wage</p>
                    </div>
                    <span className="font-semibold text-neutral-100">
                      {formatCurrency(basicSalary)}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">House Rent Allowance (HRA)</p>
                      <p className="text-xs text-neutral-500">50.00% of Basic Salary</p>
                    </div>
                    <span className="font-semibold text-neutral-100">{formatCurrency(hra)}</span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">Standard Allowance</p>
                      <p className="text-xs text-neutral-500">16.67% of Basic (Standard)</p>
                    </div>
                    <span className="font-semibold text-neutral-100">
                      {formatCurrency(standardAllowance)}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">Performance Bonus</p>
                      <p className="text-xs text-neutral-500">8.33% of Basic Salary</p>
                    </div>
                    <span className="font-semibold text-neutral-100">
                      {formatCurrency(performanceBonus)}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">Leave Travel Allowance (LTA)</p>
                      <p className="text-xs text-neutral-500">8.33% of Basic Salary</p>
                    </div>
                    <span className="font-semibold text-neutral-100">{formatCurrency(lta)}</span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">Fixed Allowance</p>
                      <p className="text-xs text-neutral-500">Balancing portion</p>
                    </div>
                    <span className="font-semibold text-neutral-100">
                      {formatCurrency(fixedAllowance)}
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between bg-purple-950/20 px-3 rounded-lg mt-2">
                    <span className="font-bold text-neutral-100">Total Gross Salary</span>
                    <span className="font-bold text-purple-300">
                      {formatCurrency(monthlyWage)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Deductions Breakdown */}
              <Card className="p-6 space-y-4">
                <h4 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                  Deductions & Statutory Contributions
                </h4>
                <div className="divide-y divide-neutral-800 text-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">Employee PF Contribution</p>
                      <p className="text-xs text-neutral-500">12.00% of Basic Salary</p>
                    </div>
                    <span className="font-semibold text-rose-400">
                      - {formatCurrency(pfEmployee)}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">Professional Tax (PT)</p>
                      <p className="text-xs text-neutral-500">Fixed statutory deduction</p>
                    </div>
                    <span className="font-semibold text-rose-400">
                      - {formatCurrency(professionalTax)}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-200">Employer PF Contribution</p>
                      <p className="text-xs text-neutral-500">12.00% of Basic (Company paid)</p>
                    </div>
                    <span className="font-semibold text-neutral-400">
                      {formatCurrency(pfEmployer)}
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between bg-rose-950/20 px-3 rounded-lg mt-4">
                    <span className="font-bold text-neutral-100">Total Deductions</span>
                    <span className="font-bold text-rose-400">
                      {formatCurrency(pfEmployee + professionalTax)}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between bg-emerald-950/20 px-3 rounded-lg mt-2 border border-emerald-800/40">
                    <div>
                      <span className="font-bold text-neutral-100">Estimated Net In-Hand</span>
                      <p className="text-[11px] text-neutral-500">Before monthly unpaid leave LOP</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-400">
                      {formatCurrency(monthlyWage - (pfEmployee + professionalTax))}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY (Password change) */}
        {activeTab === 'security' && (
          <Card className="p-6 max-w-md space-y-4">
            <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider pb-2 border-b border-neutral-800">
              Change Account Password
            </h3>
            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Min 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <Button variant="primary" size="sm" className="w-full mt-2">
                Update Password
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
