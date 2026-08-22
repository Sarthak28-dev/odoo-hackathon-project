import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d12] text-neutral-100 antialiased font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="w-full border-t border-neutral-800/60 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Dayflow HRMS. Every workday, perfectly aligned.</p>
          <p className="text-neutral-600 font-mono">Dayflow v1.0.0 • Hackathon MVP</p>
        </div>
      </footer>
    </div>
  );
};
