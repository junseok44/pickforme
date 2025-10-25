/** @type {import('@expo/config').ExpoConfig} */
export default ({ config }) => {
    const environment = process.env.APP_ENV || 'production';

    const scheme =
        environment === 'staging'
            ? 'com.sigonggan.pickforme.staging'
            : environment === 'development'
            ? 'com.sigonggan.pickforme.dev'
            : 'com.sigonggan.pickforme';

    const name =
        environment === 'staging' ? '픽포미(Staging)' : environment === 'development' ? '픽포미(Dev)' : '픽포미';

    const iosGoogleClientId = 'com.googleusercontent.apps.951645615132-o03i09hk60vq00vl25ri2vu8uoohdq7l';
    const iosKakaoClientId = 'kakaoa48d1b07defd794b769579746e2bb995';

    return {
        ...config,
        name,
        slug: 'pickformeapp',
        owner: 'sigonggan',
        version: '3.3.4',
        orientation: 'portrait',
        icon: './assets/images/pickforme_logoWtxt_200x200.png',
        scheme,
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        extra: {
            eas: {
                projectId: 'fc30c083-8843-43b4-9abc-5754cd747988'
            },
            router: {
                origin: false
            },
            environment
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: scheme,
            jsEngine: 'jsc',
            icon: './assets/images/pickforme_logo_200x200.png',
            googleServicesFile: './GoogleService-Info.plist',
            buildNumber: '1',
            infoPlist: {
                CFBundleURLTypes: [
                    {
                        CFBundleURLSchemes: [scheme, iosGoogleClientId, iosKakaoClientId, 'exp+pickformeapp']
                    }
                ]
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/images/pickforme_logo_200x200.png',
                backgroundColor: '#ffffff'
            },
            package: scheme,
            googleServicesFile: './google-services.json',
            versionCode: 119
        },
        web: {
            bundler: 'metro',
            output: 'static',
            favicon: './assets/images/pickforme_logoWtxt_200x200.png'
        },
        plugins: [
            ['@react-native-firebase/app', '@react-native-firebase/analytics'],
            ['@react-native-seoul/kakao-login', { kakaoAppKey: 'a48d1b07defd794b769579746e2bb995' }],
            '@react-native-google-signin/google-signin',
            'expo-router',
            'expo-apple-authentication',
            [
                'expo-splash-screen',
                {
                    image: './assets/images/pickforme_logoWtxt_4x.png',
                    imageWidth: 200,
                    resizeMode: 'contain',
                    backgroundColor: '#ffffff'
                }
            ],
            [
                'expo-build-properties',
                {
                    android: {
                        extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
                        kotlinVersion: '1.9.25'
                    },
                    ios: {
                        useFrameworks: 'dynamic'
                    }
                }
            ],
            'expo-font'
        ],
        experiments: {
            typedRoutes: true
        },
        runtimeVersion: '3.3.4',
        updates: {
            enabled: true,
            fallbackToCacheTimeout: 0,
            url: 'https://u.expo.dev/fc30c083-8843-43b4-9abc-5754cd747988'
        }
    };
};
