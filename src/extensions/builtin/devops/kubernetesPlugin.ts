import { K8sManifest, K8sLintResult, K8sSettings } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_K8S_SETTINGS: K8sSettings = {
  enabled: true,
  validateManifests: true,
};

const RECOGNIZED_KINDS = [
  'Pod', 'Deployment', 'Service', 'ConfigMap', 'Secret',
  'Ingress', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob',
  'Namespace', 'PersistentVolumeClaim', 'PersistentVolume',
  'HorizontalPodAutoscaler', 'ServiceAccount', 'Role', 'RoleBinding',
];

/**
 * Lightweight parser for Kubernetes YAML documents (supports multi-document files with `---`).
 */
export function parseK8sManifest(yamlContent: string): K8sManifest[] {
  if (!yamlContent || !yamlContent.trim()) return [];

  const rawDocs = yamlContent.split(/^---$/m).map((d) => d.trim()).filter(Boolean);
  const manifests: K8sManifest[] = [];

  for (const doc of rawDocs) {
    const lines = doc.split(/\r?\n/);
    let apiVersion = '';
    let kind = '';
    let name = '';
    let namespace: string | undefined;
    const labels: Record<string, string> = {};
    let inMetadata = false;
    let inLabels = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (!inMetadata) {
        if (trimmed.startsWith('apiVersion:')) {
          apiVersion = trimmed.replace('apiVersion:', '').trim().replace(/['"]/g, '');
        } else if (trimmed.startsWith('kind:')) {
          kind = trimmed.replace('kind:', '').trim().replace(/['"]/g, '');
        } else if (trimmed === 'metadata:') {
          inMetadata = true;
          inLabels = false;
        }
      } else {
        if (/^[a-zA-Z0-9_-]+:/.test(line) && !line.startsWith(' ') && !line.startsWith('\t')) {
          inMetadata = false;
          inLabels = false;
          continue;
        }

        if (trimmed.startsWith('name:')) {
          name = trimmed.replace('name:', '').trim().replace(/['"]/g, '');
        } else if (trimmed.startsWith('namespace:')) {
          namespace = trimmed.replace('namespace:', '').trim().replace(/['"]/g, '');
        } else if (trimmed === 'labels:') {
          inLabels = true;
        } else if (inLabels && line.startsWith('    ')) {
          const colonIdx = trimmed.indexOf(':');
          if (colonIdx !== -1) {
            const lk = trimmed.slice(0, colonIdx).trim();
            const lv = trimmed.slice(colonIdx + 1).trim().replace(/['"]/g, '');
            labels[lk] = lv;
          }
        } else if (inLabels && !line.startsWith('    ')) {
          inLabels = false;
        }
      }
    }

    if (apiVersion || kind || name) {
      manifests.push({
        apiVersion,
        kind,
        metadata: {
          name,
          namespace,
          labels: Object.keys(labels).length > 0 ? labels : undefined,
        },
      });
    }
  }

  return manifests;
}

/**
 * Lints a Kubernetes manifest against API conventions and RFC 1123 naming rules.
 */
export function lintK8sManifest(manifest: K8sManifest): K8sLintResult[] {
  const results: K8sLintResult[] = [];
  const loc = `${manifest.kind || 'Resource'}/${manifest.metadata?.name || 'unnamed'}`;

  if (!manifest.apiVersion) {
    results.push({
      resource: loc,
      severity: 'error',
      message: 'Missing "apiVersion" specification',
    });
  }

  if (!manifest.kind) {
    results.push({
      resource: loc,
      severity: 'error',
      message: 'Missing "kind" specification',
    });
  } else if (!RECOGNIZED_KINDS.includes(manifest.kind)) {
    results.push({
      resource: loc,
      severity: 'warning',
      message: `Unknown or Custom Resource Definition kind '${manifest.kind}'`,
    });
  }

  if (!manifest.metadata?.name) {
    results.push({
      resource: loc,
      severity: 'error',
      message: 'Missing required "metadata.name"',
    });
  } else {
    const name = manifest.metadata.name;
    const rfc1123 = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
    if (!rfc1123.test(name) || name.length > 253) {
      results.push({
        resource: loc,
        severity: 'error',
        message: `Resource name '${name}' must be RFC 1123 compliant (lowercase alphanumeric and hyphens, starting and ending with alphanumeric)`,
      });
    }
  }

  return results;
}

/**
 * CodeMirror autocompletion source for Kubernetes manifests.
 */
export function createK8sCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_:-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toLowerCase();
    const options: any[] = [];

    for (const kind of RECOGNIZED_KINDS) {
      if (kind.toLowerCase().startsWith(norm)) {
        options.push({
          label: `kind: ${kind}`,
          type: 'type',
          detail: 'Kubernetes Kind',
          boost: 3,
        });
      }
    }

    if (norm.startsWith('api') || norm.startsWith('v1')) {
      options.push(
        { label: 'apiVersion: v1', type: 'keyword', detail: 'Core API' },
        { label: 'apiVersion: apps/v1', type: 'keyword', detail: 'Apps API' },
        { label: 'apiVersion: networking.k8s.io/v1', type: 'keyword', detail: 'Networking API' }
      );
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
