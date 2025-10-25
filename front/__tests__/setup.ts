// Setup for React Native Testing Library
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native modules
jest.mock('react-native-get-random-values', () => ({}));

// Mock authentication modules
jest.mock('@react-native-seoul/kakao-login', () => ({
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn()
}));

jest.mock('expo-apple-authentication', () => ({
    AppleAuthenticationButton: 'AppleAuthenticationButton',
    AppleAuthenticationButtonType: {
        SIGN_IN: 0,
        SIGN_UP: 1,
        CONTINUE: 2
    },
    AppleAuthenticationButtonStyle: {
        WHITE: 0,
        WHITE_OUTLINE: 1,
        BLACK: 2
    },
    signInAsync: jest.fn(),
    getCredentialStateAsync: jest.fn()
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
        configure: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        isSignedIn: jest.fn()
    }
}));

// Mock expo modules
jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: 'MaterialIcons',
    Ionicons: 'Ionicons'
}));

jest.mock('expo-router', () => ({
    router: {
        back: jest.fn(),
        push: jest.fn()
    },
    useLocalSearchParams: jest.fn(() => ({}))
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy'
    }
}));

jest.mock('expo-web-browser', () => ({
    openBrowserAsync: jest.fn()
}));

jest.mock('react-native-modal', () => 'Modal');

jest.mock('react-native-webview', () => ({
    WebView: 'WebView'
}));

// Mock react-native-markdown-display
jest.mock('react-native-markdown-display', () => {
    const React = require('react');
    const { Text } = require('react-native');

    return function MockMarkdown(props: any) {
        return React.createElement(
            Text,
            {
                ...props,
                style: [props.style?.body, props.style]
            },
            props.children
        );
    };
});

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-123')
}));

// Mock firebase
jest.mock('@/services/firebase', () => ({
    logEvent: jest.fn(),
    logViewItemDetail: jest.fn()
}));

// Mock utility functions
jest.mock('@/utils/crawlLog', () => ({
    logCrawlProcessResult: jest.fn()
}));

jest.mock('@/utils/accessibility', () => ({
    focusOnRef: jest.fn()
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    router: {
        back: jest.fn(),
        push: jest.fn(),
        replace: jest.fn(),
        navigate: jest.fn()
    },
    useRouter: jest.fn(() => ({
        back: jest.fn(),
        push: jest.fn(),
        replace: jest.fn(),
        navigate: jest.fn()
    })),
    useLocalSearchParams: jest.fn(() => ({
        productUrl: 'https://www.coupang.com/vp/products/123456',
        tab: 'caption'
    }))
}));

// Note: useWebViewFallback is mocked individually in test files that need it

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: jest.fn(() => ({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    })),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children
}));

// Note: webview components are mocked individually in their respective test files
// since they will have their own test suites later

// Silence console warnings for tests
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn()
};
