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
            // Default to passed date, or minDate if available, or today
            let defaultDate = date;
            if (!defaultDate) {
                const today = new Date();
                if (minDate && today < minDate) {
                    defaultDate = minDate;
                } else {
                    defaultDate = today;
                }
            }
            setSelectedDate(defaultDate);
        }
    }, [visible, date, minDate]);

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
                        <View className="w-full max-w-xs bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black">
                            {/* Header */}
                            <View className="flex-row justify-between items-center px-4 py-3 border-b border-white/5 bg-zinc-800/50">
                                <Text className="text-white font-bold text-base">Select Date</Text>
                                <TouchableOpacity onPress={onClose} className="p-1 bg-zinc-800 rounded-full">
                                    <X size={18} color="#71717a" />
                                </TouchableOpacity>
                            </View>

                            <View className="px-3 py-2">
                                <DateTimePicker
                                    mode="single"
                                    date={selectedDate}
                                    onChange={(params: any) => setSelectedDate(params.date)}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    styles={{
                                        day_label: { color: 'white', fontWeight: 'bold', fontSize: 12.5 },
                                        selected: { backgroundColor: '#FF6B35', borderRadius: 7 },
                                        selected_label: { color: 'white', fontWeight: 'bold', fontSize: 12.5 },
                                        weekday_label: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 11 },
                                        month_selector_label: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
                                        year_selector_label: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
                                        month_label: { color: '#fff', fontSize: 13 }, // Month list item
                                        year_label: { color: '#fff', fontSize: 13 }, // Year list item
                                        // today_label: { color: '#FF6B35' } // Optional: Highlight today
                                    }}
                                />
                            </View>

                            {/* Footer Actions */}
                            <View className="flex-row px-3 pb-3 pt-1 gap-2.5">
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 items-center"
                                >
                                    <Text className="text-zinc-400 font-semibold text-sm">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleConfirm}
                                    className="flex-1 py-2.5 rounded-xl bg-[#FF6B35] items-center flex-row justify-center gap-2 shadow-lg shadow-orange-500/20"
                                >
                                    <Check size={16} color="white" />
                                    <Text className="text-white font-bold text-sm">Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
