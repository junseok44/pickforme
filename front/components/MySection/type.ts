import { AccessibilityRole } from 'react-native';

interface IMySectionItem {
    name: string;
    onPress?(): void;
}

export interface IMySectionProps {
    title: string;
    items: IMySectionItem[];
    role?: AccessibilityRole;
}
