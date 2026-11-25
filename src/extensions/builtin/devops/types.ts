/**
 * Category 10: Docker & DevOps Extensions
 * Types and interfaces for Docker, Kubernetes, Dev Containers, YAML, Terraform, and Azure
 */

export type DockerInstructionType =
  | 'FROM'
  | 'RUN'
  | 'CMD'
  | 'LABEL'
  | 'EXPOSE'
  | 'ENV'
  | 'ADD'
  | 'COPY'
  | 'ENTRYPOINT'
  | 'VOLUME'
  | 'USER'
  | 'WORKDIR'
  | 'ARG'
  | 'ONBUILD'
  | 'STOPSIGNAL'
  | 'HEALTHCHECK'
  | 'SHELL';

export interface DockerfileInstruction {
  instruction: DockerInstructionType;
  args: string;
  lineNumber: number;
  stageName?: string;
}

export interface DockerfileLintError {
  lineNumber: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  instruction?: DockerInstructionType;
}

export interface DockerSettings {
  enabled: boolean;
  lintOnSave: boolean;
  defaultRegistry?: string;
}

export interface K8sMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface K8sManifest {
  apiVersion: string;
  kind: string;
  metadata: K8sMetadata;
  spec?: Record<string, any>;
  data?: Record<string, any>;
}

export interface K8sLintResult {
  resource?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface K8sSettings {
  enabled: boolean;
  validateManifests: boolean;
}

export interface DevContainerConfig {
  name?: string;
  image?: string;
  dockerFile?: string;
  build?: {
    dockerfile?: string;
    context?: string;
    args?: Record<string, string>;
  };
  features?: Record<string, any>;
  forwardPorts?: number[];
  postCreateCommand?: string | string[];
  remoteUser?: string;
  customizations?: Record<string, any>;
}

export interface DevContainerValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface YamlValidationResult {
  valid: boolean;
  errors: Array<{ line: number; message: string }>;
}

export interface YamlSettings {
  enabled: boolean;
  indentSize: number;
  prohibitTabs: boolean;
}

export type TerraformBlockType =
  | 'terraform'
  | 'provider'
  | 'resource'
  | 'data'
  | 'variable'
  | 'output'
  | 'locals'
  | 'module';

export interface TerraformBlock {
  type: TerraformBlockType;
  labels: string[];
  lineNumber: number;
  body: string;
}

export interface TerraformLintResult {
  block: string;
  severity: 'error' | 'warning';
  message: string;
  lineNumber?: number;
}

export interface AzureResource {
  type: string;
  name: string;
  apiVersion: string;
  location: string;
  properties?: Record<string, any>;
}

export interface AzureTemplateValidation {
  valid: boolean;
  errors: string[];
  resources: AzureResource[];
}
