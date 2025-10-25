import { useColorScheme as useColorSchemeBase } from 'react-native';
import { settingAtom } from '../stores/auth/atoms';
import { useAtomValue } from 'jotai';

export type ColorScheme = 'light' | 'dark';

const useColorScheme: () => ColorScheme = () => {
    const { theme } = useAtomValue(settingAtom);
    const colorScheme = useColorSchemeBase();
    if (!colorScheme && !theme) {
        return 'light';
    }
    if (!theme || theme === 'default') {
        return colorScheme ?? 'light';
    }
    return theme;
};

export default useColorScheme;
