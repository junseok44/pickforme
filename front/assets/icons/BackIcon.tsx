import Svg, { Path } from 'react-native-svg';

import type { IIconProps } from '@types';

export default function BackIcon({ size, color, opacity = 1 }: IIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M15 18L9 12L15 6"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={opacity}
            />
        </Svg>
    );
}
