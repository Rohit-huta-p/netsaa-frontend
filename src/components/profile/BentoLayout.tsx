import React from 'react';
import { View } from 'react-native';

type BentoLayoutProps = {
  children: React.ReactNode;
};

export const BentoLayout: React.FC<BentoLayoutProps> = ({ children }) => (
  <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {React.Children.map(children, child => (
      <View className="bg-white/5 backdrop-blur rounded-2xl p-4">
        {child}
      </View>
    ))}
  </View>
);

export default BentoLayout;
