/**
 * Category 11: Python Development Extensions
 * Type definitions & configuration interfaces
 */

export interface PythonEnvironment {
  path: string;
  name: string;
  type: 'venv' | 'conda' | 'pyenv' | 'global';
  version?: string;
  isDefault?: boolean;
}

export interface PythonSettings {
  enabled: boolean;
  defaultInterpreterPath?: string;
  autoSelectVenv: boolean;
}

export interface PylanceSettings {
  enabled: boolean;
  typeCheckingMode: 'off' | 'basic' | 'strict';
  autoImportCompletions: boolean;
  diagnosticMode: 'openFilesOnly' | 'workspace';
}

export interface JupyterCell {
  cell_type: 'code' | 'markdown' | 'raw';
  source: string[];
  execution_count?: number | null;
  outputs?: any[];
  metadata?: Record<string, any>;
}

export interface JupyterNotebook {
  cells: JupyterCell[];
  metadata: Record<string, any>;
  nbformat: number;
  nbformat_minor: number;
}

export interface BlackSettings {
  enabled: boolean;
  lineLength: number;
  stringNormalization: boolean;
}

export interface IsortSettings {
  enabled: boolean;
  combineAsImports: boolean;
  linesBetweenSections: number;
}

export interface RuffDiagnostic {
  code: string;
  message: string;
  lineNumber: number;
  severity: 'error' | 'warning' | 'info';
}

export interface RuffSettings {
  enabled: boolean;
  fixAllOnSave: boolean;
  select: string[];
}
