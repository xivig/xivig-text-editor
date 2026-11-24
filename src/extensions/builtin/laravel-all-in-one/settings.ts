export interface LaravelSettings {
  enabled: boolean;
  enableBlade: boolean;
  enableRouting: boolean;
  enableEloquent: boolean;
  enableMigrations: boolean;
}

export const DEFAULT_LARAVEL_SETTINGS: LaravelSettings = {
  enabled: true,
  enableBlade: true,
  enableRouting: true,
  enableEloquent: true,
  enableMigrations: true,
};
