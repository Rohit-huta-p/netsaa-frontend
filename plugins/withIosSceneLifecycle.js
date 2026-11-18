/**
 * withIosSceneLifecycle
 *
 * iOS 27's SDK requires apps to adopt the UIScene lifecycle, otherwise the app
 * aborts at launch with "UIScene life cycle is required for apps built with this
 * SDK." Expo SDK 54 targets iOS 26 and does not generate scene adoption, so we
 * add it here as a config plugin — this reapplies automatically on every
 * `expo prebuild`, since the ios/ folder is gitignored (Continuous Native
 * Generation) and hand-edits there would otherwise be wiped.
 *
 * What it does:
 *   1. Info.plist   → declares UIApplicationSceneManifest (what iOS 27 checks).
 *   2. AppDelegate   → injects `configurationForConnecting` and appends a
 *                      `SceneDelegate` class in the SAME file (so no fragile
 *                      Xcode-project file registration is needed). The
 *                      SceneDelegate attaches AppDelegate's existing window to
 *                      the UIWindowScene (a nil/no-op scene delegate renders black,
 *                      and expo-dev-launcher needs the window to exist during
 *                      didFinishLaunchingWithOptions, so the window stays in
 *                      AppDelegate and the scene just adopts it).
 *   3. Deployment    → bumps the iOS deployment target to 16.0 (Podfile base +
 *                      every Xcode build config), which the pods require.
 */
const {
  withInfoPlist,
  withAppDelegate,
  withPodfileProperties,
  withXcodeProject,
} = require('@expo/config-plugins');

const IOS_DEPLOYMENT_TARGET = '16.0';

const SCENE_METHOD = `  // UIScene lifecycle — required for iOS 27+ (injected by withIosSceneLifecycle)
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let config = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    config.delegateClass = SceneDelegate.self
    return config
  }

`;

const SCENE_DELEGATE_CLASS = `
// UIScene lifecycle delegate — required for iOS 27+ (injected by withIosSceneLifecycle)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let existingWindow = appDelegate.window else { return }
    existingWindow.windowScene = windowScene
    self.window = existingWindow
  }
}
`;

function withSceneInfoPlist(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });
}

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (!contents.includes('configurationForConnecting')) {
      if (contents.includes('  // Linking API')) {
        contents = contents.replace('  // Linking API', `${SCENE_METHOD}  // Linking API`);
      } else {
        // Fallback: insert before the final closing brace of the AppDelegate class.
        const anchor = '\n}\n\nclass ReactNativeDelegate';
        if (contents.includes(anchor)) {
          contents = contents.replace(anchor, `\n${SCENE_METHOD}}\n\nclass ReactNativeDelegate`);
        }
      }
    }

    if (!contents.includes('class SceneDelegate')) {
      contents = `${contents.trimEnd()}\n${SCENE_DELEGATE_CLASS}`;
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withSceneDeploymentTarget(config) {
  config = withPodfileProperties(config, (cfg) => {
    cfg.modResults['ios.deploymentTarget'] = IOS_DEPLOYMENT_TARGET;
    return cfg;
  });

  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      const buildSettings = entry && entry.buildSettings;
      if (buildSettings && buildSettings.IPHONEOS_DEPLOYMENT_TARGET !== undefined) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = IOS_DEPLOYMENT_TARGET;
      }
    }
    return cfg;
  });

  return config;
}

module.exports = function withIosSceneLifecycle(config) {
  config = withSceneInfoPlist(config);
  config = withSceneAppDelegate(config);
  config = withSceneDeploymentTarget(config);
  return config;
};
