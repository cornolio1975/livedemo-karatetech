'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, basePath } from '@/db/dbClient';
import { useTournament } from '@/context/TournamentContext';
import { Participant, Club, Tournament } from '@/db/types';
import { Shield, Plus, Save, Trash2, Send } from 'lucide-react';

export default function ParticipantEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');
  
  const { userEmail, userRole, isLoggedIn } = useTournament();

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  
  const [participants, setParticipants] = useState<Partial<Participant>[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Club') {
      router.push(`${basePath}/login?redirect=/registration/entry&event=${eventId}`);
      return;
    }

    async function loadContext() {
      try {
        if (!eventId) throw new Error('No tournament event specified.');

        const [tList, cList] = await Promise.all([
          db.tournaments.list(),
          db.clubs.list()
        ]);

        const tFound = tList.find(t => t.id === eventId);
        if (!tFound) throw new Error('Tournament not found.');
        if (tFound.status !== 'Open') throw new Error('Registration is currently closed for this tournament.');
        
        setTournament(tFound);
        setClubs(cList);
        
        if (cList.length > 0) {
          // Default to the last created club as a mock assumption for the club user's club
          setSelectedClubId(cList[cList.length - 1].id);
        }

        // Add one empty row to start
        setParticipants([{ full_name: '', gender: 'Male', dob: '2010-01-01', weight: 0, passport_ic: '' }]);

      } catch (err: any) {
        setError(err.message || 'Failed to load tournament context.');
      } finally {
        setLoading(false);
      }
    }
    
    loadContext();
  }, [eventId, isLoggedIn, userRole, router]);

  const handleAddRow = () => {
    setParticipants([...participants, { full_name: '', gender: 'Male', dob: '2010-01-01', weight: 0, passport_ic: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = [...participants];
    updated.splice(index, 1);
    setParticipants(updated);
  };

  const handleUpdateRow = (index: number, field: keyof Participant, value: any) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const handleSaveDraft = async () => {
    if (!selectedClubId) {
      setError('Please select your authorized Club before saving.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    // In a real app, we'd save to a draft table or with status Draft.
    // For this prototype, we'll just simulate a successful save.
    setTimeout(() => {
      setSuccess('Draft saved successfully! You can resume later.');
      setSaving(false);
    }, 1000);
  };

  const handleSaveAndSend = async () => {
    if (!selectedClubId) {
      setError('Please select your authorized Club before submitting.');
      return;
    }

    const validParticipants = participants.filter(p => p.full_name && p.passport_ic);
    if (validParticipants.length === 0) {
      setError('Please fill in at least one participant with a Name and ID/Passport.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      for (const p of validParticipants) {
        await db.participants.add({
          full_name: p.full_name!,
          gender: p.gender as 'Male' | 'Female',
          dob: p.dob || '2000-01-01',
          passport_ic: p.passport_ic!,
          weight: p.weight || 0,
          height: p.height || 0,
          club_id: selectedClubId,
          status: 'Pending',
          medical_status: 'Cleared',
          payment_status: 'Unpaid'
        });
      }
      setSuccess(`Successfully submitted ${validParticipants.length} participants to KarateTech system!`);
      setParticipants([{ full_name: '', gender: 'Male', dob: '2010-01-01', weight: 0, passport_ic: '' }]);
    } catch (err: any) {
      setError(err.message || 'Failed to submit participants.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Registration Locked</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header Context */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-6 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Participant Entry Portal</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tournament: <span className="font-semibold text-gray-900 dark:text-gray-200">{tournament?.name}</span>
            </p>
          </div>
          
          <div className="flex flex-col md:items-end">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Authorized Club Context</label>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm px-4 py-2 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500"
            >
              <option value="" disabled>Select your Club</option>
              {clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 font-medium flex items-center gap-3">
            <Shield className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 font-medium">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">Full Name *</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Passport / IC *</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">Gender</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Date of Birth</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Weight (kg)</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {participants.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={p.full_name || ''}
                        onChange={(e) => handleUpdateRow(idx, 'full_name', e.target.value)}
                        placeholder="Athlete Name"
                        className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="text"
                        value={p.passport_ic || ''}
                        onChange={(e) => handleUpdateRow(idx, 'passport_ic', e.target.value)}
                        placeholder="ID/Passport"
                        className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <select
                        value={p.gender || 'Male'}
                        onChange={(e) => handleUpdateRow(idx, 'gender', e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="date"
                        value={p.dob || ''}
                        onChange={(e) => handleUpdateRow(idx, 'dob', e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="number"
                        value={p.weight || 0}
                        onChange={(e) => handleUpdateRow(idx, 'weight', parseFloat(e.target.value))}
                        className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 dark:text-white"
                        min="0"
                        step="0.1"
                      />
                    </td>
                    <td className="px-6 py-2 text-right">
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Remove Participant"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Total Entries: {participants.length}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> Save Draft
          </button>
          
          <button
            onClick={handleSaveAndSend}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" /> Save & Send to KarateTech
          </button>
        </div>

      </div>
    </div>
  );
}
