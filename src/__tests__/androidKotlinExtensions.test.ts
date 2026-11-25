import { describe, it, expect } from 'vitest';
import {
  parseKotlinSymbols,
  createKotlinCompletionSource,
  parseAndroidStringsXml,
  findMissingTranslations,
  generateAndroidStringsXml,
  parseGradleAndroidConfig,
  buildGradleCliCommand,
  createGradleCompletionSource,
  parseAdbDevicesOutput,
  buildAdbCommand,
  validateAndroidManifest,
  formatXml,
} from '../extensions/builtin/android-kotlin';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Category 15: Android / Kotlin Development Extensions', () => {
  describe('Kotlin Language Intelligence', () => {
    const kotlinSource = `
package com.xivig.mobile.app

import kotlinx.coroutines.flow.Flow

data class UserProfile(val id: String, val name: String)

interface Repository {
    suspend fun fetchProfile(): UserProfile
}

object NetworkClient {
    val timeout: Long = 5000L
}

fun calculateMetrics(data: List<Int>): Int {
    return data.sum()
}
    `;

    it('extracts package, data classes, interfaces, objects, and functions', () => {
      const parsed = parseKotlinSymbols(kotlinSource);
      expect(parsed.package).toBe('com.xivig.mobile.app');
      expect(parsed.symbols.length).toBeGreaterThanOrEqual(5);

      const dataClass = parsed.symbols.find((s) => s.kind === 'data class');
      expect(dataClass?.name).toBe('UserProfile');

      const iface = parsed.symbols.find((s) => s.kind === 'interface');
      expect(iface?.name).toBe('Repository');

      const suspendFun = parsed.symbols.find((s) => s.name === 'fetchProfile');
      expect(suspendFun?.kind).toBe('fun');
      expect(suspendFun?.isSuspend).toBe(true);

      const obj = parsed.symbols.find((s) => s.kind === 'object');
      expect(obj?.name).toBe('NetworkClient');

      const regularFun = parsed.symbols.find((s) => s.name === 'calculateMetrics');
      expect(regularFun?.kind).toBe('fun');
      expect(regularFun?.isSuspend).toBe(false);
    });

    it('provides CodeMirror autocompletion for Kotlin keywords and stdlib constructs', () => {
      const state = EditorState.create({ doc: 'sus' });
      const context = new CompletionContext(state, 3, true);
      const source = createKotlinCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('suspend');
    });
  });

  describe('Android i18n & strings.xml', () => {
    const defaultXml = `
<resources>
    <string name="app_name">Xivig Editor</string>
    <string name="welcome_message">Welcome to your mobile workspace</string>
    <string name="build_version" translatable="false">1.5.0</string>
</resources>
    `;

    it('parses strings.xml extracting keys, values, and translatable flags', () => {
      const entries = parseAndroidStringsXml(defaultXml);
      expect(entries).toHaveLength(3);

      expect(entries[0]).toEqual({
        name: 'app_name',
        value: 'Xivig Editor',
        translatable: true,
        locale: 'default',
      });

      expect(entries[2]).toEqual({
        name: 'build_version',
        value: '1.5.0',
        translatable: false,
        locale: 'default',
      });
    });

    it('detects missing translations in localized directories while ignoring non-translatable items', () => {
      const defaultEntries = parseAndroidStringsXml(defaultXml);
      const spanishEntries = [
        { name: 'app_name', value: 'Editor Xivig', translatable: true, locale: 'es' },
      ];

      const missing = findMissingTranslations(defaultEntries, { es: spanishEntries });
      expect(missing.es).toEqual(['welcome_message']);
      expect(missing.es).not.toContain('build_version');
    });

    it('generates formatted strings.xml resource documents', () => {
      const entries = [
        { name: 'action_save', value: 'Save' },
        { name: 'api_url', value: 'https://api.com', translatable: false },
      ];

      const xml = generateAndroidStringsXml(entries);
      expect(xml).toContain('<resources>');
      expect(xml).toContain('<string name="action_save">Save</string>');
      expect(xml).toContain('<string name="api_url" translatable="false">https://api.com</string>');
    });
  });

  describe('Gradle for Android / Java', () => {
    const buildGradle = `
android {
    compileSdk = 34

    defaultConfig {
        applicationId = "com.xivig.mobile"
        minSdk = 24
        targetSdk = 34
        versionCode = 42
        versionName = "1.5.0"
    }
}
    `;

    it('parses Android SDK configurations, applicationId, and versioning info', () => {
      const config = parseGradleAndroidConfig(buildGradle);
      expect(config.compileSdk).toBe(34);
      expect(config.minSdk).toBe(24);
      expect(config.targetSdk).toBe(34);
      expect(config.applicationId).toBe('com.xivig.mobile');
      expect(config.versionCode).toBe(42);
      expect(config.versionName).toBe('1.5.0');
    });

    it('builds Gradle wrapper CLI commands with options', () => {
      const cmd = buildGradleCliCommand(['assembleRelease', 'test'], true, true);
      expect(cmd).toBe('./gradlew --offline --stacktrace assembleRelease test');
    });

    it('provides CodeMirror completion for Gradle Android blocks', () => {
      const state = EditorState.create({ doc: 'def' });
      const context = new CompletionContext(state, 3, true);
      const source = createGradleCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels.some((l) => l.includes('defaultConfig'))).toBe(true);
    });
  });

  describe('ADB Interface', () => {
    it('parses adb devices -l output into structured records', () => {
      const adbOutput = `
List of devices attached
emulator-5554          device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 transport_id:1
R5CR104ABC             device product:beyond2qlteue model:SM_G975U transport_id:2
emulator-5556          offline transport_id:3
      `;

      const devices = parseAdbDevicesOutput(adbOutput);
      expect(devices).toHaveLength(3);

      expect(devices[0].id).toBe('emulator-5554');
      expect(devices[0].state).toBe('device');
      expect(devices[0].model).toBe('sdk_gphone64_arm64');

      expect(devices[1].id).toBe('R5CR104ABC');
      expect(devices[1].model).toBe('SM_G975U');

      expect(devices[2].id).toBe('emulator-5556');
      expect(devices[2].state).toBe('offline');
    });

    it('builds targeted ADB commands with device serial flag', () => {
      const logcatCmd = buildAdbCommand('emulator-5554', 'logcat', ['-v', 'time']);
      expect(logcatCmd).toBe('adb -s emulator-5554 logcat -v time');

      const installCmd = buildAdbCommand(undefined, 'install', ['app-debug.apk']);
      expect(installCmd).toBe('adb install app-debug.apk');
    });
  });

  describe('XML Tools & AndroidManifest.xml', () => {
    const manifestXml = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.xivig.mobile">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="Xivig">
        <activity android:name=".MainActivity" />
        <activity android:name=".SettingsActivity" />
    </application>
</manifest>
    `;

    it('validates AndroidManifest.xml and extracts package, activities, and permissions', () => {
      const val = validateAndroidManifest(manifestXml);
      expect(val.valid).toBe(true);
      expect(val.package).toBe('com.xivig.mobile');
      expect(val.permissions).toEqual([
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
      ]);
      expect(val.activities).toEqual(['.MainActivity', '.SettingsActivity']);
    });

    it('formats XML with consistent indentation', () => {
      const unformatted = '<root><child attr="val">text</child><empty/></root>';
      const formatted = formatXml(unformatted, 2);

      expect(formatted).toBe('<root>\n  <child attr="val">\n    text\n  </child>\n  <empty/>\n</root>\n');
    });
  });
});
