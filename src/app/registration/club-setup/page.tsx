'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, basePath } from '@/db/dbClient';
import { useTournament } from '@/context/TournamentContext';
import { Shield, Building, User, Mail, Phone, MapPin } from 'lucide-react';

export default function ClubSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');
  
  const { userEmail, userRole, isLoggedIn } = useTournament();

  const [clubName, setClubName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn || userRole !== 'Club') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            You must be logged in as a Club representative to setup a club.
          </p>
          <button 
            onClick={() => router.push(`${basePath}/login?redirect=/registration/club-setup&event=${eventId}`)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!clubName || !contactName) {
        throw new Error('Club Name and Contact Name are required.');
      }

      await db.clubs.add({
        name: clubName.trim(),
      });

      // Proceed to entry
      router.push(`${basePath}/registration/entry?event=${eventId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to setup club.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Club Setup
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please provide your Dojo/Club details to proceed with registration.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dojo / Club Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g. Senshi Goju-Ryu"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instructor / Contact Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Full Name"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  disabled
                  value={userEmail}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Your account email will be used for correspondence.</p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="+60 12-345 6789"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Club/Dojo Address"
                />
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
            >
              {loading ? 'Creating Club...' : 'Save & Continue to Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
