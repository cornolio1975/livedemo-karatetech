'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, basePath } from '@/db/dbClient';
import { Tournament } from '@/db/types';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

function RegistrationStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournament() {
      if (!eventId) {
        setLoading(false);
        return;
      }
      try {
        const tournaments = await db.tournaments.list();
        const found = tournaments.find(t => t.id === eventId);
        if (found) {
          setTournament(found);
        }
      } catch (err) {
        console.error('Failed to load tournament:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTournament();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Tournament Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We couldn't find the requested tournament. Please return to the public landing page and select a valid tournament.
          </p>
          <button 
            onClick={() => window.location.href = 'https://spsportdatasolution.org'}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const isOpen = tournament.status === 'Open';

  const handleRegistrationClick = () => {
    if (isOpen) {
      router.push(`${basePath}/login?redirect=/registration/entry&event=${tournament.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-12 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold tracking-wide mb-4">
            TOURNAMENT REGISTRATION
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            {tournament.name}
          </h1>
          <p className="text-red-100 max-w-2xl mx-auto text-lg">
            Register your club and participants for this upcoming KarateTech tournament.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              Registration Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Event Date</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {tournament.date || (tournament.date_iso ? new Date(tournament.date_iso).toLocaleDateString() : 'TBA')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Venue</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{tournament.venue}, {tournament.city}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Registration Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Registration Closes</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {tournament.registration_close || (tournament.registration_close_iso ? new Date(tournament.registration_close_iso).toLocaleDateString() : 'TBA')}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleRegistrationClick}
                disabled={!isOpen}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                  isOpen 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {isOpen ? 'REGISTRATION' : 'REGISTRATION CLOSED'}
                {isOpen && <ArrowRight className="w-5 h-5" />}
              </button>
              {isOpen && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                  You will be directed to log in or create your Club account.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationStartPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <RegistrationStartContent />
    </Suspense>
  );
}
