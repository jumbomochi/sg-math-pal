'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { CreateProfileForm } from '@/components/profiles/CreateProfileForm';

interface Profile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  totalXp: number;
  isActive: boolean;
}

interface ProfilesClientProps {
  initialProfiles: Profile[];
}

export function ProfilesClient({ initialProfiles }: ProfilesClientProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectProfile = async (profileId: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });

      if (response.ok) {
        // Update local state
        setProfiles(prev =>
          prev.map(p => ({ ...p, isActive: p.id === profileId }))
        );
        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to switch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async (name: string, avatar: string, color: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar, color }),
      });

      if (response.ok) {
        const { profile } = await response.json();
        setProfiles(prev => [profile, ...prev.map(p => ({ ...p, isActive: false }))]);
        setShowCreateForm(false);
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Profiles</h1>
            <p className="text-muted-foreground">Switch or create a profile</p>
          </div>
        </div>

        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nebula-purple hover:bg-nebula-purple/80 text-white font-semibold transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Profile
          </button>
        )}
      </div>

      {/* Content */}
      {showCreateForm ? (
        <div className="max-w-md mx-auto">
          <CreateProfileForm
            onSubmit={handleCreateProfile}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProfileCard
                profile={profile}
                onSelect={() => handleSelectProfile(profile.id)}
                isSelected={profile.isActive}
              />
            </motion.div>
          ))}

          {/* Add Profile Card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: profiles.length * 0.1 }}
            onClick={() => setShowCreateForm(true)}
            className="w-full p-6 rounded-2xl border border-dashed border-white/20 hover:border-nebula-purple/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <span className="text-gray-400 font-medium">Add Profile</span>
          </motion.button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-8 h-8 border-2 border-nebula-purple border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
