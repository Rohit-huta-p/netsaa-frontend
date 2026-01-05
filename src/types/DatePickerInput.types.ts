export interface DatePickerInputProps {
    label?: string
    subtitle?: string
    value?: Date | string
    onChange: (date: Date) => void
    error?: string
    mode?: "date" | "time" | "datetime"
    minimumDate?: Date
    maximumDate?: Date
    placeholder?: string
    required?: boolean
}
