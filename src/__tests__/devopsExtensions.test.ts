import { describe, it, expect } from 'vitest';
import {
  parseDockerfile,
  lintDockerfile,
  buildDockerRunCommand,
  createDockerfileCompletionSource,
  parseK8sManifest,
  lintK8sManifest,
  createK8sCompletionSource,
  stripJsonComments,
  parseDevContainerConfig,
  validateDevContainerConfig,
  validateYamlIndentation,
  createYamlCompletionSource,
  parseTerraformBlocks,
  lintTerraformBlocks,
  createTerraformCompletionSource,
  validateAzureArmTemplate,
  buildAzureDeploymentCli,
} from '../extensions/builtin/devops';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Category 10: Docker & DevOps Extensions', () => {
  describe('Docker & Dockerfile', () => {
    it('parses Dockerfile instructions and identifies multi-stage builds', () => {
      const dockerfile = `
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci \\
    && npm run build

# Production stage
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
      `;

      const instructions = parseDockerfile(dockerfile);
      expect(instructions.length).toBeGreaterThanOrEqual(7);

      expect(instructions[0].instruction).toBe('FROM');
      expect(instructions[0].stageName).toBe('builder');

      const runInst = instructions.find((i) => i.instruction === 'RUN');
      expect(runInst?.args).toContain('npm ci && npm run build');

      const secondFrom = instructions.filter((i) => i.instruction === 'FROM')[1];
      expect(secondFrom.stageName).toBeUndefined();
    });

    it('lints Dockerfile for security issues, latest base images, and duplicate CMDs', () => {
      const badDockerfile = `
FROM ubuntu:latest
RUN sudo apt-get update
EXPOSE 99999
CMD ["node", "server.js"]
CMD ["npm", "start"]
      `;

      const errors = lintDockerfile(badDockerfile);
      const messages = errors.map((e) => e.message);

      expect(messages.some((m) => m.includes("':latest'"))).toBe(true);
      expect(messages.some((m) => m.includes('Avoid using "sudo"'))).toBe(true);
      expect(messages.some((m) => m.includes("Invalid port number '99999'"))).toBe(true);
      expect(messages.some((m) => m.includes('Multiple CMD instructions found'))).toBe(true);
    });

    it('builds reproducible docker run CLI command with port forwarding and environment variables', () => {
      const cmd = buildDockerRunCommand('xivig/app:1.5.0', {
        name: 'xivig-backend',
        ports: ['8080:8080'],
        env: { NODE_ENV: 'production' },
        detached: true,
      });

      expect(cmd).toBe('docker run -d --rm --name xivig-backend -p 8080:8080 -e NODE_ENV="production" xivig/app:1.5.0');
    });

    it('provides CodeMirror completion for Dockerfile instructions', () => {
      const state = EditorState.create({ doc: 'FR' });
      const context = new CompletionContext(state, 2, true);
      const source = createDockerfileCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('FROM ');
    });
  });

  describe('Kubernetes Manifests', () => {
    it('parses multi-document Kubernetes YAML manifests', () => {
      const multiDoc = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  ports:
    - port: 80
      `;

      const manifests = parseK8sManifest(multiDoc);
      expect(manifests).toHaveLength(2);

      expect(manifests[0].kind).toBe('Deployment');
      expect(manifests[0].metadata.name).toBe('web-app');
      expect(manifests[0].metadata.namespace).toBe('production');
      expect(manifests[0].metadata.labels?.['app']).toBe('web');

      expect(manifests[1].kind).toBe('Service');
      expect(manifests[1].metadata.name).toBe('web-service');
    });

    it('enforces RFC 1123 DNS name rules and flags missing apiVersion or kind', () => {
      const invalidManifest = {
        apiVersion: '',
        kind: 'Deployment',
        metadata: {
          name: 'Invalid_Uppercase_Name',
        },
      };

      const lintResults = lintK8sManifest(invalidManifest);
      const messages = lintResults.map((r) => r.message);

      expect(messages.some((m) => m.includes('Missing "apiVersion"'))).toBe(true);
      expect(messages.some((m) => m.includes('must be RFC 1123 compliant'))).toBe(true);
    });

    it('provides CodeMirror autocompletion for Kubernetes kinds and apiVersions', () => {
      const state = EditorState.create({ doc: 'Dep' });
      const context = new CompletionContext(state, 3, true);
      const source = createK8sCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('kind: Deployment');
    });
  });

  describe('Dev Containers (devcontainer.json)', () => {
    it('strips line and block comments from JSONC configurations', () => {
      const jsonc = `
// Dev container specification
{
  /* Multi-line
     comment */
  "name": "Node Dev Environment",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "forwardPorts": [3000, 8080],
}
      `;

      const stripped = stripJsonComments(jsonc);
      expect(stripped).not.toContain('// Dev container');
      expect(stripped).not.toContain('/* Multi-line');

      const config = parseDevContainerConfig(jsonc);
      expect(config).not.toBeNull();
      expect(config?.name).toBe('Node Dev Environment');
      expect(config?.forwardPorts).toEqual([3000, 8080]);
    });

    it('validates container source and port number boundaries', () => {
      const invalid = {
        name: 'Empty Container',
        forwardPorts: [99999],
      };

      const val = validateDevContainerConfig(invalid);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes('must specify either "image"'))).toBe(true);
      expect(val.errors.some((e) => e.includes("Invalid port number '99999'"))).toBe(true);
    });
  });

  describe('YAML Validation & Intelligence', () => {
    it('prohibits tab characters strictly per YAML standard', () => {
      const yamlWithTab = 'server:\n\tport: 8080';
      const result = validateYamlIndentation(yamlWithTab);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Tabs are strictly forbidden');
    });

    it('detects missing space after colon delimiters', () => {
      const badColon = 'database:mysql\nhost: localhost';
      const result = validateYamlIndentation(badColon);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Missing space after colon');
    });

    it('provides CodeMirror autocompletion for YAML boolean and null literals', () => {
      const state = EditorState.create({ doc: 'tr' });
      const context = new CompletionContext(state, 2, true);
      const source = createYamlCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('true');
    });
  });

  describe('HashiCorp Terraform / HCL', () => {
    it('parses Terraform resources, providers, variables, and outputs', () => {
      const tfCode = `
terraform {
  required_version = ">= 1.5.0"
}

provider "aws" {
  region = "us-west-2"
}

resource "aws_s3_bucket" "app_storage" {
  bucket = "xivig-app-storage"
}

variable "environment" {
  type    = string
  default = "production"
}
      `;

      const blocks = parseTerraformBlocks(tfCode);
      expect(blocks).toHaveLength(4);

      expect(blocks[0].type).toBe('terraform');
      expect(blocks[1].type).toBe('provider');
      expect(blocks[1].labels).toContain('aws');
      expect(blocks[2].type).toBe('resource');
      expect(blocks[2].labels).toEqual(['aws_s3_bucket', 'app_storage']);
    });

    it('detects duplicate resource declarations and missing labels', () => {
      const duplicateTf = `
resource "aws_s3_bucket" "bucket" {
  bucket = "first"
}
resource "aws_s3_bucket" "bucket" {
  bucket = "second"
}
resource "aws_instance" {
  ami = "ami-123"
}
      `;

      const blocks = parseTerraformBlocks(duplicateTf);
      const lintResults = lintTerraformBlocks(blocks);
      const messages = lintResults.map((r) => r.message);

      expect(messages.some((m) => m.includes("Duplicate resource declaration 'aws_s3_bucket.bucket'"))).toBe(true);
      expect(messages.some((m) => m.includes('Resource block must declare both a type and a local name'))).toBe(true);
    });

    it('provides CodeMirror completion for Terraform keywords and providers', () => {
      const state = EditorState.create({ doc: 'res' });
      const context = new CompletionContext(state, 3, true);
      const source = createTerraformCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('resource ');
    });
  });

  describe('Azure Tools & ARM Templates', () => {
    it('validates ARM template schema and extracts declared resources', () => {
      const armTemplate = {
        $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
        contentVersion: '1.0.0.0',
        resources: [
          {
            type: 'Microsoft.Web/sites',
            name: 'xivig-editor-app',
            apiVersion: '2022-03-01',
            location: 'East US',
          },
        ],
      };

      const val = validateAzureArmTemplate(armTemplate);
      expect(val.valid).toBe(true);
      expect(val.resources).toHaveLength(1);
      expect(val.resources[0].type).toBe('Microsoft.Web/sites');
      expect(val.resources[0].name).toBe('xivig-editor-app');
    });

    it('flags missing $schema, contentVersion, and required resource fields', () => {
      const broken = {
        contentVersion: '1.0',
        resources: [
          { type: 'Microsoft.Storage/storageAccounts' },
        ],
      };

      const val = validateAzureArmTemplate(broken);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes('Missing or invalid Azure Resource Manager "$schema"'))).toBe(true);
      expect(val.errors.some((e) => e.includes('missing "name"'))).toBe(true);
    });

    it('builds Azure CLI deployment command', () => {
      const cli = buildAzureDeploymentCli('rg-production', 'azuredeploy.json');
      expect(cli).toBe('az deployment group create --resource-group "rg-production" --template-file "azuredeploy.json" --mode Incremental');
    });
  });
});
