'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, CalendarDays, Upload, BarChart2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        if (!error && !data?.user) { // Not logged in, no Supabase error
            setUser(null);
        }
      } else {
        setUser(data.user);
      }
      setLoading(false); // Auth loading is complete
    };
    checkUser();
  }, [router]);

  if (loading) { // This is for user auth loading
    return <p>Loading...</p>;
  }

  if (!user) {
    return null; // Or a redirect component, router.push already handles it
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Dashboard Tile */}
            <Link href="/admin/dashboard" className="group">
              <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-50 p-3 rounded-md">
                    <BarChart2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                      Quick Stats
                    </h3>
                    <p className="text-sm text-gray-500">
                      View key metrics and analytics
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Manage Players Tile */}
            <Link href="/admin/players" className="group">
              <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-50 p-3 rounded-md">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      Manage Players
                    </h3>
                    <p className="text-sm text-gray-500">
                      Add, edit, or remove player records
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Manage Matches Tile */}
            <Link href="/admin/matches" className="group">
              <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-50 p-3 rounded-md">
                    <CalendarDays className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                      Manage Matches
                    </h3>
                    <p className="text-sm text-gray-500">
                      Schedule and manage match records
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Import Historical Data Tile */}
            <Link href="/admin/import" className="group">
              <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-50 p-3 rounded-md">
                    <Upload className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-amber-600 transition-colors duration-200">
                      Import Data
                    </h3>
                    <p className="text-sm text-gray-500">
                      Import historical data from CSV files
                    </p>
              </div>
            </div>
        </div>
          </Link>
          </div>
        </div>
      </main>
    </div>
  );
}