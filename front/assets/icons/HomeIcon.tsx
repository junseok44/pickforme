import Svg, { Path } from 'react-native-svg';

import type { IIconProps } from '@types';

export default function HomeIcon({ size, color, opacity = 0.5 }: IIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.45642 21.25V16.1711H14.5781V21.25H20.4437V8.74738L11.9008 2.75L3.55664 8.74738V21.25H9.45642Z"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeOpacity={opacity}
            />
        </Svg>
    );
}
