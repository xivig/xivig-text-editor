/**
 * Category 12: Java Development Extensions
 * Type definitions & schemas for Java, Spring Boot, Maven, and Debugger
 */

export interface JdkInstallation {
  path: string;
  name?: string;
  version?: string;
  vendor?: string;
  isDefault?: boolean;
}

export interface JavaSymbol {
  name: string;
  kind: 'class' | 'interface' | 'record' | 'enum' | 'method';
  package?: string;
  lineNumber: number;
  modifiers: string[];
}

export interface JavaSettings {
  enabled: boolean;
  home?: string;
  autobuild: boolean;
  completionMatchCase: boolean;
}

export interface SpringPropertyItem {
  key: string;
  value: string;
  line: number;
}

export interface SpringBootSettings {
  enabled: boolean;
  liveProcessInspection: boolean;
}

export interface MavenDependency {
  groupId: string;
  artifactId: string;
  version?: string;
  scope?: string;
}

export interface MavenProject {
  groupId?: string;
  artifactId?: string;
  version?: string;
  name?: string;
  packaging?: string;
  dependencies: MavenDependency[];
}

export interface MavenSettings {
  enabled: boolean;
  executablePath?: string;
  defaultGoals: string[];
}

export interface JavaLaunchConfig {
  name: string;
  type: 'java';
  request: 'launch' | 'attach';
  mainClass?: string;
  projectName?: string;
  args?: string;
  vmArgs?: string;
  hostName?: string;
  port?: number;
}
