const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const config = getDefaultConfig(__dirname);

// Tamagui's provider and components must share the same theme context, even
// when npm installs a separate @tamagui/web copy under each component package.
const tamaguiCoreOrigin = require.resolve('@tamagui/core');
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@tamagui/web' || moduleName.startsWith('@tamagui/web/')) {
        return context.resolveRequest(
            { ...context, originModulePath: tamaguiCoreOrigin }, moduleName, platform
        );
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = wrapWithReanimatedMetroConfig(config);
