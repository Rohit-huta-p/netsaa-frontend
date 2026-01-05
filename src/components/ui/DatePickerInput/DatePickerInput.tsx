import * as React from "react"
import dayjs from "dayjs"

import { DatePickerInputProps } from "@/types/DatePickerInput.types"
import { Calendar } from "lucide-react-native"

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
    label,
    subtitle,
    value,
    onChange,
    error,
    minimumDate,
    maximumDate,
    placeholder = "Select date",
    required,
}) => {
    const dateValue = value ? dayjs(value).format("YYYY-MM-DD") : ""

    return (
        <div className="flex flex-col gap-2 mb-1">
            {label && (
                <div className="flex flex-row items-center mb-1.5 ml-1">
                    <span className="text-zinc-400 text-sm font-medium">
                        {label} {required && <span className="text-red-500">*</span>}
                    </span>
                    {subtitle && (
                        <span className="ml-2 text-xs text-zinc-500">{subtitle}</span>
                    )}
                </div>
            )}

            <div className="relative">
                <input
                    type="date"
                    value={dateValue}
                    min={minimumDate ? dayjs(minimumDate).format("YYYY-MM-DD") : undefined}
                    max={maximumDate ? dayjs(maximumDate).format("YYYY-MM-DD") : undefined}
                    onChange={(e) => {
                        const val = e.target.value
                        if (!val) return
                        onChange(new Date(val + "T00:00:00"))
                    }}
                    className={`w-full appearance-none bg-zinc-900/50 border ${error ? "border-red-500" : "border-zinc-700"
                        } rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />

                {/* Calendar Icon - Absolute Positioned */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none flex items-center justify-center">
                    <Calendar size={18} color="#71717a" />
                </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
        </div>
    )
}
