export const FontSizes = {
    medium: 14,
    large: 16,
    extraLarge: 20
} as const;

export type FontSizeType = keyof typeof FontSizes;
