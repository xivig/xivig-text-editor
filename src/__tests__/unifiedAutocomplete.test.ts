import { describe, it, expect, beforeEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';
import { htmlCompletions } from '../components/editor/completions/htmlCompletions';
import { cssCompletions } from '../components/editor/completions/cssCompletions';
import { jsCompletions } from '../components/editor/completions/jsCompletions';
import { phpCompletions } from '../components/editor/completions/phpCompletions';
import { laravelCompletionSource } from '../extensions/builtin/laravel-all-in-one/completions/laravelCompletionSource';
import { createLanguageCompletionSource, detectContextLanguage } from '../components/editor/completions/index';
import { useEditorStore } from '../stores/editorStore';
import { beautifyCode, repairPhpCode, repairCss, repairBrokenMarkup } from '../utils/beautify';

describe('HTML Autocomplete Provider', () => {
  it('provides HTML tag completions when starting with "<"', () => {
    const state = EditorState.create({ doc: '<d' });
    const cx = new CompletionContext(state, 2, false);
    const result = htmlCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('div');
    expect(labels).toContain('dialog');
  });

  it('provides tag attribute completions inside an open tag', () => {
    const state = EditorState.create({ doc: '<div c' });
    const cx = new CompletionContext(state, 6, false);
    const result = htmlCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('class');
    expect(labels).toContain('id');
    expect(labels).toContain('style');
  });

  it('provides attribute value completions inside quotes', () => {
    const state = EditorState.create({ doc: '<input type="' });
    const cx = new CompletionContext(state, 13, false);
    const result = htmlCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('text');
    expect(labels).toContain('password');
    expect(labels).toContain('email');
    expect(labels).toContain('checkbox');
  });
});

describe('CSS Autocomplete Provider', () => {
  it('provides CSS property completions', () => {
    const state = EditorState.create({ doc: '.box { dis' });
    const cx = new CompletionContext(state, 10, false);
    const result = cssCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('display');
  });

  it('provides property values for display:', () => {
    const state = EditorState.create({ doc: '.box { display: ' });
    const cx = new CompletionContext(state, 16, false);
    const result = cssCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('flex');
    expect(labels).toContain('grid');
    expect(labels).toContain('inline-block');
  });

  it('provides pseudo-elements on "::"', () => {
    const state = EditorState.create({ doc: '.tree li::' });
    const cx = new CompletionContext(state, 10, false);
    const result = cssCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('::before');
    expect(labels).toContain('::after');
  });

  it('provides pseudo-classes on ":"', () => {
    const state = EditorState.create({ doc: '.btn:' });
    const cx = new CompletionContext(state, 5, false);
    const result = cssCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain(':hover');
    expect(labels).toContain(':focus');
    expect(labels).toContain(':active');
  });

  it('provides at-rules on "@"', () => {
    const state = EditorState.create({ doc: '@' });
    const cx = new CompletionContext(state, 1, false);
    const result = cssCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('@media');
    expect(labels).toContain('@keyframes');
  });
});

describe('JavaScript / TypeScript Autocomplete Provider', () => {
  it('provides console member methods on "console."', () => {
    const state = EditorState.create({ doc: 'console.' });
    const cx = new CompletionContext(state, 8, false);
    const result = jsCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('log');
    expect(labels).toContain('error');
    expect(labels).toContain('warn');
  });

  it('provides document DOM query methods on "document."', () => {
    const state = EditorState.create({ doc: 'document.' });
    const cx = new CompletionContext(state, 9, false);
    const result = jsCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('querySelector');
    expect(labels).toContain('getElementById');
    expect(labels).toContain('addEventListener');
  });

  it('provides Math utilities on "Math."', () => {
    const state = EditorState.create({ doc: 'Math.' });
    const cx = new CompletionContext(state, 5, false);
    const result = jsCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('floor');
    expect(labels).toContain('ceil');
    expect(labels).toContain('random');
  });

  it('provides prototype methods on general dot expressions', () => {
    const state = EditorState.create({ doc: 'items.' });
    const cx = new CompletionContext(state, 6, false);
    const result = jsCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('map');
    expect(labels).toContain('filter');
    expect(labels).toContain('reduce');
    expect(labels).toContain('forEach');
  });

  it('provides keywords and globals on word prefix', () => {
    const state = EditorState.create({ doc: 'con' });
    const cx = new CompletionContext(state, 3, false);
    const result = jsCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('const');
    expect(labels).toContain('console');
  });
});

describe('PHP Autocomplete Provider', () => {
  it('provides superglobals on "$_"', () => {
    const state = EditorState.create({ doc: '$_' });
    const cx = new CompletionContext(state, 2, false);
    const result = phpCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('$_GET');
    expect(labels).toContain('$_POST');
    expect(labels).toContain('$_SESSION');
    expect(labels).toContain('$_SERVER');
  });

  it('provides arrow completions on "$this->"', () => {
    const state = EditorState.create({ doc: '$this->' });
    const cx = new CompletionContext(state, 7, false);
    const result = phpCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('classList');
    expect(labels).toContain('save()');
    expect(labels).toContain('update()');
  });

  it('provides core PHP built-in functions', () => {
    const state = EditorState.create({ doc: 'array_' });
    const cx = new CompletionContext(state, 6, false);
    const result = phpCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('array_map');
    expect(labels).toContain('array_filter');
    expect(labels).toContain('array_keys');
  });

  it('provides get_declared_classes completion', () => {
    const state = EditorState.create({ doc: 'get_dec' });
    const cx = new CompletionContext(state, 7, false);
    const result = phpCompletions(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('get_declared_classes');
  });
});

describe('Laravel Autocomplete Provider', () => {
  beforeEach(() => {
    useEditorStore.setState({
      documents: [
        { id: 'doc-1', name: 'routes/web.php', language: 'php', content: '', isDirty: false, path: '', cursor: { line: 1, col: 0 } },
      ],
      activeDocumentId: 'doc-1',
    });
  });

  it('provides static methods on Route::', () => {
    const state = EditorState.create({ doc: 'Route::' });
    const cx = new CompletionContext(state, 7, false);
    const result = laravelCompletionSource(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('get');
    expect(labels).toContain('post');
    expect(labels).toContain('resource');
    expect(labels).toContain('middleware');
  });

  it('provides static methods on Auth::', () => {
    const state = EditorState.create({ doc: 'Auth::' });
    const cx = new CompletionContext(state, 6, false);
    const result = laravelCompletionSource(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('user');
    expect(labels).toContain('check');
    expect(labels).toContain('id');
    expect(labels).toContain('attempt');
  });

  it('provides migration columns on $table->', () => {
    const state = EditorState.create({ doc: '$table->' });
    const cx = new CompletionContext(state, 8, false);
    const result = laravelCompletionSource(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('id');
    expect(labels).toContain('string');
    expect(labels).toContain('timestamps');
    expect(labels).toContain('foreignId');
  });

  it('provides query builder methods on "->"', () => {
    const state = EditorState.create({ doc: '$user->' });
    const cx = new CompletionContext(state, 7, false);
    const result = laravelCompletionSource(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('where');
    expect(labels).toContain('first');
    expect(labels).toContain('find');
    expect(labels).toContain('paginate');
  });

  it('provides Blade directives on "@" in Blade template', () => {
    useEditorStore.setState({
      documents: [
        { id: 'doc-2', name: 'view.blade.php', language: 'blade', content: '', isDirty: false, path: '', cursor: { line: 1, col: 0 } },
      ],
      activeDocumentId: 'doc-2',
    });

    const state = EditorState.create({ doc: '@' });
    const cx = new CompletionContext(state, 1, false);
    const result = laravelCompletionSource(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('@extends');
    expect(labels).toContain('@section');
    expect(labels).toContain('@if');
    expect(labels).toContain('@csrf');
  });
});

describe('Master Unified Completion Source Routing', () => {
  it('detects embedded CSS inside <style> and routes to CSS completions', () => {
    const doc = '<!DOCTYPE html><html><head><style>.tree li::</style></head></html>';
    const state = EditorState.create({ doc });
    // Cursor right after .tree li::
    const pos = doc.indexOf('.tree li::') + '.tree li::'.length;
    const cx = new CompletionContext(state, pos, false);
    const source = createLanguageCompletionSource(() => 'html');
    const result = source(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('::before');
  });

  it('detects embedded JS inside <script> and routes to JS completions', () => {
    const doc = '<!DOCTYPE html><html><body><script>console.</script></body></html>';
    const state = EditorState.create({ doc });
    // Cursor right after console. (at index 43)
    const cx = new CompletionContext(state, 43, false);
    const source = createLanguageCompletionSource(() => 'html');
    const result = source(cx);
    expect(result).not.toBeNull();
    const labels = result?.options.map((o) => o.label);
    expect(labels).toContain('log');
  });
});

describe('Code Repair for Image Corruptions', () => {
  it('heals Image 1 PHP corruptions ($this - > classList, < ? php, public function)', () => {
    const input = `< ? php

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
      foreach($this - > classList as $class) {
        echo $class.
        "<br>";
      }
    }
  }
}`;

    const formatted = beautifyCode(input, 'classListing.php', undefined, 'php');
    expect(formatted).toContain('<?php');
    expect(formatted).not.toContain('< ? php');
    expect(formatted).toContain('$this->classList = get_declared_classes();');
    expect(formatted).not.toContain('$this - >');
    expect(formatted).toContain('public function __construct()');
    expect(formatted).toContain('public function listClassNames()');
    expect(formatted).toContain('$class . "<br>";');
  });

  it('heals Image 2 Blade markup corruptions (} <\\n/style>, <\\n div class = ..., < /p> < / \\n div >)', () => {
    const input = `.tree li.child: hover + .parent::before {
  border - color: red;
} <
/style>

<
div class = "wrapper row0" >
<
div class = "rounded" >
<
p align = "center" > < img src = "img.png" > < /p> <
p align = "center" >
<
font color = "blue" > < b > Courses <
/p> < /
div > <
/div>`;

    const repaired = repairBrokenMarkup(input);
    expect(repaired).toContain('}\n</style>');
    expect(repaired).toContain('border-color: red;');
    expect(repaired).toContain('<div class="wrapper row0">');
    expect(repaired).toContain('<div class="rounded">');
    expect(repaired).toContain('</p>');
    expect(repaired).toContain('</div>');
  });

  it('heals Image 3 & 4 CSS corruptions (3 px, 0.5 s, table - cell, # F45B69, # 000000)', () => {
    const input = `.tree ul {
  padding-top: 3 px;
  position: relative;
  transition: all 0.5 s;
  - webkit-transition: all 0.5 s;
  - moz-transition: all 0.5 s;
}

.tree li {
  display: table - cell;
  text-align: center;
  list - style - type: none;
  padding: 20 px 5 px 0 5 px;
}

.person.female {
  border-color: # F45B69;
}

.person.male {
  border: 1px dashed # 000000;
}`;

    const repaired = repairCss(input);
    expect(repaired).toContain('padding-top: 3px;');
    expect(repaired).toContain('transition: all 0.5s;');
    expect(repaired).toContain('-webkit-transition: all 0.5s;');
    expect(repaired).toContain('-moz-transition: all 0.5s;');
    expect(repaired).toContain('display: table-cell;');
    expect(repaired).toContain('list-style-type: none;');
    expect(repaired).toContain('padding: 20px 5px 0 5px;');
    expect(repaired).toContain('border-color: #F45B69;');
    expect(repaired).toContain('border: 1px dashed #000000;');
  });

  it('heals Image 5 CSS percentage values (50 %)', () => {
    const input = `.tree li::before {
  right: 50 %;
  width: 50 %;
}
.tree li::after {
  left: 50 %;
}`;

    const repaired = repairCss(input);
    expect(repaired).toContain('right: 50%;');
    expect(repaired).toContain('width: 50%;');
    expect(repaired).toContain('left: 50%;');
  });
});
