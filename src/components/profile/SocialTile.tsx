import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Linking } from 'react-native';
import { Instagram, Youtube, Music2, Headphones } from 'lucide-react-native';

type SocialTileProps = {
  type: 'instagram' | 'youtube' | 'spotify' | 'soundcloud';
  url: string;
};

const iconMap = {
  instagram: Instagram,
  youtube: Youtube,
  spotify: Music2,
  soundcloud: Headphones,
};

export const SocialTile: React.FC<SocialTileProps> = ({ type, url }) => {
  const Icon = iconMap[type];
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(url)}
      className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5"
    >
      <Icon size={18} color="white" />
    </TouchableOpacity>
  );
};
