'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AdminNavbar from '@/components/Navigation/AdminNavbar';
import AdminFooter from '@/components/Navigation/AdminFooter';
import type { User } from '@supabase/supabase-js';

// Add a comment to clarify that we're intentionally not using the main Navbar in admin pages
// The parent layout will render the default Navbar, but we'll replace it with AdminNavbar

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  // Add CSS that hides the main Navbar and Footer for the admin section
  useEffect(() => {
    // Hide the main navbar and footer when in admin section
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hide the main navbar and footer when in admin section */
      body > nav:first-of-type,
      body > footer:last-of-type {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Clean up when component unmounts
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to login via router.push
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <AdminFooter />
    </div>
  );
} 