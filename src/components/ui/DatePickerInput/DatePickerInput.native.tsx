import React, { useState } from "react"
import { View, Text, TouchableOpacity, Platform, Modal } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import dayjs from "dayjs"
import { Calendar, Clock } from "lucide-react-native"
import { DatePickerInputProps } from "@/types/DatePickerInput.types"


export const DatePickerInput: React.FC<DatePickerInputProps> = ({
    label,
    subtitle,
    value,
    onChange,
    error,
    mode = "date",
    minimumDate,
    maximumDate,
    placeholder = "Select date",
    required,
}) => {
    const [open, setOpen] = useState(false)
    const dateValue = value ? dayjs(value).toDate() : undefined

    const handleConfirm = (_event: any, date?: Date) => {
        setOpen(false)
        if (date) {
            onChange(date)
        }
    }

    return (
        <View className="mb-1">
            {label && (
                <View className="flex-row items-center mb-1.5 ml-1">
                    <Text className="text-zinc-400 text-sm font-medium">
                        {label} {required && <Text className="text-red-500">*</Text>}
                    </Text>
                    {subtitle && (
                        <Text className="text-zinc-500 text-xs ml-2">{subtitle}</Text>
                    )}
                </View>
            )}

            <TouchableOpacity
                onPress={() => setOpen(true)}
                className={`flex-row items-center w-full bg-zinc-900/50 border ${error ? "border-red-500" : "border-zinc-700"
                    } rounded-xl py-3 px-4`}
            >
                <View className="mr-3">
                    {mode === "time" ? (
                        <Clock size={18} color="#71717a" />
                    ) : (
                        <Calendar size={18} color="#71717a" />
                    )}
                </View>

                <Text className={`flex-1 ${dateValue ? "text-zinc-100" : "text-zinc-500"}`}>
                    {dateValue
                        ? dayjs(dateValue).format(
                            mode === "time"
                                ? "h:mm A"
                                : mode === "datetime"
                                    ? "MMM D, YYYY h:mm A"
                                    : "MMM D, YYYY"
                        )
                        : placeholder}
                </Text>
            </TouchableOpacity>

            {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}

            {/* Android Picker */}
            {open && Platform.OS === 'android' && (
                <DateTimePicker
                    value={dateValue || new Date()}
                    mode={mode as any}
                    display="default"
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onChange={handleConfirm}
                />
            )}

            {/* iOS Picker Modal */}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={open}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setOpen(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-zinc-900 rounded-t-3xl p-4 pb-10">
                            <View className="flex-row justify-end mb-4">
                                <TouchableOpacity onPress={() => setOpen(false)} className="px-4 py-2">
                                    <Text className="text-indigo-500 font-bold text-lg">Done</Text>
                                </TouchableOpacity>
                            </View>
                            <View className="items-center">
                                <DateTimePicker
                                    value={dateValue || new Date()}
                                    mode={mode as any}
                                    display="spinner"
                                    minimumDate={minimumDate}
                                    maximumDate={maximumDate}
                                    onChange={(_e, date) => {
                                        if (date) onChange(date)
                                    }}
                                    textColor="white"
                                    themeVariant="dark"
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    )
}
