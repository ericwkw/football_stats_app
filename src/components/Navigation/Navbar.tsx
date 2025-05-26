'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Menu, X, Home, Users, Award, Calendar, BarChart2, Shield } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
    };
    
    checkAuthStatus();
  }, []);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="font-bold text-xl">
              Football Stats
            </Link>
          </div>
          
          {/* Desktop Navigation - only show first 2 items on medium screens */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive('/') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                <Home className="mr-1" size={16} /> Home
              </Link>
              <Link 
                href="/teams" 
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive('/teams') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                <Award className="mr-1" size={16} /> Teams
              </Link>
              <Link 
                href="/players" 
                className={`hidden lg:flex px-3 py-2 rounded-md text-sm font-medium items-center ${
                  isActive('/players') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                <Users className="mr-1" size={16} /> Players
              </Link>
              <Link 
                href="/matches" 
                className={`hidden lg:flex px-3 py-2 rounded-md text-sm font-medium items-center ${
                  isActive('/matches') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                <Calendar className="mr-1" size={16} /> Matches
              </Link>
              <Link 
                href="/analytics" 
                className={`hidden xl:flex px-3 py-2 rounded-md text-sm font-medium items-center ${
                  isActive('/analytics') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                <BarChart2 className="mr-1" size={16} /> Analytics
              </Link>
              
              {isLoggedIn && (
                <Link 
                  href="/admin" 
                  className={`hidden xl:flex px-3 py-2 rounded-md text-sm font-medium items-center ${
                    isActive('/admin') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                  }`}
                >
                  <Shield className="mr-1" size={16} /> Admin
                </Link>
              )}

              {!isLoggedIn ? (
                <Link 
                  href="/login" 
                  className="ml-4 px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Login
                </Link>
              ) : (
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsLoggedIn(false);
                    window.location.href = '/';
                  }}
                  className="ml-4 px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile/Tablet menu button - show on medium screens too for some links */}
          <div className="md:block lg:block">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-500 focus:outline-none"
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
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Home className="mr-2" size={18} /> Home
            </Link>
            <Link 
              href="/teams" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/teams') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Award className="mr-2" size={18} /> Teams
            </Link>
            <Link 
              href="/players" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/players') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Users className="mr-2" size={18} /> Players
            </Link>
            <Link 
              href="/matches" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/matches') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Calendar className="mr-2" size={18} /> Matches
            </Link>
            <Link 
              href="/analytics" 
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/analytics') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <BarChart2 className="mr-2" size={18} /> Analytics
            </Link>
            
            {isLoggedIn && (
              <Link 
                href="/admin" 
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  isActive('/admin') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Shield className="mr-2" size={18} /> Admin
              </Link>
            )}

            {!isLoggedIn ? (
              <Link 
                href="/login" 
                className="block px-3 py-2 rounded-md text-base font-medium bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            ) : (
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsLoggedIn(false);
                  setIsOpen(false);
                  window.location.href = '/';
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-white text-blue-600 hover:bg-gray-100"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 