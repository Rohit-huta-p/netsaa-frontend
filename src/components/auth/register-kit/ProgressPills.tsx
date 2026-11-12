// register-kit/ProgressPills.tsx — step progress dots (active = wide accent pill)
import React from 'react';
import { View } from 'react-native';
import { useAccent } from './AccentContext';

export function ProgressPills({ total, current }: { total: number; current: number }) {
    const accent = useAccent();
    return (
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={{
                        height: 5,
                        width: i === current ? 20 : 5,
                        borderRadius: 2.5,
                        backgroundColor:
                            i === current ? accent.base
                            : i < current ? 'rgba(255,255,255,0.3)'
                            : 'rgba(255,255,255,0.1)',
                    }}
                />
            ))}
        </View>
    );
}
