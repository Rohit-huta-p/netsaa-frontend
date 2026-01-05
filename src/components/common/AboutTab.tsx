import { View, Text } from "react-native";
import { EditableField } from "../ui/EditableField";

interface AboutTabProps {
    formData: any;
    setFormData: any;
    isEditingExternal: boolean;
}

export default function AboutTab({ formData, setFormData, isEditingExternal }: AboutTabProps) {
    return (
        <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10">
            <Text className="text-lg font-satoshi-bold text-white mb-3">About This Gig</Text>
            <EditableField
                isEditing={isEditingExternal}
                value={formData.description || ""}
                label="Description"
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                textStyle="text-netsa-text-secondary leading-relaxed font-inter"
            />
        </View>
    )
}