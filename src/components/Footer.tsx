'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-6 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-6">
          <Link href="/" className="text-white hover:text-blue-300 transition-colors text-sm">
            Home
          </Link>
          <Link href="/players" className="text-white hover:text-blue-300 transition-colors text-sm">
            Players
          </Link>
          <Link href="/teams" className="text-white hover:text-blue-300 transition-colors text-sm">
            Teams
          </Link>
          <Link href="/matches" className="text-white hover:text-blue-300 transition-colors text-sm">
            Matches
          </Link>
          <Link href="/analytics" className="text-white hover:text-blue-300 transition-colors text-sm">
            Analytics
          </Link>
          <Link href="/stats" className="text-white hover:text-blue-300 transition-colors text-sm">
            Statistics
          </Link>
          <Link href="/admin" className="text-white hover:text-blue-300 transition-colors text-sm">
            Admin
          </Link>
        </div>
        <p>&copy; {currentYear} Football Stats App. All rights reserved.</p>
      </div>
    </footer>
  );
} 