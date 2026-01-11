'use client';

import { TopicPlanet } from './TopicPlanet';

interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
}

interface TopicProgress {
  topicId: string;
  currentTier: number;
  tierXp: number;
  tierXpRequired: number;
}

interface PlanetMapProps {
  topics: Topic[];
  progress: TopicProgress[];
}

export function PlanetMap({ topics, progress }: PlanetMapProps) {
  // Create a map for quick progress lookup
  const progressMap = new Map(
    progress.map(p => [p.topicId, p])
  );

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Explore the Math Galaxy
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md mx-auto">
        Choose a planet to practice. Complete challenges to advance through tiers!
      </p>

      {/* Planet grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 max-w-3xl mx-auto">
        {topics.map((topic, index) => (
          <div key={topic.id} className="flex justify-center">
            <TopicPlanet
              topic={topic}
              progress={progressMap.get(topic.id)}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
