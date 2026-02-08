import React, { useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import dayjs from "dayjs"
import { Calendar, Clock } from "lucide-react-native"
import { DatePickerInputProps } from "@/types/DatePickerInput.types"
import { CalendarModal } from "../CalendarModal"

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

    const handleSelect = (date: Date) => {
        onChange(date);
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

            <CalendarModal
                visible={open}
                onClose={() => setOpen(false)}
                date={dateValue}
                onSelect={handleSelect}
                minDate={minimumDate}
                maxDate={maximumDate}
            />
        </View>
    )
}
