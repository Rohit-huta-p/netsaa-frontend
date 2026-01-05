// babel.config.js
module.exports = function (api) {
    api.cache(true);

    return {
        presets: [
            ['babel-preset-expo', { jsxImportSource: 'nativewind', unstable_transformImportMeta: true }],
            'nativewind/babel',
        ],
        plugins: [
            // if you use reanimated, ensure this is LAST:
            'react-native-reanimated/plugin',
        ],
    };
};
