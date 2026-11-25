import { ReactNativeComponentSnippet, ReactNativeToolsSettings } from './types';

export const DEFAULT_REACT_NATIVE_SETTINGS: ReactNativeToolsSettings = {
  enabled: true,
  packagerPort: 8081,
  defaultPlatform: 'android',
};

export const REACT_NATIVE_SNIPPETS: ReactNativeComponentSnippet[] = [
  {
    name: 'rn-screen',
    tag: 'Screen',
    importStatement: "import React from 'react';\nimport { StyleSheet, Text, View, SafeAreaView } from 'react-native';",
    detail: 'Complete React Native Screen Boilerplate',
    template: `import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';

export const $1Screen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>$1</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default $1Screen;`,
  },
  {
    name: 'rn-stylesheet',
    tag: 'StyleSheet',
    importStatement: "import { StyleSheet } from 'react-native';",
    detail: 'StyleSheet.create block',
    template: `const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});`,
  },
  {
    name: 'rn-flatlist',
    tag: 'FlatList',
    importStatement: "import { FlatList } from 'react-native';",
    detail: 'FlatList component with renderItem & keyExtractor',
    template: `<FlatList
  data={$1}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={styles.item}>
      <Text>{item.name}</Text>
    </View>
  )}
/>`,
  },
  {
    name: 'rn-touchable',
    tag: 'TouchableOpacity',
    importStatement: "import { TouchableOpacity } from 'react-native';",
    detail: 'TouchableOpacity button wrapper',
    template: `<TouchableOpacity style={styles.button} onPress={$1}>
  <Text style={styles.buttonText}>$0</Text>
</TouchableOpacity>`,
  },
  {
    name: 'rn-input',
    tag: 'TextInput',
    importStatement: "import { TextInput } from 'react-native';",
    detail: 'TextInput field with value and onChangeText',
    template: `<TextInput
  style={styles.input}
  value={$1}
  onChangeText={$2}
  placeholder="$3"
/>`,
  },
];

export function getReactNativeSnippet(name: string): ReactNativeComponentSnippet | undefined {
  return REACT_NATIVE_SNIPPETS.find((s) => s.name === name);
}

/**
 * Generates shell command line for React Native / Expo development.
 */
export function generateReactNativeCommand(
  action: 'run-android' | 'run-ios' | 'start' | 'expo-start',
  port = 8081
): string {
  switch (action) {
    case 'run-android':
      return 'npx react-native run-android';
    case 'run-ios':
      return 'npx react-native run-ios';
    case 'start':
      return `npx react-native start --port ${port}`;
    case 'expo-start':
      return 'npx expo start';
  }
}

/**
 * Checks if a file uses React Native primitives.
 */
export function isReactNativeFile(code: string): boolean {
  if (!code) return false;
  return /from\s+['"]react-native['"]/.test(code) || /from\s+['"]expo['"]/.test(code);
}
