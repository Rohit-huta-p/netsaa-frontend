import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
    size?: 'sm' | 'md' | 'lg';
    label: string;

    labelClassName?: string;
    icon?: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    label,
    className,

    labelClassName,
    icon,
    ...props
}: ButtonProps) {
    const baseStyles = 'flex-row items-center justify-center rounded-full';

    const variants = {
        primary: 'bg-pink-500',
        secondary: 'bg-purple-600',
        outline: 'border border-white bg-transparent',
        ghost: 'bg-transparent',
        white: 'bg-white',
    };

    const sizes = {
        sm: 'px-4 py-2',
        md: 'px-6 py-3',
        lg: 'px-8 py-4',
    };

    const textBaseStyles = 'font-bold text-center';

    const textVariants = {
        primary: 'text-white',
        secondary: 'text-white',
        outline: 'text-white',
        ghost: 'text-primary',
        white: 'text-pink-600',
    };

    return (
        <TouchableOpacity
            className={twMerge(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {icon && <View className="mr-2">{icon}</View>}
            <Text
                className={twMerge(
                    textBaseStyles,
                    textVariants[variant],
                    size === 'lg' ? 'text-lg' : 'text-base',
                    labelClassName
                )}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}
