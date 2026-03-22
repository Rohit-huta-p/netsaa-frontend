import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Edit2 } from 'lucide-react-native';

type ManifestoProps = {
  bio?: string;
  isEditable?: boolean;
  onEditPress?: () => void;
};

export const Manifesto: React.FC<ManifestoProps> = ({ bio, isEditable = false, onEditPress }) => (
  <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative">
    <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Bio</Text>
    {isEditable && (
      <TouchableOpacity onPress={onEditPress} className="absolute top-4 right-4 p-2 rounded-full border bg-white/5 border-transparent">
        <Edit2 size={12} color="#71717a" />
      </TouchableOpacity>
    )}
    <Text className="text-zinc-400 leading-6 font-medium italic pl-6 border-l-2 border-zinc-800 mb-6">
      {bio || "No manifesto available."}
    </Text>
  </View>
);
