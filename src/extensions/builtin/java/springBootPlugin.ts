import { SpringPropertyItem, SpringBootSettings } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_SPRING_BOOT_SETTINGS: SpringBootSettings = {
  enabled: true,
  liveProcessInspection: true,
};

export const SPRING_BOOT_ANNOTATIONS = [
  '@SpringBootApplication',
  '@RestController',
  '@Controller',
  '@Service',
  '@Repository',
  '@Component',
  '@Configuration',
  '@Bean',
  '@Autowired',
  '@Value("${...}")',
  '@GetMapping',
  '@PostMapping',
  '@PutMapping',
  '@DeleteMapping',
  '@PatchMapping',
  '@RequestParam',
  '@PathVariable',
  '@RequestBody',
  '@ResponseBody',
  '@Transactional',
  '@CrossOrigin',
  '@Qualifier',
  '@Scheduled',
  '@Async',
];

export const SPRING_BOOT_PROPERTIES = [
  'server.port=8080',
  'server.servlet.context-path=/api',
  'spring.application.name=my-app',
  'spring.profiles.active=dev',
  'spring.datasource.url=jdbc:mysql://localhost:3306/db',
  'spring.datasource.username=root',
  'spring.datasource.password=secret',
  'spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver',
  'spring.jpa.hibernate.ddl-auto=update',
  'spring.jpa.show-sql=true',
  'spring.jpa.properties.hibernate.format_sql=true',
  'logging.level.org.springframework=INFO',
  'logging.level.root=WARN',
  'management.endpoints.web.exposure.include=health,info,metrics',
];

/**
 * Parses application.properties lines into structured key-value property items.
 */
export function parseSpringProperties(content: string): SpringPropertyItem[] {
  if (!content || !content.trim()) return [];

  const items: SpringPropertyItem[] = [];
  const lines = content.split(/\r?\n/);

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineNum = idx + 1;

    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }

    const sepIdx = trimmed.search(/[:=]/);
    if (sepIdx !== -1) {
      const key = trimmed.slice(0, sepIdx).trim();
      const val = trimmed.slice(sepIdx + 1).trim();
      items.push({
        key,
        value: val,
        line: lineNum,
      });
    }
  }

  return items;
}

/**
 * Builds Spring Boot executable runner command.
 */
export function buildSpringBootRunCommand(
  tool: 'maven' | 'gradle' = 'maven',
  profiles?: string[]
): string {
  if (tool === 'gradle') {
    const profileArg = profiles && profiles.length > 0
      ? ` --args='--spring.profiles.active=${profiles.join(',')}'`
      : '';
    return `./gradlew bootRun${profileArg}`;
  }

  const profileFlag = profiles && profiles.length > 0
    ? ` -Dspring-boot.run.profiles=${profiles.join(',')}`
    : '';
  return `mvn spring-boot:run${profileFlag}`;
}

/**
 * CodeMirror autocompletion source for Spring Boot annotations and application properties.
 */
export function createSpringBootCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[@a-zA-Z0-9_.-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const text = word.text;
    const options: any[] = [];

    if (text.startsWith('@')) {
      for (const ann of SPRING_BOOT_ANNOTATIONS) {
        if (ann.toLowerCase().startsWith(text.toLowerCase())) {
          options.push({
            label: ann,
            type: 'keyword',
            detail: 'Spring Boot Annotation',
            boost: 4,
          });
        }
      }
    } else {
      for (const prop of SPRING_BOOT_PROPERTIES) {
        if (prop.toLowerCase().startsWith(text.toLowerCase())) {
          options.push({
            label: prop,
            type: 'property',
            detail: 'Spring Boot Config',
            boost: 2,
          });
        }
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
