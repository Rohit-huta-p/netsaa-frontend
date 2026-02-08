import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import { BlurView } from 'expo-blur';
import { X, Check } from 'lucide-react-native';

interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
    date?: Date; // Current selected date
    onSelect: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
    visible,
    onClose,
    date,
    onSelect,
    minDate,
    maxDate
}) => {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);

    // Sync internal state when modal opens or prop changes
    React.useEffect(() => {
        if (visible) {
            setSelectedDate(date || new Date());
        }
    }, [visible, date]);

    const handleConfirm = () => {
        if (selectedDate) {
            onSelect(selectedDate);
        }
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 justify-center items-center bg-black/60 p-4">
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black">
                            {/* Header */}
                            <View className="flex-row justify-between items-center p-4 border-b border-white/5 bg-zinc-800/50">
                                <Text className="text-white font-bold text-lg">Select Date</Text>
                                <TouchableOpacity onPress={onClose} className="p-1 bg-zinc-800 rounded-full">
                                    <X size={20} color="#71717a" />
                                </TouchableOpacity>
                            </View>

                            <View className="p-4">
                                <DateTimePicker
                                    mode="single"
                                    date={selectedDate}
                                    onChange={(params: any) => setSelectedDate(params.date)}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    styles={{
                                        day_label: { color: 'white', fontWeight: '500' },
                                        selected: { backgroundColor: '#FF6B35', borderRadius: 8 },
                                        selected_label: { color: 'white', fontWeight: 'bold' },
                                        weekday_label: { color: '#a1a1aa', fontWeight: '500' },
                                        month_selector_label: { color: 'white', fontWeight: 'bold', fontSize: 16 },
                                        year_selector_label: { color: 'white', fontWeight: 'bold', fontSize: 16 },
                                        // today_label: { color: '#FF6B35' } // Optional: Highlight today
                                    }}
                                />
                            </View>

                            {/* Footer Actions */}
                            <View className="flex-row p-4 pt-2 gap-3">
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="flex-1 py-3 rounded-xl bg-zinc-800 items-center"
                                >
                                    <Text className="text-zinc-400 font-semibold">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleConfirm}
                                    className="flex-1 py-3 rounded-xl bg-[#FF6B35] items-center flex-row justify-center gap-2 shadow-lg shadow-orange-500/20"
                                >
                                    <Check size={18} color="white" />
                                    <Text className="text-white font-bold">Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
