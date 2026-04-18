import React, { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, TextInput } from "react-native"
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
    placeholder,
    required,
}) => {
    const defaultPlaceholder = mode === "time" ? "Select time" : "DD / MM / YYYY"
    const displayPlaceholder = placeholder || defaultPlaceholder

    const [open, setOpen] = useState(false)
    const dateValue = value ? dayjs(value).toDate() : undefined

    // Slot state
    const [dd, setDd] = useState("")
    const [mm, setMm] = useState("")
    const [yyyy, setYyyy] = useState("")

    const dayRef = useRef<TextInput>(null)
    const monthRef = useRef<TextInput>(null)
    const yearRef = useRef<TextInput>(null)

    useEffect(() => {
        if (value && mode === "date") {
            const d = dayjs(value)
            if (d.isValid()) {
                setDd(d.format("DD"))
                setMm(d.format("MM"))
                setYyyy(d.format("YYYY"))
            }
        } else if (!value) {
            setDd("")
            setMm("")
            setYyyy("")
        }
    }, [value, mode])

    const handleSelect = (date: Date) => {
        onChange(date)
    }

    const checkAndEmit = (d: string, m: string, y: string) => {
        if (d.length === 2 && m.length === 2 && y.length === 4) {
            const di = parseInt(d, 10)
            const mi = parseInt(m, 10)
            const yi = parseInt(y, 10)

            if (yi >= 1900 && yi <= 2100) {
                const parsed = dayjs(`${yi}-${m}-${d}T12:00:00.000Z`)
                if (parsed.isValid()) {
                    onChange(parsed.toDate())
                }
            }
        }
    }

    const handleDdChange = (text: string) => {
        let val = text.replace(/\D/g, "")
        if (val.length === 1 && parseInt(val, 10) > 3) {
            val = "0" + val
        } else if (val.length === 2) {
            if (parseInt(val, 10) === 0) val = "01"
            if (parseInt(val, 10) > 31) val = "31"
        }
        setDd(val)
        checkAndEmit(val, mm, yyyy)

        if (val.length === 2 && text.length >= dd.length) {
            monthRef.current?.focus()
        }
    }

    const handleMmChange = (text: string) => {
        let val = text.replace(/\D/g, "")
        if (val.length === 1 && parseInt(val, 10) > 1) {
            val = "0" + val
        } else if (val.length === 2) {
            if (parseInt(val, 10) === 0) val = "01"
            if (parseInt(val, 10) > 12) val = "12"
        }
        setMm(val)
        checkAndEmit(dd, val, yyyy)

        if (val.length === 2 && text.length >= mm.length) {
            yearRef.current?.focus()
        }
    }

    const handleYyyyChange = (text: string) => {
        let val = text.replace(/\D/g, "")
        if (val.length > 4) val = val.slice(0, 4)
        setYyyy(val)
        checkAndEmit(dd, mm, val)
    }

    const handleMmKeyPress = ({ nativeEvent }: any) => {
        if (nativeEvent.key === "Backspace" && mm.length === 0) {
            dayRef.current?.focus()
        }
    }

    const handleYyyyKeyPress = ({ nativeEvent }: any) => {
        if (nativeEvent.key === "Backspace" && yyyy.length === 0) {
            monthRef.current?.focus()
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

            <View
                className={`flex-row items-center w-full bg-zinc-900/50 border ${error ? "border-red-500" : "border-zinc-700"
                    } rounded-xl py-3 px-4`}
            >
                <TouchableOpacity onPress={() => setOpen(true)} className="mr-3">
                    {mode === "time" ? (
                        <Clock size={18} color="#71717a" />
                    ) : (
                        <Calendar size={18} color="#71717a" />
                    )}
                </TouchableOpacity>

                {mode === "date" ? (
                    <View className="flex-row items-center flex-1">
                        <TextInput
                            ref={dayRef}
                            className="text-zinc-100 text-base text-center w-7 p-0 m-0"
                            style={{ outlineStyle: 'none' } as any}
                            placeholder="DD"
                            placeholderTextColor="#71717a"
                            value={dd}
                            onChangeText={handleDdChange}
                            keyboardType="numeric"
                            maxLength={2}
                        />
                        <Text className="text-zinc-500 mx-1">/</Text>
                        <TextInput
                            ref={monthRef}
                            className="text-zinc-100 text-base text-center w-8 p-0 m-0"
                            style={{ outlineStyle: 'none' } as any}
                            placeholder="MM"
                            placeholderTextColor="#71717a"
                            value={mm}
                            onChangeText={handleMmChange}
                            onKeyPress={handleMmKeyPress}
                            keyboardType="numeric"
                            maxLength={2}
                        />
                        <Text className="text-zinc-500 mx-1">/</Text>
                        <TextInput
                            ref={yearRef}
                            className="text-zinc-100 text-base text-center w-12 p-0 m-0"
                            style={{ outlineStyle: 'none' } as any}
                            placeholder="YYYY"
                            placeholderTextColor="#71717a"
                            value={yyyy}
                            onChangeText={handleYyyyChange}
                            onKeyPress={handleYyyyKeyPress}
                            keyboardType="numeric"
                            maxLength={4}
                        />
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => setOpen(true)} className="flex-1">
                        <Text className={`flex-1 ${dateValue ? "text-zinc-100" : "text-zinc-500"}`}>
                            {dateValue
                                ? dayjs(dateValue).format(
                                    mode === "time"
                                        ? "h:mm A"
                                        : "MMM D, YYYY h:mm A"
                                )
                                : displayPlaceholder}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

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
