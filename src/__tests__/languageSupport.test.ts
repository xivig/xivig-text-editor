import { describe, it, expect, beforeEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { syntaxTree, indentRange } from '@codemirror/language';
import { getLanguageExtension, detectLanguageName } from '../components/editor/languageSupport';
import {
  autoIndentAndFormatEditor,
  beautifyCode,
  detectFormatterLanguage,
  repairPhpCode,
  repairBrokenMarkup,
  repairCss,
} from '../utils/beautify';
import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';

describe('Language Support and Syntax Highlighting', () => {
  it('detects language names correctly for various file types and language ids', () => {
    expect(detectLanguageName('App.java')).toBe('Java');
    expect(detectLanguageName('main.c')).toBe('C');
    expect(detectLanguageName('main.cpp')).toBe('C++');
    expect(detectLanguageName('Program.cs')).toBe('C#');
    expect(detectLanguageName('script.py')).toBe('Python');
    expect(detectLanguageName('query.sql')).toBe('SQL');
    expect(detectLanguageName('config.yaml')).toBe('YAML');
    expect(detectLanguageName('service.go')).toBe('Go');
    expect(detectLanguageName('index.php')).toBe('PHP');
    expect(detectLanguageName('deploy.sh')).toBe('Shell Script');
    expect(detectLanguageName('index.html')).toBe('HTML');
    expect(detectLanguageName('style.css')).toBe('CSS');
    expect(detectLanguageName('index.js')).toBe('JavaScript');
    expect(detectLanguageName('index.ts')).toBe('TypeScript');
    expect(detectLanguageName('ContentView.swift')).toBe('Swift');
    expect(detectLanguageName('Main.kt')).toBe('Kotlin');
    expect(detectLanguageName('build.gradle.kts')).toBe('Kotlin');
    expect(detectLanguageName('deploy.bat')).toBe('Batch Script');
    expect(detectLanguageName('run.cmd')).toBe('Batch Script');
    expect(detectLanguageName('notes.txt')).toBe('Plain Text');
    expect(detectLanguageName('home.blade.php')).toBe('Blade');
    expect(detectLanguageName('welcome.blade')).toBe('Blade');
  });

  it('provides active CodeMirror language extension for Java and builds syntax tree', () => {
    const javaExt = getLanguageExtension('java', 'App.java');
    expect(javaExt).toBeDefined();

    const state = EditorState.create({
      doc: 'package com.example;\n\npublic class App {\n  public static void main(String[] args) {\n    System.out.println("Hello Java");\n  }\n}',
      extensions: [javaExt],
    });

    expect(state.doc.lines).toBe(7);

    const tree = syntaxTree(state);
    expect(tree).toBeDefined();
    expect(tree.length).toBeGreaterThan(0);
  });

  it('provides active CodeMirror language extension for C and C++', () => {
    const cExt = getLanguageExtension('c', 'main.c');
    expect(cExt).toBeDefined();

    const cppExt = getLanguageExtension('cpp', 'main.cpp');
    expect(cppExt).toBeDefined();

    const state = EditorState.create({
      doc: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello C++" << endl;\n  return 0;\n}',
      extensions: [cppExt],
    });

    expect(state.doc.lines).toBe(7);
    const tree = syntaxTree(state);
    expect(tree).toBeDefined();
  });

  it('provides active CodeMirror language extension for Swift and builds syntax tree', () => {
    const swiftExt = getLanguageExtension('swift', 'App.swift');
    expect(swiftExt).toBeDefined();

    const state = EditorState.create({
      doc: 'import SwiftUI\n\n@main\nstruct MyApp: App {\n  var body: some Scene {\n    WindowGroup {\n      Text("Hello Swift")\n    }\n  }\n}',
      extensions: [swiftExt],
    });

    expect(state.doc.lines).toBe(10);
    const tree = syntaxTree(state);
    expect(tree).toBeDefined();
    expect(tree.length).toBeGreaterThan(0);
  });

  it('provides active CodeMirror language extension for Kotlin and builds syntax tree', () => {
    const kotlinExt = getLanguageExtension('kotlin', 'Main.kt');
    expect(kotlinExt).toBeDefined();

    const state = EditorState.create({
      doc: 'package com.example\n\nfun main(args: Array<String>) {\n  val name = "Kotlin"\n  println("Hello, $name!")\n}',
      extensions: [kotlinExt],
    });

    expect(state.doc.lines).toBe(6);
    const tree = syntaxTree(state);
    expect(tree).toBeDefined();
    expect(tree.length).toBeGreaterThan(0);
  });

  it('provides active CodeMirror language extension for Batch script and builds syntax tree', () => {
    const batExt = getLanguageExtension('bat', 'build.bat');
    expect(batExt).toBeDefined();

    const state = EditorState.create({
      doc: '@echo off\nREM Build Script\nset TARGET_DIR=%~dp0dist\nif not exist "%TARGET_DIR%" (\n  mkdir "%TARGET_DIR%"\n)\necho Done.',
      extensions: [batExt],
    });

    expect(state.doc.lines).toBe(7);
    const tree = syntaxTree(state);
    expect(tree).toBeDefined();
    expect(tree.length).toBeGreaterThan(0);
  });

  it('respects language selection even when filename is generic (e.g. Untitled-1)', () => {
    const ext = getLanguageExtension('java', 'Untitled-1');
    expect(ext).toBeDefined();

    const state = EditorState.create({
      doc: 'public class Test {}',
      extensions: [ext],
    });

    expect(state.doc.lines).toBe(1);
    expect(detectLanguageName('Untitled-1', 'java')).toBe('Java');
  });

  it('supports indentation calculations with indentRange for C-like languages', () => {
    const javaExt = getLanguageExtension('java', 'App.java');
    const state = EditorState.create({
      doc: 'public class App {\npublic static void main() {\nint x = 1;\n}\n}',
      extensions: [javaExt],
    });

    const tx = indentRange(state, 0, state.doc.length);
    expect(tx).toBeDefined();
  });
});

describe('Auto-Indent on Save and Settings', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: {
        fontSize: 14,
        fontFamily: 'monospace',
        lineHeight: 1.6,
        tabSize: 2,
        wordWrap: false,
        lineNumbers: true,
        minimap: true,
        theme: 'xivig-dark',
        autoSave: true,
        fontLigatures: true,
        showWelcomeOnStartup: true,
        autoIndentOnSave: true,
      },
    });

    useEditorStore.setState({
      documents: [
        {
          id: 'doc-java',
          name: 'Main.java',
          content: 'public class Main{\npublic static void main(String[] args){\nSystem.out.println("hello");\n}\n}',
          language: 'java',
          path: '/path/Main.java',
          isDirty: true,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'doc-java',
      secondaryDocumentId: null,
      activePane: 'primary',
    });
  });

  it('verifies autoIndentOnSave defaults to true and can be toggled', () => {
    expect(useSettingsStore.getState().settings.autoIndentOnSave).toBe(true);
    useSettingsStore.getState().updateSettings({ autoIndentOnSave: false });
    expect(useSettingsStore.getState().settings.autoIndentOnSave).toBe(false);
  });

  it('auto-indents and formats Java code according to tabSize', () => {
    let currentDoc = 'public class Main{\npublic static void main(String[] args){\nSystem.out.println("hello");\n}\n}';
    const mockView = {
      state: {
        doc: {
          length: currentDoc.length,
          toString: () => currentDoc,
        },
      },
      dispatch: (action: any) => {
        if (action.changes?.insert) {
          currentDoc = action.changes.insert;
        }
      },
    } as any;

    const formatted = autoIndentAndFormatEditor(mockView, 'Main.java', 'java');
    expect(formatted).toContain('public class Main {');
    expect(formatted).toContain('  public static void main(String[] args) {');
    expect(formatted).toContain('    System.out.println("hello");');
    expect(formatted).toContain('  }');
    expect(formatted).toContain('}');
  });

  it('safely handles Python code without corrupting python block indentation', () => {
    const pythonCode = 'def calculate(x, y):\n    total = x + y\n    if total > 10:\n        return total * 2\n    return total\n';
    const mockView = {
      state: {
        doc: {
          length: pythonCode.length,
          toString: () => pythonCode,
        },
      },
      dispatch: () => {},
    } as any;

    const result = autoIndentAndFormatEditor(mockView, 'script.py', 'python');
    expect(result).toBe(pythonCode);
  });

  it('preserves plain text and markdown without arbitrary mangling', () => {
    const notes = '# My Notes\n\n- Item 1\n  - Subitem 1.1\n    - Subitem 1.1.1\n';
    const mockView = {
      state: {
        doc: {
          length: notes.length,
          toString: () => notes,
        },
      },
      dispatch: () => {},
    } as any;

    const result = autoIndentAndFormatEditor(mockView, 'notes.md', 'markdown');
    expect(result).toBe(notes);
  });

  describe('PHP and Blade Safe Formatting & Restoration', () => {
    it('detects correct formatter languages for PHP, Blade, HTML, CSS, JS, and unknown types', () => {
      expect(detectFormatterLanguage('classListing.php')).toBe('php');
      expect(detectFormatterLanguage('index.php', 'php')).toBe('php');
      expect(detectFormatterLanguage('home.blade.php')).toBe('html');
      expect(detectFormatterLanguage('welcome.blade', 'blade')).toBe('html');
      expect(detectFormatterLanguage('app.js')).toBe('js');
      expect(detectFormatterLanguage('style.css')).toBe('css');
      expect(detectFormatterLanguage('script.py')).toBeNull();
      expect(detectFormatterLanguage('notes.txt')).toBeNull();
    });

    it('formats and repairs PHP files without mangling <?php tags, -> operators, or function signatures', () => {
      const brokenPhp = `< ? php

/**
 * File created by Bandhu
 * Listing all classes.
 */

class ClassListing {
    private $classList;

    // Constructor to initialize classList
    public
    function __construct() {
        $this - > classList = get_declared_classes();
    }

    // Method to list class names
    public
    function listClassNames() {
        if (is_array($this - > classList)) {
            foreach ($this - > classList as $class) {
                echo $class.
                "<br>";
            }
        } else {
            echo "No classes found.<br>";
        }
    }
}`;

      let currentDoc = brokenPhp;
      const mockView = {
        state: {
          doc: {
            length: currentDoc.length,
            toString: () => currentDoc,
          },
        },
        dispatch: (action: any) => {
          if (action.changes?.insert) {
            currentDoc = action.changes.insert;
          }
        },
      } as any;

      const formatted = autoIndentAndFormatEditor(mockView, 'classListing.php', 'php');

      // 1. Tag must be valid <?php and never separated into < ? php
      expect(formatted).toContain('<?php');
      expect(formatted).not.toContain('< ? php');
      expect(formatted).not.toContain('< ?php');

      // 2. Object operator -> must be intact and never $this - >
      expect(formatted).toContain('$this->classList');
      expect(formatted).not.toContain('$this - >');

      // 3. public function must be on the same line
      expect(formatted).toContain('public function __construct()');
      expect(formatted).toContain('public function listClassNames()');
      expect(formatted).not.toMatch(/public\s*\n\s*function/);

      // 4. String concatenation must be preserved
      expect(formatted).toContain('echo $class . "<br>";');
    });

    it('formats and repairs Laravel Blade and HTML markup without mangling tags or styles', () => {
      const brokenBlade = `/*Connector styles on hover*/
.tree li.child: hover + .parent::before,
.tree li.child: hover + .parent.person + ul li::after {
  border - color: red;
} <
/style>

<
div class = "wrapper row0" >
<
div class = "rounded" >
<
p align = "center" > < img src = "../assets/document/course.png" alt = "Univlogo" > < /p> <
p align = "center" >
<
font color = "blue" > < b > Courses offered by the Department
<
/p> < /
div > <
/div> <
div class = "wrapper row3" >`;

      let currentDoc = brokenBlade;
      const mockView = {
        state: {
          doc: {
            length: currentDoc.length,
            toString: () => currentDoc,
          },
        },
        dispatch: (action: any) => {
          if (action.changes?.insert) {
            currentDoc = action.changes.insert;
          }
        },
      } as any;

      const formatted = autoIndentAndFormatEditor(mockView, 'welcome.blade.php', 'blade');

      // 1. Tags must be clean HTML tags, not split into < \n div
      expect(formatted).toContain('<div class="wrapper row0">');
      expect(formatted).toContain('<div class="rounded">');
      expect(formatted).not.toContain('<\ndiv');
      expect(formatted).not.toContain('< \n div');

      // 2. Closing tags must be clean
      expect(formatted).toContain('</style>');
      expect(formatted).toContain('</p>');
      expect(formatted).toContain('</div>');
      expect(formatted).not.toContain('} <\n/style>');
      expect(formatted).not.toContain('< /p>');
      expect(formatted).not.toContain('< /div>');

      // 3. CSS property must not be broken
      expect(formatted).toContain('border-color: red;');
      expect(formatted).not.toContain('border - color');
    });

    it('safely handles Blade directives alongside HTML markup', () => {
      const bladeTemplate = `@extends('layouts.app')

@section('content')
<div class="container">
    @if ($user)
        <h1>{{ $user->name }}</h1>
        <p>{!! $user->bio !!}</p>
    @endif
    @foreach ($items as $item)
        <div class="item-card">
            <span>{{ $item->title }}</span>
        </div>
    @endforeach
</div>
@endsection`;

      const formatted = beautifyCode(bladeTemplate, 'view.blade.php');
      expect(formatted).toContain("@extends('layouts.app')");
      expect(formatted).toContain("@section('content')");
      expect(formatted).toContain('<div class="container">');
      expect(formatted).toContain('{{ $user->name }}');
      expect(formatted).toContain('{!! $user->bio !!}');
      expect(formatted).toContain('@endsection');
    });

    it('heals and formats broken CSS inside Blade files and standalone CSS', () => {
      const brokenBladeCss = `<style>
/* Tree */
.tree ul {
    padding-top: 3 px;
    position: relative;
    transition: all 0.5 s;
    - webkit-transition: all 0.5 s;
    - moz-transition: all 0.5 s;
}

.tree li {
    display: table - cell;
    text-align: center;
    list - style-type: none;
    position: relative;
    padding: 20 px 5 px 0 5 px;
    transition: all 0.5 s;
    - webkit-transition: all 0.5 s;
    - moz-transition: all 0.5 s;
}

.tree li.child: hover + .parent::before {
    border - color: red;
}
</style>`;

      let currentDoc = brokenBladeCss;
      const mockView = {
        state: {
          doc: {
            length: currentDoc.length,
            toString: () => currentDoc,
          },
        },
        dispatch: (action: any) => {
          if (action.changes?.insert) {
            currentDoc = action.changes.insert;
          }
        },
      } as any;

      const formatted = autoIndentAndFormatEditor(mockView, 'tree.blade.php', 'blade');

      // 1. Units must not have spaces (3px not 3 px, 0.5s not 0.5 s)
      expect(formatted).toContain('padding-top: 3px;');
      expect(formatted).not.toContain('3 px');
      expect(formatted).toContain('transition: all 0.5s;');
      expect(formatted).not.toContain('0.5 s');
      expect(formatted).toContain('padding: 20px 5px 0 5px;');
      expect(formatted).not.toContain('20 px');

      // 2. Vendor prefixes must be intact
      expect(formatted).toContain('-webkit-transition: all 0.5s;');
      expect(formatted).toContain('-moz-transition: all 0.5s;');
      expect(formatted).not.toContain('- webkit-transition');
      expect(formatted).not.toContain('- moz-transition');

      // 3. Hyphenated properties & values must not have spaces
      expect(formatted).toContain('display: table-cell;');
      expect(formatted).not.toContain('table - cell');
      expect(formatted).toContain('list-style-type: none;');
      expect(formatted).not.toContain('list - style-type');
      expect(formatted).toContain('border-color: red;');

      // 4. Pseudo-class must not have space
      expect(formatted).toContain('.tree li.child:hover');
      expect(formatted).not.toContain(': hover');
    });

    it('heals broken CSS hex colors like # F45B69 and # 000000 in Blade files', () => {
      const brokenHexCss = `<style>
.person.female {
    border-color: # F45B69;
}

.person.male {
    border-color: #456990;
}

.person div {
    text-align: center;
}

.person .name {
    font-size: 16px;
}

.person .parentDrop,
.person .spouseDrop,
.person .childDrop {
    border: 1px dashed # 000000;
    width: auto;
    min-width: 80px;
}
</style>`;

      let currentDoc = brokenHexCss;
      const mockView = {
        state: {
          doc: {
            length: currentDoc.length,
            toString: () => currentDoc,
          },
        },
        dispatch: (action: any) => {
          if (action.changes?.insert) {
            currentDoc = action.changes.insert;
          }
        },
      } as any;

      const formatted = autoIndentAndFormatEditor(mockView, 'family.blade.php', 'blade');

      // Hex colors must not have spaces after #
      expect(formatted).toContain('border-color: #F45B69;');
      expect(formatted).not.toContain('# F45B69');
      expect(formatted).toContain('border-color: #456990;');
      expect(formatted).toContain('border: 1px dashed #000000;');
      expect(formatted).not.toContain('# 000000');
    });

    it('safely repairs standalone CSS files with beautifyCode', () => {
      const rawCss = `.box { padding: 10 px; - webkit-transform: scale(1); border - radius: 4 px; color: # F45B69; }`;
      const formatted = beautifyCode(rawCss, 'styles.css');
      expect(formatted).toContain('padding: 10px;');
      expect(formatted).toContain('-webkit-transform: scale(1);');
      expect(formatted).toContain('border-radius: 4px;');
      expect(formatted).toContain('color: #F45B69;');
    });
  });
});
