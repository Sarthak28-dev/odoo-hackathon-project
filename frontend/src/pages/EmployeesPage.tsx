import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { employeeService } from '../services/employeeService';
import type { PresenceIndicator, Profile } from '../types';
import { Plus, Search, Mail, Phone, MapPin, Building, Briefcase, CheckCircle2 } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceIndicator>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [jobPosition, setJobPosition] = useState('Software Engineer');
  const [managerName, setManagerName] = useState('');
  const [location, setLocation] = useState('Bangalore, India');
  const [monthlyWage, setMonthlyWage] = useState(100000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    login_id: string;
    email: string;
    temporary_password?: string;
  } | null>(null);

  const fetchDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [{ data: empData, error: empError }, presMap] = await Promise.all([
        employeeService.getEmployees(),
        employeeService.getTodayPresenceMap(),
      ]);

      if (empError) throw empError;
      setEmployees(empData || []);
      setPresenceMap(presMap);
    } catch (err: any) {
      console.error('Failed to load employee directory:', err);
      setError(err.message || 'Unable to fetch employee directory from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return (
      fullName.includes(query) ||
      (emp.login_id && emp.login_id.toLowerCase().includes(query)) ||
      (emp.department && emp.department.toLowerCase().includes(query)) ||
      (emp.job_position && emp.job_position.toLowerCase().includes(query))
    );
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const { data, error: createError } = await employeeService.createEmployee({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        department,
        job_position: jobPosition,
        manager_name: managerName,
        location,
        monthly_wage: Number(monthlyWage),
      });

      if (createError) {
        throw createError;
      }

      if (data?.user) {
        setCreatedCredentials({
          login_id: data.user.login_id || 'Generated',
          email: data.user.email,
          temporary_password: data.user.temporary_password,
        });
        await fetchDirectory();
      } else {
        setIsCreateModalOpen(false);
        await fetchDirectory();
      }
    } catch (err: any) {
      console.error('Create employee failed:', err);
      setFormError(err.message || 'Failed to create employee via backend Edge Function.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setIsCreateModalOpen(false);
    setCreatedCredentials(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setManagerName('');
    setFormError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Employees Directory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            View employee profiles, presence status, and organizational assignments
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Real-time Searchbar */}
          <div className="relative flex-1 sm:w-72">
            <Input
              placeholder="Search by name, ID, or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-neutral-400" />}
              className="py-1.5 text-xs"
            />
          </div>

          {/* Admin "+ New" Employee Action */}
          {role === 'admin' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Employee
            </Button>
          )}
        </div>
      </div>

      {/* Directory Content States */}
      {isLoading ? (
        <LoadingState message="Loading directory from Supabase..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDirectory} />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description={searchQuery ? 'Try adjusting your search criteria.' : 'No team members registered yet.'}
          actionLabel={role === 'admin' ? 'Add Employee' : undefined}
          onAction={role === 'admin' ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        /* Employee Grid conforming to Wireframe 2 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => {
            const presence = presenceMap[emp.id] || 'absent';
            return (
              <Card
                key={emp.id}
                hoverable
                onClick={() => navigate(`/profile?id=${emp.id}`)}
                className="p-5 flex flex-col justify-between transition-all duration-200 group bg-neutral-900/80 border-neutral-800"
              >
                <div>
                  {/* Top Avatar & Presence Pill */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="relative">
                      <Avatar
                        src={emp.avatar_url}
                        name={`${emp.first_name} ${emp.last_name}`}
                        size="lg"
                        className="ring-2 ring-neutral-700/60 group-hover:ring-purple-500/60 transition-all"
                      />
                      {/* Presence Dot: Green (present), Yellow (on_leave), Gray (absent) */}
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-neutral-900 ${
                          presence === 'present'
                            ? 'bg-emerald-500'
                            : presence === 'on_leave'
                            ? 'bg-amber-400'
                            : 'bg-neutral-500'
                        }`}
                        title={`Status: ${presence.replace('_', ' ')}`}
                      />
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        presence === 'present'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : presence === 'on_leave'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {presence === 'on_leave' ? 'On Leave' : presence}
                    </span>
                  </div>

                  {/* Name & Job Title */}
                  <h3 className="font-semibold text-neutral-100 text-sm group-hover:text-purple-300 transition-colors line-clamp-1">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5 line-clamp-1">
                    <Briefcase className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                    <span>{emp.job_position || 'Associate'}</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-1.5 text-xs text-neutral-400">
                    <div className="flex items-center gap-2 truncate">
                      <Building className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                      <span className="truncate">{emp.department || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                      <span className="truncate text-neutral-300">{emp.email}</span>
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                        <span className="truncate">{emp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Tag: Login ID */}
                <div className="mt-4 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>ID: <code className="text-neutral-300 font-mono">{emp.login_id}</code></span>
                  <span className="text-purple-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    View →
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Admin Onboarding Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={resetModal}
        title={createdCredentials ? 'Employee Credentials Generated' : 'Create New Employee'}
        size="lg"
      >
        {createdCredentials ? (
          <div className="space-y-4 py-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Employee Successfully Provisioned!</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Provide these temporary credentials to the new employee for initial sign-in:
              </p>
            </div>

            <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Assigned Login ID:</span>
                <code className="font-mono font-bold text-purple-400">{createdCredentials.login_id}</code>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Work Email:</span>
                <span className="text-neutral-200">{createdCredentials.email}</span>
              </div>
              {createdCredentials.temporary_password && (
                <div className="flex justify-between py-1 bg-amber-950/20 px-2 rounded">
                  <span className="text-amber-400 font-semibold">Temporary Password:</span>
                  <code className="font-mono font-bold text-amber-300">{createdCredentials.temporary_password}</code>
                </div>
              )}
            </div>

            <Button variant="primary" className="w-full" onClick={resetModal}>
              Done & Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Rahul"
                required
              />
              <Input
                label="Last Name *"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sharma"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Work Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@company.com"
                required
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
              />
              <Input
                label="Job Position"
                value={jobPosition}
                onChange={(e) => setJobPosition(e.target.value)}
                placeholder="Software Engineer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Manager Name"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Ananya Roy"
              />
              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bangalore, India"
              />
            </div>

            <Input
              label="Monthly Gross Wage (₹ INR)"
              type="number"
              value={monthlyWage}
              onChange={(e) => setMonthlyWage(Number(e.target.value))}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <Button type="button" variant="outline" onClick={resetModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Provision Employee
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
