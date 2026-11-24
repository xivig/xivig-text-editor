import {
  ExtensionContributionCommand,
  ExtensionContributionSetting,
  ExtensionContributionTheme,
  ExtensionManifest,
} from '../api/types';

export class ContributionRegistry {
  private settingsMap = new Map<string, ExtensionContributionSetting[]>();
  private commandsMap = new Map<string, ExtensionContributionCommand[]>();
  private themesMap = new Map<string, ExtensionContributionTheme[]>();

  registerManifestContributions(extensionId: string, manifest: ExtensionManifest) {
    if (manifest.contributes?.settings) {
      this.settingsMap.set(extensionId, manifest.contributes.settings);
    }
    if (manifest.contributes?.commands) {
      this.commandsMap.set(extensionId, manifest.contributes.commands);
    }
    if (manifest.contributes?.themes) {
      this.themesMap.set(extensionId, manifest.contributes.themes);
    }
  }

  unregisterContributions(extensionId: string) {
    this.settingsMap.delete(extensionId);
    this.commandsMap.delete(extensionId);
    this.themesMap.delete(extensionId);
  }

  getAllSettings(): ExtensionContributionSetting[] {
    const all: ExtensionContributionSetting[] = [];
    for (const settings of this.settingsMap.values()) {
      all.push(...settings);
    }
    return all;
  }

  getAllCommands(): ExtensionContributionCommand[] {
    const all: ExtensionContributionCommand[] = [];
    for (const cmds of this.commandsMap.values()) {
      all.push(...cmds);
    }
    return all;
  }

  getAllThemes(): ExtensionContributionTheme[] {
    const all: ExtensionContributionTheme[] = [];
    for (const themes of this.themesMap.values()) {
      all.push(...themes);
    }
    return all;
  }
}

export const contributionRegistry = new ContributionRegistry();
