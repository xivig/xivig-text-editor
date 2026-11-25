import { describe, it, expect } from 'vitest';
import {
  detectJdkInstallations,
  parseJavaSourceSymbols,
  createJavaCompletionSource,
  parseSpringProperties,
  buildSpringBootRunCommand,
  createSpringBootCompletionSource,
  parsePomXml,
  buildMavenCliCommand,
  createMavenCompletionSource,
  buildJdwpArgument,
  buildJavaLaunchConfig,
  isValidJavaBreakpointLine,
} from '../extensions/builtin/java';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Category 12: Java Development Extensions', () => {
  describe('Java Core & Environment Discovery', () => {
    it('detects JDK installations from JAVA_HOME and candidate paths with vendor resolution', () => {
      const candidates = [
        'C:/Program Files/Eclipse Adoptium/jdk-21.0.2.13-hotspot',
        'C:/Program Files/Amazon Corretto/jdk17.0.9_8',
        '/usr/lib/jvm/zulu-17-amd64',
      ];
      const envVars = { JAVA_HOME: 'C:/Program Files/Eclipse Adoptium/jdk-21.0.2.13-hotspot' };

      const jdks = detectJdkInstallations(candidates, envVars);
      expect(jdks).toHaveLength(3);

      expect(jdks[0].isDefault).toBe(true);
      expect(jdks[1].vendor).toBe('Amazon Corretto');
      expect(jdks[2].vendor).toBe('Azul Zulu');
    });

    it('extracts package, class, record, and method symbols with modifiers', () => {
      const javaSource = `
package com.xivig.editor.demo;

import java.util.List;

public class DocumentService {
    private String title;

    public void saveDocument(String path) {
        System.out.println("Saving to " + path);
    }
}

public record UserDto(String id, String name) {}
      `;

      const parsed = parseJavaSourceSymbols(javaSource);
      expect(parsed.package).toBe('com.xivig.editor.demo');
      expect(parsed.symbols).toHaveLength(3);

      const cls = parsed.symbols.find((s) => s.kind === 'class');
      expect(cls?.name).toBe('DocumentService');
      expect(cls?.modifiers).toContain('public');

      const method = parsed.symbols.find((s) => s.kind === 'method');
      expect(method?.name).toBe('saveDocument');

      const rec = parsed.symbols.find((s) => s.kind === 'record');
      expect(rec?.name).toBe('UserDto');
    });

    it('provides CodeMirror completion for Java keywords and standard types', () => {
      const state = EditorState.create({ doc: 'pub' });
      const context = new CompletionContext(state, 3, true);
      const source = createJavaCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('public');
    });
  });

  describe('Spring Boot Development', () => {
    it('parses application.properties ignoring comments and extracting key-value pairs', () => {
      const props = `
# Server configuration
server.port = 8080
server.servlet.context-path = /api/v1

! Database configuration
spring.datasource.url = jdbc:postgresql://localhost:5432/mydb
spring.profiles.active = staging
      `;

      const items = parseSpringProperties(props);
      expect(items).toHaveLength(4);

      expect(items[0]).toEqual({ key: 'server.port', value: '8080', line: 3 });
      expect(items[1]).toEqual({ key: 'server.servlet.context-path', value: '/api/v1', line: 4 });
      expect(items[2]).toEqual({ key: 'spring.datasource.url', value: 'jdbc:postgresql://localhost:5432/mydb', line: 7 });
      expect(items[3]).toEqual({ key: 'spring.profiles.active', value: 'staging', line: 8 });
    });

    it('builds Spring Boot run command for Maven and Gradle with active profiles', () => {
      const mvnCmd = buildSpringBootRunCommand('maven', ['dev', 'debug']);
      expect(mvnCmd).toBe('mvn spring-boot:run -Dspring-boot.run.profiles=dev,debug');

      const gradleCmd = buildSpringBootRunCommand('gradle', ['prod']);
      expect(gradleCmd).toBe("./gradlew bootRun --args='--spring.profiles.active=prod'");
    });

    it('provides CodeMirror completion for Spring Boot annotations and properties', () => {
      const stateAnn = EditorState.create({ doc: '@Rest' });
      const contextAnn = new CompletionContext(stateAnn, 5, true);
      const source = createSpringBootCompletionSource();
      const resAnn = source(contextAnn);

      expect(resAnn).not.toBeNull();
      const annLabels = resAnn!.options.map((o) => o.label);
      expect(annLabels).toContain('@RestController');

      const stateProp = EditorState.create({ doc: 'server.p' });
      const contextProp = new CompletionContext(stateProp, 8, true);
      const resProp = source(contextProp);

      expect(resProp).not.toBeNull();
      const propLabels = resProp!.options.map((o) => o.label);
      expect(propLabels).toContain('server.port=8080');
    });
  });

  describe('Maven for Java (pom.xml)', () => {
    const samplePom = `
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <groupId>com.xivig.app</groupId>
  <artifactId>xivig-core</artifactId>
  <version>1.5.0</version>
  <name>Xivig Core Service</name>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
      <version>3.2.0</version>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter-api</artifactId>
      <version>5.10.0</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
    `;

    it('parses pom.xml and extracts project coordinates and dependencies', () => {
      const project = parsePomXml(samplePom);
      expect(project).not.toBeNull();
      expect(project?.groupId).toBe('com.xivig.app');
      expect(project?.artifactId).toBe('xivig-core');
      expect(project?.version).toBe('1.5.0');
      expect(project?.dependencies).toHaveLength(2);

      expect(project?.dependencies[0].artifactId).toBe('spring-boot-starter-web');
      expect(project?.dependencies[1].scope).toBe('test');
    });

    it('builds Maven CLI commands with offline, debug, and profile arguments', () => {
      const cmd = buildMavenCliCommand(['clean', 'package'], {
        offline: true,
        debug: true,
        profile: 'production',
      });
      expect(cmd).toBe('mvn -o -X -P production clean package');
    });

    it('provides CodeMirror autocompletion for Maven POM tags', () => {
      const state = EditorState.create({ doc: '<depend' });
      const context = new CompletionContext(state, 7, true);
      const source = createMavenCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels.some((l) => l.includes('<dependency>'))).toBe(true);
    });
  });

  describe('Debugger for Java', () => {
    it('constructs standard JDWP debugging parameters', () => {
      const defaultJdwp = buildJdwpArgument();
      expect(defaultJdwp).toBe('-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005');

      const suspendJdwp = buildJdwpArgument(8000, true);
      expect(suspendJdwp).toBe('-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:8000');
    });

    it('builds Java launch configuration object', () => {
      const config = buildJavaLaunchConfig('com.xivig.app.Application', 'xivig-backend', '-Xmx1024m', '--server.port=9090');
      expect(config.name).toBe('Launch Application');
      expect(config.mainClass).toBe('com.xivig.app.Application');
      expect(config.vmArgs).toBe('-Xmx1024m');
      expect(config.args).toBe('--server.port=9090');
    });

    it('validates breakpoint line eligibility', () => {
      expect(isValidJavaBreakpointLine('')).toBe(false);
      expect(isValidJavaBreakpointLine('// comment line')).toBe(false);
      expect(isValidJavaBreakpointLine('package com.example;')).toBe(false);
      expect(isValidJavaBreakpointLine('import java.util.List;')).toBe(false);
      expect(isValidJavaBreakpointLine('@Override')).toBe(false);
      expect(isValidJavaBreakpointLine('{')).toBe(false);
      expect(isValidJavaBreakpointLine('}')).toBe(false);

      expect(isValidJavaBreakpointLine('int count = 42;')).toBe(true);
      expect(isValidJavaBreakpointLine('return result.getItems();')).toBe(true);
    });
  });
});
