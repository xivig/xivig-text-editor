import { Diagnostic, linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { SpellCheckerSettings } from './types';

export const DEFAULT_SPELLCHECKER_SETTINGS: SpellCheckerSettings = {
  enabled: true,
  checkStrings: true,
  checkComments: true,
  checkIdentifiers: true,
  minWordLength: 4,
  ignoredWords: ['xivig', 'codemirror', 'zustand', 'vite', 'rgba', 'hsla', 'calc', 'flex', 'async', 'await', 'impl', 'fn', 'struct', 'trait'],
};

// Common programming and English words dictionary
const COMMON_DICTIONARY = new Set([
  'about', 'above', 'accept', 'access', 'accord', 'account', 'action', 'active', 'actual', 'add',
  'address', 'admin', 'after', 'again', 'against', 'agent', 'agree', 'alert', 'align', 'allow',
  'along', 'alpha', 'already', 'alter', 'always', 'amount', 'anchor', 'angle', 'animate', 'answer',
  'append', 'apply', 'area', 'args', 'array', 'arrow', 'article', 'asset', 'assign', 'assume',
  'async', 'attach', 'attr', 'author', 'auto', 'avoid', 'await', 'back', 'badge', 'base',
  'basic', 'batch', 'before', 'begin', 'behind', 'below', 'bench', 'beta', 'between', 'binary',
  'bind', 'blade', 'block', 'board', 'body', 'bool', 'boolean', 'border', 'bottom', 'bound',
  'box', 'branch', 'break', 'bridge', 'brief', 'broadcast', 'browse', 'browser', 'buffer', 'bug',
  'build', 'builder', 'bundle', 'button', 'byte', 'cache', 'calc', 'call', 'caller', 'cancel',
  'canvas', 'card', 'case', 'catch', 'cause', 'center', 'chain', 'change', 'channel', 'char',
  'check', 'child', 'class', 'clean', 'clear', 'click', 'client', 'clone', 'close', 'cluster',
  'code', 'col', 'collapse', 'collect', 'color', 'column', 'command', 'comment', 'commit', 'common',
  'compare', 'compat', 'compile', 'complete', 'component', 'compute', 'condition', 'config', 'confirm',
  'connect', 'console', 'constant', 'construct', 'container', 'content', 'context', 'continue',
  'control', 'convert', 'copy', 'core', 'count', 'create', 'current', 'cursor', 'custom', 'cycle',
  'data', 'database', 'date', 'debug', 'decimal', 'declare', 'decode', 'decrease', 'dedupe',
  'default', 'define', 'delay', 'delete', 'delta', 'demo', 'depend', 'depth', 'desc', 'describe',
  'design', 'destroy', 'detail', 'detect', 'device', 'diff', 'dimension', 'dir', 'direct',
  'directory', 'disable', 'discard', 'dispatch', 'display', 'dispose', 'distinct', 'distribute',
  'divide', 'doc', 'docker', 'document', 'domain', 'done', 'double', 'down', 'download', 'drag',
  'draw', 'drawer', 'drop', 'duplicate', 'dynamic', 'each', 'early', 'echo', 'edge', 'edit',
  'editor', 'effect', 'element', 'else', 'email', 'emit', 'empty', 'enable', 'encode', 'end',
  'engine', 'ensure', 'enter', 'entity', 'entry', 'enum', 'env', 'equal', 'error', 'escape',
  'eval', 'event', 'exact', 'except', 'exec', 'execute', 'exist', 'exit', 'expand', 'expect',
  'export', 'extend', 'extract', 'fail', 'fallback', 'false', 'fatal', 'fetch', 'field', 'file',
  'fill', 'filter', 'final', 'find', 'finish', 'first', 'fix', 'flag', 'flash', 'float', 'flow',
  'focus', 'folder', 'font', 'force', 'foreach', 'foreign', 'form', 'format', 'forward', 'frame',
  'free', 'from', 'front', 'full', 'function', 'future', 'gap', 'gear', 'general', 'generate',
  'generator', 'generic', 'getter', 'glob', 'global', 'goto', 'gradient', 'graph', 'graphic',
  'grid', 'group', 'guard', 'guest', 'guide', 'gutter', 'handle', 'handler', 'hash', 'header',
  'heading', 'height', 'help', 'helper', 'hidden', 'hide', 'high', 'highlight', 'hint', 'history',
  'hook', 'host', 'hover', 'html', 'icon', 'identify', 'idle', 'ignore', 'image', 'implement',
  'import', 'increase', 'indent', 'index', 'info', 'inherit', 'initial', 'init', 'inline', 'input',
  'insert', 'inspect', 'install', 'instance', 'int', 'integer', 'interface', 'internal', 'interval',
  'into', 'invalid', 'invoke', 'item', 'iter', 'iterate', 'join', 'json', 'jump', 'keep', 'key',
  'keyboard', 'keyframe', 'kill', 'label', 'lang', 'language', 'large', 'last', 'launch', 'layout',
  'lazy', 'lead', 'leave', 'left', 'length', 'level', 'license', 'light', 'limit', 'line', 'link',
  'lint', 'linter', 'list', 'listen', 'listener', 'literal', 'live', 'load', 'loader', 'local',
  'location', 'lock', 'log', 'loop', 'macro', 'main', 'major', 'manage', 'manager', 'manifest',
  'map', 'margin', 'markdown', 'marker', 'marquee', 'match', 'matcher', 'matrix', 'max', 'media',
  'member', 'memo', 'memory', 'menu', 'menubar', 'merge', 'message', 'meta', 'metadata', 'method',
  'metric', 'middle', 'migrate', 'migration', 'min', 'minimap', 'minify', 'minus', 'mode', 'model',
  'modifier', 'modify', 'module', 'monitor', 'month', 'mount', 'mouse', 'move', 'multi', 'name',
  'namespace', 'native', 'navigate', 'near', 'nest', 'network', 'new', 'next', 'node', 'none',
  'normal', 'normalize', 'not', 'note', 'notify', 'null', 'number', 'numeric', 'object', 'obtain',
  'occur', 'offset', 'omit', 'once', 'online', 'only', 'open', 'operate', 'operator', 'option',
  'order', 'origin', 'other', 'outer', 'outline', 'output', 'overflow', 'overlay', 'override',
  'package', 'packet', 'page', 'pair', 'palette', 'panel', 'param', 'parameter', 'parent', 'parse',
  'parser', 'part', 'partial', 'pass', 'paste', 'patch', 'path', 'pattern', 'pause', 'payload',
  'peek', 'peer', 'pending', 'percent', 'perform', 'permission', 'persist', 'phase', 'pick',
  'picker', 'pipe', 'pipeline', 'pixel', 'placeholder', 'plain', 'platform', 'play', 'playback',
  'plugin', 'point', 'pointer', 'poll', 'polyline', 'pop', 'port', 'portable', 'position',
  'post', 'precision', 'prefer', 'prefix', 'preload', 'prepare', 'prepend', 'preset', 'prevent',
  'preview', 'previous', 'primary', 'print', 'priority', 'private', 'process', 'produce', 'product',
  'profile', 'progress', 'project', 'prompt', 'prop', 'property', 'protect', 'protocol', 'provider',
  'public', 'publish', 'publisher', 'pull', 'pure', 'purge', 'push', 'query', 'queue', 'quick',
  'quote', 'radial', 'radius', 'rainbow', 'random', 'range', 'raw', 'react', 'reactive', 'read',
  'readme', 'readonly', 'real', 'realpath', 'receive', 'recent', 'record', 'recover', 'rect',
  'recursive', 'redo', 'reduce', 'ref', 'reference', 'refactor', 'reflect', 'regex', 'regexp',
  'register', 'registry', 'regular', 'reject', 'relative', 'release', 'reload', 'remote', 'remove',
  'rename', 'render', 'renderer', 'repeat', 'replace', 'replacement', 'reply', 'report', 'request',
  'require', 'reset', 'resize', 'resolve', 'resource', 'respect', 'response', 'restart', 'restore',
  'restrict', 'result', 'resume', 'retain', 'return', 'reveal', 'revert', 'review', 'revoke',
  'right', 'root', 'roster', 'rotate', 'round', 'route', 'router', 'rule', 'runner', 'run',
  'safe', 'same', 'sandbox', 'sanitize', 'save', 'saved', 'scale', 'scan', 'scanner', 'schema',
  'scope', 'scoped', 'scratch', 'screen', 'screenshot', 'script', 'scroll', 'search', 'second',
  'section', 'secure', 'security', 'select', 'selection', 'self', 'semantic', 'send', 'sender',
  'separate', 'sequence', 'serial', 'serialize', 'series', 'server', 'service', 'session', 'set',
  'setting', 'settle', 'setup', 'severity', 'shadow', 'shape', 'shard', 'share', 'sheet', 'shell',
  'shift', 'shortcut', 'shorten', 'show', 'sibling', 'side', 'sidebar', 'sign', 'signal', 'signature',
  'simple', 'simulate', 'single', 'size', 'skip', 'slice', 'slider', 'slot', 'small', 'smart',
  'smooth', 'snapshot', 'snippet', 'solid', 'solve', 'sort', 'sorted', 'sound', 'source', 'space',
  'span', 'spawn', 'special', 'specific', 'specificity', 'spell', 'split', 'stack', 'stage',
  'standard', 'start', 'state', 'static', 'status', 'statusbar', 'step', 'stop', 'storage', 'store',
  'strategy', 'stream', 'strict', 'string', 'strip', 'stroke', 'strong', 'struct', 'structure',
  'studio', 'style', 'sub', 'subagent', 'subject', 'subscribe', 'subscriber', 'subscription',
  'substitute', 'success', 'suffix', 'summary', 'support', 'surface', 'switch', 'symbol', 'sync',
  'syntax', 'system', 'tab', 'table', 'tag', 'target', 'task', 'template', 'temporary', 'term',
  'terminal', 'terminate', 'test', 'text', 'theme', 'throttle', 'thumb', 'tile', 'time', 'timeout',
  'timer', 'timestamp', 'title', 'titlebar', 'toggle', 'token', 'tool', 'toolbar', 'toolbox',
  'tooltip', 'top', 'topic', 'trace', 'track', 'tracker', 'trailing', 'trait', 'transaction',
  'transform', 'transition', 'translate', 'transparent', 'tree', 'trigger', 'trim', 'true',
  'type', 'typecheck', 'typescript', 'undo', 'unfold', 'unified', 'uninstall', 'union', 'unique',
  'unit', 'universal', 'unmount', 'unnamed', 'unpin', 'unquoted', 'unset', 'unsigned', 'untrack',
  'unwrap', 'update', 'upgrade', 'upload', 'upstream', 'uri', 'url', 'usage', 'use', 'user',
  'utility', 'valid', 'validate', 'validation', 'validator', 'value', 'var', 'variable', 'variant',
  'vector', 'vendor', 'verbose', 'verify', 'version', 'vertical', 'view', 'viewport', 'virtual',
  'visible', 'visual', 'wait', 'walker', 'warn', 'warning', 'watch', 'watcher', 'waveform',
  'web', 'webhook', 'weight', 'welcome', 'wheel', 'while', 'whitelist', 'white', 'widget', 'width',
  'window', 'wipe', 'word', 'workbench', 'worker', 'workflow', 'worktree', 'workspace', 'wrap',
  'wrapper', 'write', 'writer', 'year', 'yield', 'zero', 'zone', 'zoom'
]);

function splitCodeWord(token: string): string[] {
  // Split on underscores, dashes, dots, and camelCase boundaries
  return token
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function checkSpellingInCode(
  code: string,
  settings: SpellCheckerSettings = DEFAULT_SPELLCHECKER_SETTINGS
): Diagnostic[] {
  if (!settings.enabled) return [];

  const ignored = new Set([...settings.ignoredWords.map((w) => w.toLowerCase())]);
  const diagnostics: Diagnostic[] = [];

  // Match words inside strings or identifiers
  const wordRegex = /\b[a-zA-Z]{4,}\b/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(code)) !== null) {
    const rawWord = match[0];
    const subWords = splitCodeWord(rawWord);

    for (const sub of subWords) {
      if (sub.length < settings.minWordLength) continue;
      if (ignored.has(sub)) continue;

      if (!COMMON_DICTIONARY.has(sub)) {
        // Look for close matches
        const subIndex = rawWord.toLowerCase().indexOf(sub);
        const from = match.index + (subIndex !== -1 ? subIndex : 0);
        const to = from + sub.length;

        diagnostics.push({
          from,
          to,
          severity: 'info',
          source: 'cSpell',
          message: `Unknown word "${sub}".`,
          actions: [
            {
              name: `Add "${sub}" to dictionary`,
              apply() {
                COMMON_DICTIONARY.add(sub);
              },
            },
          ],
        });
      }
    }
  }

  return diagnostics;
}

export function createSpellCheckerPlugin(settings: SpellCheckerSettings = DEFAULT_SPELLCHECKER_SETTINGS) {
  return linter((view: EditorView) => {
    return checkSpellingInCode(view.state.doc.toString(), settings);
  });
}
