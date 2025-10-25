module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            'expo-router/babel',
            [
                'module-resolver',
                {
                    alias: {
                        '@': './',
                        '@stores': './stores/index.ts',
                        '@types': './types/index.ts',
                        '@services': './services/index.ts',
                        '@components': './components/index.ts',
                        '@assets': './assets/index.ts',
                        '@utils': './utils/index.ts',
                        '@hooks': './hooks/index.ts',
                        '@constants': './constants/index.ts'
                    }
                }
            ]
        ],
        env: {
            production: {
                plugins: ['react-native-paper/babel']
            }
        }
    };
};
