/**
 * Category 15: Android / Kotlin Development Extensions
 * Type definitions & configuration interfaces
 */

export interface KotlinSymbol {
  name: string;
  kind: 'fun' | 'class' | 'data class' | 'object' | 'interface' | 'val' | 'var';
  package?: string;
  isSuspend?: boolean;
  lineNumber: number;
}

export interface AndroidStringEntry {
  name: string;
  value: string;
  translatable?: boolean;
  locale?: string;
}

export interface AndroidGradleConfig {
  compileSdk?: number;
  minSdk?: number;
  targetSdk?: number;
  versionCode?: number;
  versionName?: string;
  applicationId?: string;
}

export interface AdbDevice {
  id: string;
  state: 'device' | 'offline' | 'unauthorized' | 'no device';
  model?: string;
  product?: string;
  transportId?: string;
}

export interface AndroidManifestValidation {
  valid: boolean;
  errors: string[];
  package?: string;
  activities: string[];
  permissions: string[];
}
