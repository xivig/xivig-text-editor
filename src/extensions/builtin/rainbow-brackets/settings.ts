export interface RainbowBracketsSettings {
  enabled: boolean;
  brackets: boolean;
  indentGuides: boolean;
  tabSize?: number;
}

export const DEFAULT_RAINBOW_SETTINGS: RainbowBracketsSettings = {
  enabled: true,
  brackets: true,
  indentGuides: false,
  tabSize: 4,
};

export const RAINBOW_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'purple',
] as const;

export type RainbowColor = typeof RAINBOW_COLORS[number];
