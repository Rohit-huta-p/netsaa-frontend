import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
const C = Colors.auth;

export interface Country {
    name: string;
    dialCode: string;
    code: string;
}

export const COUNTRIES: Country[] = [
    { name: "India", dialCode: "+91", code: "IN" },
    { name: "United States", dialCode: "+1", code: "US" },
    { name: "United Kingdom", dialCode: "+44", code: "GB" },
    { name: "Canada", dialCode: "+1", code: "CA" },
    { name: "Australia", dialCode: "+61", code: "AU" },
    { name: "Germany", dialCode: "+49", code: "DE" },
    { name: "France", dialCode: "+33", code: "FR" },
    { name: "United Arab Emirates", dialCode: "+971", code: "AE" },
    // Add more countries as needed
];

interface CountryCodePickerProps {
    selectedCode: string;
    onSelect: (code: string) => void;
}

export const CountryCodePicker = ({ selectedCode, onSelect }: CountryCodePickerProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery)
    );

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalVisible(true)}
                style={{
                    paddingRight: 8,
                    borderRightWidth: 1,
                    borderColor: C.w10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                }}
            >
                <Text style={{ color: C.w80, fontSize: 15, fontWeight: '500' }}>
                    {selectedCode}
                </Text>
                <ChevronDown color={C.w40} width={14} height={14} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: '#1E1B2E', // Match NETSA theme
                        height: '70%',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: 20
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Select Country</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color={C.w40} width={24} height={24} />
                            </TouchableOpacity>
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            height: 48,
                            marginBottom: 16
                        }}>
                            <Search color={C.w40} width={20} height={20} />
                            <TextInput
                                style={{ flex: 1, color: 'white', marginLeft: 10, fontSize: 15 }}
                                placeholder="Search country or code"
                                placeholderTextColor={C.w40}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        paddingVertical: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: 'rgba(255,255,255,0.05)'
                                    }}
                                    onPress={() => {
                                        onSelect(item.dialCode);
                                        setModalVisible(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <Text style={{ color: C.w80, fontSize: 16 }}>{item.name}</Text>
                                    <Text style={{ color: C.w40, fontSize: 16 }}>{item.dialCode}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};
