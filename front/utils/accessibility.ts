import { AccessibilityInfo, findNodeHandle, InteractionManager } from 'react-native';

export const focusOnRef = (ref: React.RefObject<any>, delay: number = 0) => {
    const node = findNodeHandle(ref.current);
    if (node) {
        InteractionManager.runAfterInteractions(() => {
            if (delay > 0) {
                setTimeout(() => AccessibilityInfo.setAccessibilityFocus(node), delay);
            } else {
                AccessibilityInfo.setAccessibilityFocus(node);
            }
        });
    }
};
