
import { GigApplicationsList } from "@/components/gigs/GigApplicationsList";
import { View, Text } from "react-native";

interface ApplicationsTabProps {
    isOrganizer: boolean | undefined;
    gig: any;
}

export default function ApplicationsTab({ isOrganizer, gig }: ApplicationsTabProps) {
    return (
        isOrganizer ? (
            <GigApplicationsList gigId={gig._id} />
        ) : (
            <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10">
                <Text className="text-lg font-satoshi-bold text-white mb-3">About This Gig</Text>
                <Text className="text-netsa-text-secondary leading-relaxed font-inter">
                    {gig.description ||
                        "This gig is an opportunity to collaborate, perform, and grow professionally in a curated artistic environment."}
                </Text>
            </View>
        )
    )
}   