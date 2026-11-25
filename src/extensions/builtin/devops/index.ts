import { BuiltinExtensionModule } from '../../api/types';

export * from './types';
export * from './dockerPlugin';
export * from './kubernetesPlugin';
export * from './devContainersPlugin';
export * from './yamlPlugin';
export * from './terraformPlugin';
export * from './azurePlugin';

// 1. Docker
export const dockerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.docker',
    name: 'Docker',
    publisher: 'Microsoft',
    version: '1.29.1',
    description: 'Build, manage, and deploy containerized applications with Dockerfile linting and multi-stage awareness.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#2496ed',
    iconSymbol: '🐳',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Kubernetes
export const kubernetesExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.kubernetes',
    name: 'Kubernetes',
    publisher: 'Microsoft',
    version: '1.3.16',
    description: 'Develop, deploy and debug Kubernetes applications with manifest validation and RFC 1123 naming checks.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#326ce5',
    iconSymbol: '☸️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Dev Containers
export const devContainersExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.dev-containers',
    name: 'Dev Containers',
    publisher: 'Microsoft',
    version: '0.388.0',
    description: 'Open any folder or repository inside a Docker container with devcontainer.json configuration validation.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#007acc',
    iconSymbol: '📦',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. YAML
export const yamlExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.yaml',
    name: 'YAML',
    publisher: 'Red Hat',
    version: '1.15.0',
    description: 'Comprehensive YAML language support with indentation checking, tab prohibition, and schema validation.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#cb171e',
    iconSymbol: '📄',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. Terraform
export const terraformExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.terraform',
    name: 'HashiCorp Terraform',
    publisher: 'HashiCorp',
    version: '2.32.0',
    description: 'Terraform and HCL intelligence, block parser, duplicate resource detector, and completions.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#7b42bc',
    iconSymbol: '🏗️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 6. Azure Tools
export const azureToolsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.azure-tools',
    name: 'Azure Tools',
    publisher: 'Microsoft',
    version: '1.4.0',
    description: 'Develop and deploy Azure Resource Manager templates, Bicep, and App Services directly from Xivig.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0089d6',
    iconSymbol: '☁️',
  },
  activate: () => {},
  deactivate: () => {},
};
