'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Users, Trophy, Calendar, LogOut, Upload, BarChart2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/admin" className="font-bold text-xl flex items-center">
                <Trophy className="mr-2" size={24} /> Football Stats Admin
              </Link>
            </div>
            
            {/* Desktop Navigation - only show first 3 items on medium screens */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link 
                  href="/admin/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive('/admin/dashboard')
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <BarChart2 className="mr-1" size={16} /> Quick Stats
                </Link>
                <Link 
                  href="/admin/players" 
                  className={`hidden lg:flex px-3 py-2 rounded-md text-sm font-medium items-center ${
                    isActive('/admin/players') 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Users className="mr-1" size={16} /> Players
                </Link>
                <Link 
                  href="/admin/teams" 
                  className={`hidden lg:flex px-3 py-2 rounded-md text-sm font-medium items-center ${
                    isActive('/admin/teams') 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Trophy className="mr-1" size={16} /> Teams
                </Link>
                <Link 
                  href="/admin/matches" 
                  className={`hidden xl:flex px-3 py-2 rounded-md text-sm font-medium items-center ${
                    isActive('/admin/matches') 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Calendar className="mr-1" size={16} /> Matches
                </Link>
                <Link 
                  href="/admin/import" 
                  className={`hidden xl:flex px-3 py-2 rounded-md text-sm font-medium items-center ${
                    isActive('/admin/import') 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Upload className="mr-1" size={16} /> Import Data
                </Link>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center">
            <Link 
              href="/" 
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <ExternalLink className="mr-1" size={16} /> View Site
            </Link>
            <button 
              onClick={handleLogout}
              className="ml-4 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <LogOut className="mr-1" size={16} /> Logout
            </button>
          </div>
          
          {/* Mobile/Tablet menu button - show on medium screens too for some links */}
          <div className="md:block">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Navigation */}
      {isOpen && (
        <div>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/admin/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/admin/dashboard')
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <BarChart2 className="mr-2" size={18} /> Quick Stats
            </Link>
            <Link 
              href="/admin/players" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/admin/players') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Users className="mr-2" size={18} /> Players
            </Link>
            <Link 
              href="/admin/teams" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/admin/teams') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Trophy className="mr-2" size={18} /> Teams
            </Link>
            <Link 
              href="/admin/matches" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/admin/matches') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Calendar className="mr-2" size={18} /> Matches
            </Link>
            <Link 
              href="/admin/import" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/admin/import') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Upload className="mr-2" size={18} /> Import Data
            </Link>
            <Link 
              href="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <ExternalLink className="mr-2" size={18} /> View Site
            </Link>
            <button 
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
            >
              <LogOut className="mr-2" size={18} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
} 