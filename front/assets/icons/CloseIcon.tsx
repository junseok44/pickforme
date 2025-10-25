import Svg, { Path } from 'react-native-svg';

import type { IIconProps } from '@types';

export default function CloseIcon({ size = 24, color = '#1E1E1E', opacity = 1 }: IIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M18 6L6 18M6 6L18 18"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={opacity}
            />
        </Svg>
    );
}
