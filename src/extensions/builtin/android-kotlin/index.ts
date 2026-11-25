import { BuiltinExtensionModule } from '../../api/types';

export * from './types';
export * from './kotlinPlugin';
export * from './androidI18nPlugin';
export * from './gradleAndroidPlugin';
export * from './adbPlugin';
export * from './xmlToolsPlugin';

// 1. Kotlin
export const kotlinExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.kotlin',
    name: 'Kotlin',
    publisher: 'JetBrains',
    version: '0.2.33',
    description: 'Kotlin language support for Xivig with data classes, coroutines, and scope function completions.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#7f52ff',
    iconSymbol: '🇰',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Android i18n
export const androidI18nExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.android-i18n',
    name: 'Android i18n',
    publisher: 'Dominic Vonk',
    version: '1.2.0',
    description: 'Manage and translate Android strings.xml resources across multiple locale directories.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#3ddc84',
    iconSymbol: '🌐',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Gradle for Android/Java
export const gradleAndroidExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.gradle-android',
    name: 'Gradle for Android/Java',
    publisher: 'vsciot-vscode',
    version: '3.16.2',
    description: 'Parse build.gradle, extract Android SDK configurations, and run build tasks with Gradle wrapper.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#02303a',
    iconSymbol: '🐘',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. ADB Interface
export const adbExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.adb-interface',
    name: 'ADB Interface',
    publisher: 'SimonSiefke',
    version: '1.4.1',
    description: 'Interact with Android Debug Bridge (ADB) devices, view connected emulators, and inspect logs.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#3ddc84',
    iconSymbol: '🤖',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. XML Tools
export const xmlToolsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.xml-tools',
    name: 'XML Tools',
    publisher: 'Josh Johnson',
    version: '2.5.1',
    description: 'XML formatting, AndroidManifest.xml validation, and activity/permission declaration extractors.',
    categories: ['Productivity', 'Languages'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#e67e22',
    iconSymbol: '🏷️',
  },
  activate: () => {},
  deactivate: () => {},
};
