import Svg, { Path, Circle } from 'react-native-svg';

import type { IIconProps } from '@types';

export default function SearchIcon({ size, color, opacity = 1 }: IIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
                cx="11"
                cy="11"
                r="7"
                stroke={color}
                strokeWidth="1.5"
                strokeOpacity={opacity}
                strokeLinecap="round"
            />
            <Path
                d="M16.5 16.5L20 20"
                stroke={color}
                strokeWidth="1.5"
                strokeOpacity={opacity}
                strokeLinecap="round"
            />
        </Svg>
    );
}
