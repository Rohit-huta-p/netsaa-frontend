import { Pressable, Text, View } from 'react-native';
export default function Step3Location({ onNext }: { onNext: () => void }) {
  return (
    <View>
      <Pressable onPress={onNext} className="bg-event-brand rounded-2xl py-4 items-center mt-6">
        <Text className="font-outfit font-bold text-white">Continue</Text>
      </Pressable>
    </View>
  );
}
