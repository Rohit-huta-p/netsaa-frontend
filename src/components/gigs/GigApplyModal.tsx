import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useApplyToGig } from '../../hooks/useGigApplications';
import { X, Link as LinkIcon, Plus, Trash2 } from 'lucide-react-native';

interface GigApplyModalProps {
    visible: boolean;
    onClose: () => void;
    gigId: string;
    gigTitle: string;
}

export const GigApplyModal: React.FC<GigApplyModalProps> = ({ visible, onClose, gigId, gigTitle }) => {
    const [coverNote, setCoverNote] = useState('');
    const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);

    const applyMutation = useApplyToGig();

    const handleLinkChange = (text: string, index: number) => {
        const newLinks = [...portfolioLinks];
        newLinks[index] = text;
        setPortfolioLinks(newLinks);
    };

    const addLinkField = () => {
        setPortfolioLinks([...portfolioLinks, '']);
    };

    const removeLinkField = (index: number) => {
        const newLinks = [...portfolioLinks];
        newLinks.splice(index, 1);
        setPortfolioLinks(newLinks);
    };

    const handleSubmit = () => {
        if (!coverNote.trim()) {
            Alert.alert("Required", "Please add a cover note to introduce yourself.");
            return;
        }

        // Filter out empty links
        const validLinks = portfolioLinks.filter(link => link.trim() !== '');

        applyMutation.mutate(
            {
                gigId,
                payload: {
                    coverNote,
                    portfolioLinks: validLinks
                }
            },
            {
                onSuccess: () => {
                    Alert.alert("Success", "Your application has been submitted!");
                    setCoverNote('');
                    setPortfolioLinks(['']);
                    onClose();
                },
                onError: (error: any) => {
                    const message = error.response?.data?.meta?.message || "Failed to submit application";
                    Alert.alert("Error", message);
                }
            }
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-netsa-card rounded-t-3xl h-[85%] border-t border-white/10">

                    {/* Header */}
                    <View className="flex-row justify-between items-center p-6 border-b border-white/10">
                        <View>
                            <Text className="text-white font-satoshi-bold text-xl">Apply for Gig</Text>
                            <Text className="text-netsa-text-secondary font-inter text-sm mt-1">{gigTitle}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-white/5 rounded-full">
                            <X size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-6">
                        {/* Cover Note */}
                        <View className="mb-6">
                            <Text className="text-white font-satoshi-bold mb-3">Cover Note <Text className="text-red-500">*</Text></Text>
                            <TextInput
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                placeholder="Why are you a good fit for this gig?"
                                placeholderTextColor="#9CA3AF" // gray-400
                                className="bg-white/5 border border-white/10 rounded-xl p-4 text-white font-inter h-40"
                                value={coverNote}
                                onChangeText={setCoverNote}
                            />
                        </View>

                        {/* Portfolio Links */}
                        <View className="mb-8">
                            <Text className="text-white font-satoshi-bold mb-3">Portfolio Links</Text>

                            {portfolioLinks.map((link, index) => (
                                <View key={index} className="flex-row items-center mb-3">
                                    <View className="flex-1 flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 h-12">
                                        <LinkIcon size={16} color="#9CA3AF" />
                                        <TextInput
                                            placeholder="https://..."
                                            placeholderTextColor="#9CA3AF"
                                            className="flex-1 ml-3 text-white font-inter"
                                            value={link}
                                            onChangeText={(text) => handleLinkChange(text, index)}
                                            autoCapitalize="none"
                                            keyboardType="url"
                                        />
                                    </View>

                                    {portfolioLinks.length > 1 && (
                                        <TouchableOpacity
                                            onPress={() => removeLinkField(index)}
                                            className="ml-3 p-3 bg-red-500/10 rounded-xl"
                                        >
                                            <Trash2 size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            <TouchableOpacity
                                onPress={addLinkField}
                                className="flex-row items-center justify-center p-3 border border-dashed border-white/20 rounded-xl mt-2"
                            >
                                <Plus size={16} color="#A855F7" />
                                <Text className="text-netsa-accent-purple font-satoshi-bold ml-2">Add Another Link</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View className="p-6 border-t border-white/10 safe-area-bottom">
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={applyMutation.isPending}
                            className={`w-full py-4 rounded-xl flex-row justify-center items-center ${applyMutation.isPending ? 'bg-netsa-accent-purple/50' : 'bg-netsa-accent-purple'
                                }`}
                        >
                            {applyMutation.isPending ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-satoshi-bold text-lg">Submit Application</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};
