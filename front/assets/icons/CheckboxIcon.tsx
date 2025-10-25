import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
import { Colors } from '@/constants';

import type { ColorScheme } from '@hooks';

interface CheckboxIconProps {
    size?: number;
    checked: boolean;
    colorScheme: ColorScheme;
}

export default function CheckboxIcon({ size = 24, checked, colorScheme }: CheckboxIconProps) {
    const bgColor = colorScheme === 'light' ? '#1e1e1e' : '#FFFFFF';
    const strokeColor = colorScheme === 'light' ? '#1e1e1e' : '#FFFFFF';
    const checkColor = colorScheme === 'light' ? '#FFFFFF' : '#1e1e1e';

    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* 체크박스 배경 및 테두리 */}
            <Rect x="2" y="2" width="20" height="20" rx="4" fill={bgColor} stroke={strokeColor} strokeWidth="1.5" />

            {/* 체크 마크 - 체크되었을 때만 보임 */}
            {checked && (
                <Path
                    d="M7 13L10 16L17 9"
                    stroke={checkColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
        </Svg>
    );
}
