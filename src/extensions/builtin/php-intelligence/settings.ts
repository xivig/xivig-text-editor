export interface PhpIntelligenceSettings {
  enabled: boolean;
  enablePhpStormTemplates: boolean;
  enableCoreCompletions: boolean;
  enableHoverDocs: boolean;
}

export const DEFAULT_PHP_SETTINGS: PhpIntelligenceSettings = {
  enabled: true,
  enablePhpStormTemplates: true,
  enableCoreCompletions: true,
  enableHoverDocs: true,
};
