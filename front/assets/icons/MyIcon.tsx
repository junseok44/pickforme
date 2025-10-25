import Svg, { Circle, Path } from 'react-native-svg';

import type { IIconProps } from '@types';

export default function MyIcon({ size, color, opacity = 1 }: IIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
            <Circle
                cx="14"
                cy="11"
                r="4.25"
                stroke={color}
                strokeOpacity={opacity}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <Path
                d="M14 17.0001C17.6923 17.0001 22 19.3905 22 23.9958C20.7692 23.9958 16.9271 24.0052 14 23.9958C11.0729 24.0052 6.61538 23.9958 6 23.9958C6 19.3905 10.3077 17.0001 14 17.0001Z"
                stroke={color}
                strokeOpacity={opacity}
                strokeWidth="1.5"
                strokeLinecap="square"
            />
        </Svg>
    );
}
