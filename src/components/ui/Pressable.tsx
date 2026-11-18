// src/components/ui/Pressable.tsx
//
// Drop-in replacement for react-native's <Pressable>.
//
// WHY: NativeWind's css-interop drops a FUNCTION-form `style` callback on native
// (`style={({ pressed }) => …}`) — the element renders with NO styles at all
// (nativewind#1105, reproduced on 4.2.x). It silently passes `tsc`/Jest because
// the interop is bypassed under NODE_ENV=test, so it only shows on a device.
//
// FIX: on native we resolve the style function ourselves against our own pressed
// state and hand the inner Pressable a STATIC style (which interop keeps — the
// same thing that works for a plain `style={[…]}`). On web we pass straight
// through so hovered/focused keep working and production (netsaa.com) is
// untouched. Import this in place of react-native's Pressable; the JSX, incl.
// `style={({ pressed }) => …}`, stays exactly the same.
import React, { forwardRef, useState } from 'react';
import { Pressable as RNPressable, Platform } from 'react-native';
import type { PressableProps, View, GestureResponderEvent } from 'react-native';

export const Pressable = forwardRef<View, PressableProps>(function Pressable(
    { style, onPressIn, onPressOut, disabled, ...rest },
    ref,
) {
    const [pressed, setPressed] = useState(false);

    // Web, or a non-function style: css-interop handles these correctly already.
    if (Platform.OS === 'web' || typeof style !== 'function') {
        return (
            <RNPressable
                ref={ref}
                style={style}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={disabled}
                {...rest}
            />
        );
    }

    // Native + function style: resolve it here, pass a static style to the host.
    const resolved = style({ pressed: !disabled && pressed });

    return (
        <RNPressable
            ref={ref}
            disabled={disabled}
            onPressIn={(e: GestureResponderEvent) => { if (!disabled) setPressed(true); onPressIn?.(e); }}
            onPressOut={(e: GestureResponderEvent) => { setPressed(false); onPressOut?.(e); }}
            style={resolved}
            {...rest}
        />
    );
});

export default Pressable;
