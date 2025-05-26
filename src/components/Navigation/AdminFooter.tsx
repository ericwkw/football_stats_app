'use client';

import Link from 'next/link';

export default function AdminFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex flex-wrap justify-center gap-6">
            <Link href="/admin" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
              Admin Home
            </Link>
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
              Quick Stats
            </Link>
            <Link href="/admin/players" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
              Players
            </Link>
            <Link href="/admin/teams" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
              Teams
            </Link>
            <Link href="/admin/matches" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
              Matches
            </Link>
            <Link href="/admin/import" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
              Import Data
            </Link>
            <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
              View Site
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            © {currentYear} Football Stats App Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 