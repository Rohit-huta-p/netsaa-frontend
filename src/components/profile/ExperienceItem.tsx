import React from 'react';
import { View, Text } from 'react-native';
import { ExperienceEntry } from './types';

type TimelineItemProps = {
  experience: ExperienceEntry;
  isOrganizer?: boolean;
};

export const ExperienceItem: React.FC<TimelineItemProps> = ({ experience, isOrganizer }) => {
  return (
    <View className="mb-4">
      <View className="flex-row w-full gap-2 justify-between">
        <Text className="text-white font-bold text-base">
          {isOrganizer ? (experience.projectName ?? experience.title) : (experience.role ?? experience.title)}
        </Text>
        {/* Display Date */}
        <View className="items-end shrink-0">
          {experience.date && (
            <Text className="text-pink-400 text-[10px] font-semibold mt-1 text-right" numberOfLines={1}>{experience.date}</Text>
          )}
        </View>
      </View>

      {/* Either show project name for artists, or just organization. Let's show whatever else is relevant */}
      {experience.projectName && !isOrganizer && <Text className="text-zinc-300 italic mb-1">{experience.projectName}</Text>}
      {experience.role && isOrganizer && <Text className="text-zinc-300 italic mb-1">{experience.role}</Text>}
      {experience.organization && <Text className="text-zinc-400">{experience.organization}</Text>}
      {experience.location && <Text className="text-zinc-400">{experience.location}</Text>}

      {experience.description && (
        <View className="mt-3">
          <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Description</Text>
          <Text className="text-zinc-400 leading-5 ">{experience.description}</Text>
        </View>
      )}
    </View>


  );
};
