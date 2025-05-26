'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Football Stats App</h3>
            <p className="text-gray-600 max-w-md">
              Your source for comprehensive football statistics and performance analytics.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Navigate</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/teams" className="text-gray-600 hover:text-indigo-600 transition-colors">
                    Teams
                  </Link>
                </li>
                <li>
                  <Link href="/players" className="text-gray-600 hover:text-indigo-600 transition-colors">
                    Players
                  </Link>
                </li>
                <li>
                  <Link href="/matches" className="text-gray-600 hover:text-indigo-600 transition-colors">
                    Matches
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">More</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-gray-600 hover:text-indigo-600 transition-colors">
                    Admin Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} Football Stats App. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 