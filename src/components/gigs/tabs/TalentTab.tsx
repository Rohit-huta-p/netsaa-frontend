import React from 'react';
import { View, Text } from 'react-native';
import { Award, User as UserIcon } from 'lucide-react-native';
import { SectionCard } from '@/components/common/SectionCard';
import { DetailRow } from '@/components/common/DetailRow';

interface TalentTabProps {
    gig: any;
}

/**
 * Talent Criteria tab — role requirements (artist type, experience, skills)
 * and physical criteria (gender, age, height).
 */
export const TalentTab: React.FC<TalentTabProps> = ({ gig }) => (
    <View className="space-y-6">
        {/* Role Requirements */}
        <SectionCard icon={Award} iconColor="#3B82F6" label="ROLE REQUIREMENTS" labelColor="#3B82F6">
            <View className="space-y-4">
                <DetailRow label="Artist Type" value={gig.artistTypes?.join(', ') || 'Not specified'} />
                <DetailRow label="Experience Level" value={gig.experienceLevel || 'Any'} />

                {gig.requiredSkills && gig.requiredSkills.length > 0 && (
                    <View className="py-3">
                        <Text className="text-sm text-zinc-400 mb-2">Required Skills</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {gig.requiredSkills.map((skill: string, idx: number) => (
                                <View
                                    key={idx}
                                    className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                                >
                                    <Text className="text-blue-400 text-xs font-medium">{skill}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </SectionCard>

        {/* Physical Criteria */}
        <SectionCard icon={UserIcon} iconColor="#8B5CF6" label="PHYSICAL CRITERIA" labelColor="#8B5CF6">
            <View className="space-y-4">
                {gig.genderPreference && gig.genderPreference !== 'any' && (
                    <DetailRow label="Gender" value={gig.genderPreference} />
                )}

                {(gig.ageRange?.min || gig.ageRange?.max) && (
                    <DetailRow
                        label="Age Range"
                        value={`${gig.ageRange?.min || '?'} - ${gig.ageRange?.max || '?'} years`}
                    />
                )}

                {/* Height Requirements */}
                {(gig.heightRequirements?.male || gig.heightRequirements?.female) && (
                    <View className="flex-row justify-between items-start py-3 border-b border-white/5">
                        <Text className="text-sm text-zinc-400 mt-1">Height</Text>
                        <View className="items-end">
                            {gig.heightRequirements.male?.min === gig.heightRequirements.female?.min &&
                            gig.heightRequirements.male?.max === gig.heightRequirements.female?.max ? (
                                <Text className="text-base font-black text-white">
                                    {gig.heightRequirements.male?.min || '?'} -{' '}
                                    {gig.heightRequirements.male?.max || '?'} ft
                                </Text>
                            ) : (
                                <>
                                    {gig.heightRequirements.male && (
                                        <Text className="text-base font-black text-white">
                                            Male: {gig.heightRequirements.male.min} -{' '}
                                            {gig.heightRequirements.male.max} ft
                                        </Text>
                                    )}
                                    {gig.heightRequirements.female && (
                                        <Text className="text-base font-black text-white">
                                            Female: {gig.heightRequirements.female.min} -{' '}
                                            {gig.heightRequirements.female.max} ft
                                        </Text>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                )}

                {gig.physicalRequirements && (
                    <View className="py-3">
                        <Text className="text-sm text-zinc-400 mb-2">Other Requirements</Text>
                        <Text className="text-zinc-300 text-sm">{gig.physicalRequirements}</Text>
                    </View>
                )}
            </View>
        </SectionCard>
    </View>
);
