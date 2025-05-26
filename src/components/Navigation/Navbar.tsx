'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Menu, X } from 'lucide-react';

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
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/teams" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/teams') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                Teams
              </Link>
              <Link 
                href="/players" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/players') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                Players
              </Link>
              <Link 
                href="/matches" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/matches') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                Matches
              </Link>
              <Link 
                href="/analytics" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/analytics') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                Analytics
              </Link>
              
              {isLoggedIn && (
                <Link 
                  href="/admin" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                  }`}
                >
                  Admin
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
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-500 focus:outline-none"
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
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/teams" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/teams') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Teams
            </Link>
            <Link 
              href="/players" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/players') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Players
            </Link>
            <Link 
              href="/matches" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/matches') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Matches
            </Link>
            <Link 
              href="/analytics" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/analytics') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Analytics
            </Link>
            
            {isLoggedIn && (
              <Link 
                href="/admin" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/admin') ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Admin
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