import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Users, Edit2 } from "lucide-react-native";
import AppScrollView from "../AppScrollView";
import { GigDetails } from "./GigDetails";
import { useUpdateGig } from "../../hooks/useGigs";

interface OrganizerGigControlsProps {
    gig: any;
}

export const OrganizerGigControls: React.FC<OrganizerGigControlsProps> = ({
    gig,
}) => {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const updateMutation = useUpdateGig();

    const handleSave = async (data: any) => {
        try {
            await updateMutation.mutateAsync({
                id: gig._id,
                payload: data,
            });
            setIsEditMode(false);
        } catch (error) {
            console.error("Failed to update gig", error);
        }
    };

    return (
        <AppScrollView className="flex-1 bg-gray-50 relative">

            {/* FULL WIDTH CONTEXT */}
            <View className="w-full">

                {/* CENTERED CONTENT */}
                <View className="w-full max-w-[80%] mx-auto relative">
                    <GigDetails
                        isOrganizer={true}
                        gig={gig}
                        showActionFooter={false}
                        isEditingExternal={isEditMode}
                        onSave={handleSave}
                        onCancel={() => setIsEditMode(false)}
                    />
                </View>

                {/* ORGANIZER DOCK (HIDDEN IN EDIT MODE) */}
                {/* {!isEditMode && (
                    <View className="absolute bottom-6 left-4 right-4 bg-gray-900 rounded-2xl p-4 flex-row items-center justify-between border border-gray-800 shadow-2xl">

                        <View>
                            <Text className="text-gray-400 text-xs">Applications</Text>
                            <Text className="text-white text-lg font-bold">
                                {gig.totalApplications || 0}
                            </Text>
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity className="flex-row items-center bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
                                <Users size={16} color="#9CA3AF" />
                                <Text className="text-gray-300 ml-2 text-sm font-medium">
                                    Applicants
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsEditMode(true)}
                                className="flex-row items-center bg-indigo-600 px-4 py-2 rounded-xl shadow-lg"
                            >
                                <Edit2 size={16} color="white" />
                                <Text className="text-white ml-2 text-sm font-bold">
                                    Edit
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )} */}
            </View>
        </AppScrollView>
    );
};
