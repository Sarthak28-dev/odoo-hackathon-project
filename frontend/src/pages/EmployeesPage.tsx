import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { mockProfiles, mockAttendanceRecords } from '../services/mockData';
import type { PresenceIndicator, Profile } from '../types';
import { Plus, Search, Mail, Phone, MapPin, Building, Briefcase } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Profile[]>(mockProfiles);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Employee Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [jobPosition, setJobPosition] = useState('Software Engineer');

  // Determine presence for each employee based on mock attendance
  const getEmployeePresence = (userId: string): PresenceIndicator => {
    const record = mockAttendanceRecords.find((r) => r.user_id === userId);
    if (record?.status === 'on_leave') return 'on_leave';
    if (record?.check_in && !record?.check_out) return 'present';
    if (record?.status === 'present') return 'present';
    return 'absent';
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return (
      fullName.includes(query) ||
      emp.login_id.toLowerCase().includes(query) ||
      (emp.department && emp.department.toLowerCase().includes(query)) ||
      (emp.job_position && emp.job_position.toLowerCase().includes(query))
    );
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Profile = {
      ...mockProfiles[1],
      id: `u-${Date.now()}`,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      department,
      job_position: jobPosition,
      login_id: `OI${firstName.slice(0, 2).toUpperCase()}${lastName.slice(0, 2).toUpperCase()}2026${String(
        employees.length + 1
      ).padStart(4, '0')}`,
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + employees.length}?auto=format&fit=crop&q=80&w=250`,
      role: 'employee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEmployees([newEmp, ...employees]);
    setIsCreateModalOpen(false);
    // Reset form
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Action Controls matching Wireframe 2 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Employees Directory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            View employee profiles, presence status, and team assignments
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

          {/* NEW Employee Button (for HR Admin) matching Wireframe 2 */}
          {role === 'admin' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
              className="shrink-0"
            >
              NEW
            </Button>
          )}
        </div>
      </div>

      {/* Status Legend matching Wireframe 2 */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded-xl text-xs text-neutral-400">
        <span className="font-semibold text-neutral-300">Status Indicator:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Present in office</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>On Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Absent (No time-off)</span>
        </div>
      </div>

      {/* Employee Cards Grid matching Wireframe 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployees.map((emp) => {
          const presence = getEmployeePresence(emp.id);
          return (
            <Card
              key={emp.id}
              interactive
              hoverEffect
              onClick={() => navigate(`/profile?id=${emp.id}`)}
              className="p-5 flex flex-col justify-between relative group"
            >
              {/* Card Header: Avatar with Presence Dot & Login ID */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <Avatar
                    src={emp.avatar_url}
                    name={`${emp.first_name} ${emp.last_name}`}
                    size="lg"
                    presence={presence}
                  />
                  <div>
                    <h3 className="font-semibold text-base text-neutral-100 group-hover:text-purple-300 transition-colors">
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <p className="text-xs text-purple-400 font-mono mt-0.5">{emp.login_id}</p>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-neutral-500" />
                      <span>{emp.job_position || 'Team Member'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Body: Department & Contact */}
              <div className="mt-4 pt-4 border-t border-neutral-800/80 space-y-1.5 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="truncate">{emp.department || 'General'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="truncate text-neutral-300">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{emp.location}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="py-16 text-center text-neutral-400 bg-neutral-900/40 rounded-xl border border-neutral-800">
          No employees found matching "{searchQuery}".
        </div>
      )}

      {/* NEW Employee Modal for HR Admin */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Employee"
        description="Provision a new employee record. Login ID and initial credentials will be auto-generated."
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateEmployee}>
              Save & Generate ID
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="e.g. Rahul"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              placeholder="e.g. Verma"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="rahul.v@dayflow.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department"
              placeholder="e.g. Engineering"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
            <Input
              label="Job Position"
              placeholder="e.g. Frontend Engineer"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs text-purple-300">
            <p className="font-semibold">Auto-Generated Login ID:</p>
            <p className="font-mono mt-0.5">
              {firstName && lastName
                ? `OI${firstName.slice(0, 2).toUpperCase()}${lastName.slice(0, 2).toUpperCase()}2026${String(
                    employees.length + 1
                  ).padStart(4, '0')}`
                : 'OI----2026----'}
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};
