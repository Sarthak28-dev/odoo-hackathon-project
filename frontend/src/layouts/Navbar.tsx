import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../contexts/AttendanceContext';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { formatTime } from '../lib/utils';
import {
  Users,
  CalendarCheck2,
  Clock3,
  DollarSign,
  BarChart3,
  LogOut,
  User,
  LogIn,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { profile, company, role, signOut, switchMockRole } = useAuth();
  const { isCheckedIn, checkInTime, checkIn, checkOut } = useAttendance();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSystrayOpen, setIsSystrayOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const systrayRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (systrayRef.current && !systrayRef.current.contains(e.target as Node)) {
        setIsSystrayOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/employees', label: 'Employees', icon: <Users className="w-4 h-4" /> },
    { path: '/attendance', label: 'Attendance', icon: <CalendarCheck2 className="w-4 h-4" /> },
    { path: '/time-off', label: 'Time Off', icon: <Clock3 className="w-4 h-4" /> },
    { path: '/payroll', label: 'Payroll', icon: <DollarSign className="w-4 h-4" /> },
    { path: '/reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/90 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Company Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-neutral-100 tracking-tight flex items-center gap-1.5">
                Dayflow
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                  HRMS
                </span>
              </span>
              <p className="text-[11px] text-neutral-400 font-medium truncate max-w-[130px]">
                {company?.name || 'Odoo India'}
              </p>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80 border border-transparent'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls: Systray Check-in/out & User Avatar */}
        <div className="flex items-center gap-3">
          {/* Quick Mock Role Switcher Badge (for testing both personas) */}
          <div className="hidden lg:flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => switchMockRole('employee')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                role === 'employee'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Employee View
            </button>
            <button
              type="button"
              onClick={() => switchMockRole('admin')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                role === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              HR Admin View
            </button>
          </div>

          {/* Attendance Check-in / Check-out Systray Popup */}
          <div className="relative" ref={systrayRef}>
            <button
              type="button"
              onClick={() => setIsSystrayOpen(!isSystrayOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer"
              title={isCheckedIn ? 'Status: Checked In' : 'Status: Checked Out'}
            >
              {/* Presence Dot: Red (checked out) vs Green (checked in) */}
              <span className="relative flex h-3 w-3">
                {isCheckedIn && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isCheckedIn ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="text-xs font-medium text-neutral-300 hidden sm:inline">
                {isCheckedIn ? 'Checked In' : 'Checked Out'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {/* Systray Dropdown Menu matching Wireframe */}
            {isSystrayOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Systray Presence
                  </span>
                  <Badge variant={isCheckedIn ? 'present' : 'absent'}>
                    {isCheckedIn ? 'Active' : 'Offline'}
                  </Badge>
                </div>

                {isCheckedIn ? (
                  <div className="space-y-3">
                    <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 text-center">
                      <p className="text-xs text-neutral-400">Working Since</p>
                      <p className="text-base font-bold text-emerald-400 mt-0.5">
                        {formatTime(checkInTime)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await checkOut();
                        setIsSystrayOpen(false);
                      }}
                      className="w-full py-2 px-3 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check Out &rarr;</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-400 text-center">
                      You are not checked in for today yet.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await checkIn();
                        setIsSystrayOpen(false);
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Check IN &rarr;</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Avatar Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-purple-500/30 transition-all cursor-pointer"
            >
              <Avatar
                src={profile?.avatar_url}
                name={`${profile?.first_name} ${profile?.last_name}`}
                size="sm"
              />
            </button>

            {/* Avatar Dropdown Menu matching Wireframe */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-neutral-800">
                  <p className="text-sm font-semibold text-neutral-100 truncate">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-purple-400 font-mono mt-0.5">
                    {profile?.login_id}
                  </p>
                  <div className="mt-1.5">
                    <Badge variant={role === 'admin' ? 'admin' : 'employee'} />
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-neutral-400" />
                    <span>Dashboard</span>
                  </Link>
                </div>

                <div className="border-t border-neutral-800 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden border-t border-neutral-800/80 bg-neutral-950 px-4 py-2 flex items-center justify-around">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
                isActive ? 'text-purple-400' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
