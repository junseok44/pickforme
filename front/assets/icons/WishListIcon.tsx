import Svg, { Path } from 'react-native-svg';

import type { IIconProps } from '@types';

export default function WishListIcon({ size, color, opacity = 0.5 }: IIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M16.7496 9.14953V8.03763C16.7496 5.41466 14.6232 3.28833 12.0003 3.28833C9.37731 3.28833 7.25098 5.41466 7.25098 8.03763V9.14953"
                stroke={color}
                strokeOpacity={opacity}
                strokeWidth="1.5"
                strokeLinecap="square"
                strokeLinejoin="round"
            />
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20.1869 20.7116L21.25 7.35906L2.75 7.35907L3.81307 20.7116L20.1869 20.7116Z"
                stroke={color}
                strokeOpacity={opacity}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </Svg>
    );
}
