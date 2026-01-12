'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, Star, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Animated Logo */}
      <motion.div
        initial={false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 1, bounce: 0.5 }}
        className="relative"
      >
        <div className="w-32 h-32 bg-gradient-to-br from-nebula-purple to-nebula-pink rounded-full flex items-center justify-center shadow-2xl">
          <Rocket className="w-16 h-16 text-white" />
        </div>

        {/* Orbiting stars */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <Star className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-star-gold fill-star-gold" />
          <Star className="absolute top-1/2 -right-4 -translate-y-1/2 w-4 h-4 text-star-gold fill-star-gold" />
          <Star className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-5 h-5 text-star-gold fill-star-gold" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-4xl md:text-5xl font-bold text-white text-center"
      >
        SG Math Pal
      </motion.h1>

      <motion.p
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-4 text-xl text-muted-foreground text-center max-w-md"
      >
        Your Space Math Adventure Awaits!
      </motion.p>

      {/* Start Button */}
      <Link href="/dashboard">
        <motion.button
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-12 px-8 py-4 bg-gradient-to-r from-nebula-purple to-nebula-blue rounded-full text-white font-bold text-xl shadow-lg btn-glow flex items-center gap-3"
        >
          <Sparkles className="w-6 h-6" />
          Launch Mission
        </motion.button>
      </Link>

      {/* Features Preview */}
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
      >
        {[
          { icon: '🪐', title: 'Explore Topics', desc: 'Visit planets to practice different math skills' },
          { icon: '⭐', title: 'Earn XP', desc: 'Level up through 5 tiers: Iron to Platinum' },
          { icon: '🏆', title: 'Unlock Badges', desc: 'Complete challenges and collect achievements' },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 + i * 0.2 }}
            className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-2xl p-6 text-center"
          >
            <span className="text-4xl">{feature.icon}</span>
            <h3 className="mt-3 text-lg font-bold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Version badge */}
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="mt-12 text-xs text-muted-foreground"
      >
        v0.1.0 - Setting up for launch...
      </motion.div>
    </div>
  );
}
