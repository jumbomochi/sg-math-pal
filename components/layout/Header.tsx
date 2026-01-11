'use client';

import Link from 'next/link';
import { Rocket, Flame, Star, Menu, User } from 'lucide-react';
import { useState } from 'react';
import { SoundToggle } from '@/components/audio/SoundToggle';

interface HeaderProps {
  studentName?: string;
  totalXp?: number;
  currentStreak?: number;
}

export function Header({
  studentName = 'Space Explorer',
  totalXp = 0,
  currentStreak = 0
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-space-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Rocket className="h-8 w-8 text-nebula-purple group-hover:text-nebula-pink transition-colors" />
              <div className="absolute -inset-1 bg-nebula-purple/20 rounded-full blur-sm group-hover:bg-nebula-pink/20 transition-colors" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">
              SG Math Pal
            </span>
          </Link>

          {/* Stats Bar - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {/* XP Display */}
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-star-gold" />
              <span className="font-semibold text-star-gold">{totalXp.toLocaleString()} XP</span>
            </div>

            {/* Streak Display */}
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-comet-orange" />
              <span className="font-semibold text-comet-orange">{currentStreak} day streak</span>
            </div>

            {/* Sound Toggle */}
            <SoundToggle size="sm" />

            {/* Profile Button */}
            <Link
              href="/profiles"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <User className="h-4 w-4 text-gray-300" />
              <span className="text-sm text-gray-300">{studentName}</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6 text-gray-300" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-4">
              {/* Mobile Stats */}
              <div className="flex items-center justify-around">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-star-gold" />
                  <span className="font-semibold text-star-gold">{totalXp.toLocaleString()} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-comet-orange" />
                  <span className="font-semibold text-comet-orange">{currentStreak}</span>
                </div>
              </div>

              {/* Mobile Sound Toggle */}
              <div className="flex justify-center">
                <SoundToggle size="md" />
              </div>

              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profiles"
                  className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profiles
                </Link>
                <Link
                  href="/questions"
                  className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Question Bank
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
