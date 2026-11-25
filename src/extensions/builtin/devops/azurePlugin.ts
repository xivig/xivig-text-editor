import { AzureTemplateValidation, AzureResource } from './types';

/**
 * Validates an Azure Resource Manager (ARM) template JSON document.
 */
export function validateAzureArmTemplate(jsonContent: any): AzureTemplateValidation {
  const errors: string[] = [];
  const resources: AzureResource[] = [];

  if (!jsonContent || typeof jsonContent !== 'object') {
    return {
      valid: false,
      errors: ['ARM template must be a valid JSON object'],
      resources: [],
    };
  }

  // 1. Verify schema
  if (typeof jsonContent.$schema !== 'string' || !jsonContent.$schema.includes('schema.management.azure.com')) {
    errors.push('Missing or invalid Azure Resource Manager "$schema" declaration');
  }

  // 2. Verify contentVersion
  if (typeof jsonContent.contentVersion !== 'string') {
    errors.push('Missing required "contentVersion" in ARM template');
  }

  // 3. Inspect resources
  if (jsonContent.resources) {
    if (!Array.isArray(jsonContent.resources)) {
      errors.push('"resources" must be an array');
    } else {
      for (let i = 0; i < jsonContent.resources.length; i++) {
        const res = jsonContent.resources[i];
        if (!res || typeof res !== 'object') continue;

        if (!res.type) errors.push(`Resource at index ${i} is missing "type"`);
        if (!res.name) errors.push(`Resource at index ${i} is missing "name"`);
        if (!res.apiVersion) errors.push(`Resource '${res.name || i}' is missing "apiVersion"`);
        if (!res.location) errors.push(`Resource '${res.name || i}' is missing "location"`);

        if (res.type && res.name && res.apiVersion && res.location) {
          resources.push({
            type: res.type,
            name: res.name,
            apiVersion: res.apiVersion,
            location: res.location,
            properties: res.properties,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    resources,
  };
}

/**
 * Generates an Azure CLI command for template deployment.
 */
export function buildAzureDeploymentCli(
  resourceGroup: string,
  templateFile: string,
  mode: 'Incremental' | 'Complete' = 'Incremental'
): string {
  return `az deployment group create --resource-group "${resourceGroup}" --template-file "${templateFile}" --mode ${mode}`;
}
