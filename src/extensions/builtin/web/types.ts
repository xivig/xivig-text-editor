/**
 * Category 4: Web Development Extensions
 * Type definitions & configuration interfaces
 */

export interface LiveServerSettings {
  enabled: boolean;
  port: number;
  autoOpenBrowser: boolean;
  ignorePatterns: string[];
  liveReloadDebounceMs: number;
  notifyOnReload: boolean;
}

export type DevicePresetId =
  | 'responsive'
  | 'iphone14'
  | 'pixel7'
  | 'ipad'
  | 'desktop'
  | 'macbook';

export interface DevicePreset {
  id: DevicePresetId;
  name: string;
  width: number;
  height: number;
  dpr: number;
  type: 'responsive' | 'mobile' | 'tablet' | 'desktop';
}

export interface LivePreviewSettings {
  enabled: boolean;
  defaultDevice: DevicePresetId;
  defaultOrientation: 'portrait' | 'landscape';
  zoom: number;
  autoReloadOnSave: boolean;
  highlightElementOnInspect: boolean;
  captureConsoleLogs: boolean;
}

export interface EmulatedViewport {
  width: number | '100%';
  height: number | '100%';
  zoom: number;
  dpr: number;
  orientation: 'portrait' | 'landscape';
  presetId: DevicePresetId;
}

export interface ScrapedCssSelector {
  name: string; // e.g. "btn-primary" or "main-nav"
  rawSelector: string; // e.g. ".btn-primary" or "#main-nav"
  type: 'class' | 'id';
  file?: string;
  line?: number;
  column?: number;
  ruleBody?: string;
  specificity?: { a: number; b: number; c: number; score: number };
}

export interface HtmlCssSupportSettings {
  enabled: boolean;
  scanCssFiles: boolean;
  scanHtmlFiles: boolean;
  maxSuggestions: number;
  includeIdSelectors: boolean;
  fileExtensions: string[];
}

export interface CssPeekResult {
  selector: string;
  type: 'class' | 'id';
  file: string;
  line: number;
  column: number;
  cssBlock: string;
}

export interface CssPeekSettings {
  enabled: boolean;
  enableHoverPeek: boolean;
  maxMatchCount: number;
}

export interface CssSpecificityScore {
  a: number; // IDs
  b: number; // Classes, attributes, pseudo-classes
  c: number; // Type selectors and pseudo-elements
  score: number; // a * 1000 + b * 100 + c
  formatted: string; // e.g. "(0, 1, 2)"
  category: 'low' | 'medium' | 'high' | 'ultra';
}

export interface CssClassIntellisenseSettings {
  enabled: boolean;
  showSpecificityScore: boolean;
  showSpecificityBadge: boolean;
  sortOrder: 'specificity' | 'alphabetical';
}

export interface TailwindClassItem {
  name: string;
  category: 'layout' | 'flexbox' | 'grid' | 'spacing' | 'sizing' | 'typography' | 'colors' | 'borders' | 'effects' | 'transitions';
  cssRules: string;
  colorPreview?: string; // Hex color string for color swatches
  documentation?: string;
}

export interface TailwindSettings {
  enabled: boolean;
  colorPreviews: boolean;
  hoverCssPreview: boolean;
  prefix: string;
}

export interface BootstrapComponentSnippet {
  label: string;
  detail: string;
  template: string;
  category: 'grid' | 'components' | 'utilities' | 'forms';
}

export interface BootstrapSettings {
  enabled: boolean;
  version: '5.3';
  includeGridSnippets: boolean;
  includeComponents: boolean;
}

export interface SvgMetadata {
  width?: string | number;
  height?: string | number;
  viewBox?: string;
  elementCount: number;
  pathCount: number;
  colors: string[];
  hasScripts: boolean;
  isSanitized: boolean;
}

export interface SvgViewerSettings {
  enabled: boolean;
  sanitizeOnRender: boolean;
  showCheckerboardGrid: boolean;
  allowScripts: boolean;
  maxFileSizeKb: number;
}
