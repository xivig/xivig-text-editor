import { AdbDevice } from './types';

/**
 * Parses output from `adb devices -l` into typed device records.
 */
export function parseAdbDevicesOutput(stdout: string): AdbDevice[] {
  if (!stdout) return [];

  const devices: AdbDevice[] = [];
  const lines = stdout.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('List of devices') || trimmed.startsWith('* daemon')) {
      continue;
    }

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) continue;

    const id = tokens[0];
    const rawState = tokens[1].toLowerCase();
    const state: AdbDevice['state'] =
      rawState === 'device' || rawState === 'offline' || rawState === 'unauthorized'
        ? rawState
        : 'offline';

    const modelMatch = trimmed.match(/model:([^\s]+)/);
    const productMatch = trimmed.match(/product:([^\s]+)/);
    const transportMatch = trimmed.match(/transport_id:([^\s]+)/);

    devices.push({
      id,
      state,
      model: modelMatch?.[1],
      product: productMatch?.[1],
      transportId: transportMatch?.[1],
    });
  }

  return devices;
}

/**
 * Constructs an ADB CLI command with optional target device targeting (-s <id>).
 */
export function buildAdbCommand(
  deviceId: string | undefined,
  subCommand: 'devices' | 'logcat' | 'install' | 'uninstall' | 'shell',
  args: string[] = []
): string {
  const parts: string[] = ['adb'];

  if (deviceId) {
    parts.push('-s', deviceId);
  }

  parts.push(subCommand);
  parts.push(...args);

  return parts.join(' ');
}
