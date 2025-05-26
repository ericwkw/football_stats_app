'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Users, Trophy, Calendar, Home, LogOut } from 'lucide-react';
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
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link 
                  href="/admin" 
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive('/admin') && !isActive('/admin/players') && !isActive('/admin/teams') && !isActive('/admin/matches') 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Home className="mr-1" size={16} /> Dashboard
                </Link>
                <Link 
                  href="/admin/players" 
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive('/admin/players') 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Users className="mr-1" size={16} /> Players
                </Link>
                <Link 
                  href="/admin/teams" 
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive('/admin/teams') 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Trophy className="mr-1" size={16} /> Teams
                </Link>
                <Link 
                  href="/admin/matches" 
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive('/admin/matches') 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Calendar className="mr-1" size={16} /> Matches
                </Link>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center">
            <Link 
              href="/" 
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              View Site
            </Link>
            <button 
              onClick={handleLogout}
              className="ml-4 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <LogOut className="mr-1" size={16} /> Logout
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/admin" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/admin') && !isActive('/admin/players') && !isActive('/admin/teams') && !isActive('/admin/matches') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Home className="mr-2" size={18} /> Dashboard
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
              href="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <Home className="mr-2" size={18} /> View Site
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