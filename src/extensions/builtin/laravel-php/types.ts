/**
 * Category 7: Laravel & PHP Development Extensions
 * Type definitions & configuration interfaces
 */

export interface PhpIntelephenseSettings {
  enabled: boolean;
  version: string;
  diagnostics: boolean;
  typeInference: boolean;
  suggestDocblocks: boolean;
}

export interface ArtisanCommandItem {
  command: string;
  description: string;
  category: 'make' | 'migrate' | 'db' | 'route' | 'cache' | 'config' | 'queue';
  arguments?: string[];
  options?: string[];
}

export interface LaravelArtisanSettings {
  enabled: boolean;
  phpBinary: string; // default: "php"
  artisanPath: string; // default: "artisan"
}

export interface LaravelRouteDefinition {
  uri: string;
  name?: string;
  action: string; // e.g. "UserController@index" or "[UserController::class, 'index']"
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ANY';
  controllerClass?: string;
  controllerMethod?: string;
}

export interface ControllerLocationResult {
  controllerName: string;
  methodName?: string;
  possibleFilePaths: string[];
  targetLine?: number;
}

export interface LaravelExtraIntellisenseSettings {
  enabled: boolean;
  routeCompletion: boolean;
  viewCompletion: boolean;
  configCompletion: boolean;
  envCompletion: boolean;
}

export interface PhpNamespaceResult {
  namespace: string;
  className: string;
  fullQualifiedClass: string;
}

export interface PhpNamespaceSettings {
  enabled: boolean;
  psr4Prefix: string; // default: "App\\"
  psr4RootDirectory: string; // default: "app"
  sortAlphabetically: boolean;
}

export interface PhpDocBlockParam {
  type: string;
  name: string;
  description?: string;
}

export interface GeneratedDocBlock {
  summary?: string;
  params: PhpDocBlockParam[];
  returnType?: string;
  formatted: string;
}

export interface ComposerSettings {
  enabled: boolean;
  composerBinary: string; // default: "composer"
  autoDumpAutoload: boolean;
}
