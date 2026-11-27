import { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';

export const SWIFT_KEYWORDS_COMPLETIONS: Completion[] = [
  // Declarations
  { label: 'func', type: 'keyword', info: 'Function declaration', detail: 'func name(...) -> ReturnType' },
  { label: 'struct', type: 'keyword', info: 'Structure declaration', detail: 'struct Name { ... }' },
  { label: 'class', type: 'keyword', info: 'Class declaration', detail: 'class Name: Superclass { ... }' },
  { label: 'actor', type: 'keyword', info: 'Actor declaration (Swift concurrency)', detail: 'actor Name { ... }' },
  { label: 'protocol', type: 'keyword', info: 'Protocol declaration', detail: 'protocol Name { ... }' },
  { label: 'enum', type: 'keyword', info: 'Enumeration declaration', detail: 'enum Name { case ... }' },
  { label: 'extension', type: 'keyword', info: 'Type extension declaration', detail: 'extension Type { ... }' },
  { label: 'init', type: 'keyword', info: 'Initializer declaration', detail: 'init(...) { ... }' },
  { label: 'deinit', type: 'keyword', info: 'Deinitializer declaration', detail: 'deinit { ... }' },
  { label: 'subscript', type: 'keyword', info: 'Subscript declaration', detail: 'subscript(index: Int) -> Type' },
  { label: 'typealias', type: 'keyword', info: 'Type alias declaration', detail: 'typealias NewName = ExistingType' },
  { label: 'associatedtype', type: 'keyword', info: 'Associated type in protocol' },

  // Variables & Flow
  { label: 'let', type: 'keyword', info: 'Immutable constant declaration' },
  { label: 'var', type: 'keyword', info: 'Mutable variable declaration' },
  { label: 'guard', type: 'keyword', info: 'Guard early exit statement', detail: 'guard condition else { return }' },
  { label: 'if', type: 'keyword', info: 'Conditional branch' },
  { label: 'else', type: 'keyword', info: 'Alternative conditional branch' },
  { label: 'switch', type: 'keyword', info: 'Pattern matching switch statement' },
  { label: 'case', type: 'keyword', info: 'Switch case branch' },
  { label: 'default', type: 'keyword', info: 'Default switch branch' },
  { label: 'for', type: 'keyword', info: 'For-in loop iteration', detail: 'for item in collection' },
  { label: 'while', type: 'keyword', info: 'While loop' },
  { label: 'repeat', type: 'keyword', info: 'Repeat-while loop' },
  { label: 'defer', type: 'keyword', info: 'Defer execution until scope exit' },
  { label: 'return', type: 'keyword', info: 'Return from function' },
  { label: 'throw', type: 'keyword', info: 'Throw an error' },
  { label: 'throws', type: 'keyword', info: 'Function can throw errors' },
  { label: 'rethrows', type: 'keyword', info: 'Function rethrows errors from closures' },
  { label: 'try', type: 'keyword', info: 'Execute throwing expression', detail: 'try / try? / try!' },
  { label: 'catch', type: 'keyword', info: 'Catch error clause' },
  { label: 'do', type: 'keyword', info: 'Do-catch block scope' },
  { label: 'break', type: 'keyword', info: 'Break out of loop or switch' },
  { label: 'continue', type: 'keyword', info: 'Continue to next loop iteration' },
  { label: 'fallthrough', type: 'keyword', info: 'Fallthrough to next switch case' },

  // Concurrency & Modifiers
  { label: 'async', type: 'keyword', info: 'Asynchronous function or context' },
  { label: 'await', type: 'keyword', info: 'Await asynchronous operation' },
  { label: 'isolated', type: 'keyword', info: 'Actor isolated parameter' },
  { label: 'nonisolated', type: 'keyword', info: 'Non-isolated actor method' },
  { label: 'mutating', type: 'keyword', info: 'Mutating method on value type' },
  { label: 'nonmutating', type: 'keyword', info: 'Nonmutating property setter' },
  { label: 'public', type: 'keyword', info: 'Public access modifier' },
  { label: 'private', type: 'keyword', info: 'Private access modifier' },
  { label: 'fileprivate', type: 'keyword', info: 'Fileprivate access modifier' },
  { label: 'internal', type: 'keyword', info: 'Internal module access modifier' },
  { label: 'open', type: 'keyword', info: 'Open class for subclassing outside module' },
  { label: 'final', type: 'keyword', info: 'Prevent method or class overriding' },
  { label: 'override', type: 'keyword', info: 'Override superclass method' },
  { label: 'static', type: 'keyword', info: 'Static type member' },
  { label: 'weak', type: 'keyword', info: 'Weak reference (avoids retain cycles)' },
  { label: 'unowned', type: 'keyword', info: 'Unowned reference' },
  { label: 'inout', type: 'keyword', info: 'Pass argument by reference' },
  { label: 'some', type: 'keyword', info: 'Opaque return type (e.g. some View)' },
  { label: 'any', type: 'keyword', info: 'Existential container type' },
  { label: 'where', type: 'keyword', info: 'Generic constraint clause' },
  { label: 'self', type: 'keyword', info: 'Current instance reference' },
  { label: 'Self', type: 'keyword', info: 'Current dynamic type reference' },
  { label: 'import', type: 'keyword', info: 'Import framework or module', detail: 'import Foundation / SwiftUI' },
];

export const SWIFT_PROPERTY_WRAPPERS_COMPLETIONS: Completion[] = [
  { label: '@State', type: 'constant', info: 'SwiftUI mutable state within a view', detail: '@State private var value: Type' },
  { label: '@Binding', type: 'constant', info: 'SwiftUI two-way binding to external state', detail: '@Binding var value: Type' },
  { label: '@Published', type: 'constant', info: 'Combine published property on ObservableObject', detail: '@Published var value: Type' },
  { label: '@ObservedObject', type: 'constant', info: 'SwiftUI observed object reference', detail: '@ObservedObject var viewModel: ViewModel' },
  { label: '@StateObject', type: 'constant', info: 'SwiftUI lifecycle-owned observable object', detail: '@StateObject var viewModel = ViewModel()' },
  { label: '@EnvironmentObject', type: 'constant', info: 'SwiftUI environment injected observable object' },
  { label: '@Environment', type: 'constant', info: 'SwiftUI environment value (e.g. \\.dismiss)' },
  { label: '@AppStorage', type: 'constant', info: 'SwiftUI persistent UserDefaults property' },
  { label: '@FocusState', type: 'constant', info: 'SwiftUI keyboard focus state property' },
  { label: '@main', type: 'constant', info: 'Swift application entry point' },
  { label: '@Observable', type: 'constant', info: 'Swift 5.9+ Observation macro' },
  { label: '@MainActor', type: 'constant', info: 'Execute on main UI thread' },
  { label: '@discardableResult', type: 'constant', info: 'Suppress unused result warning' },
  { label: '@ViewBuilder', type: 'constant', info: 'SwiftUI view builder closure macro' },
];

export const SWIFT_TYPES_COMPLETIONS: Completion[] = [
  { label: 'String', type: 'type', info: 'UTF-8 Unicode string' },
  { label: 'Int', type: 'type', info: 'Signed integer (64-bit on 64-bit systems)' },
  { label: 'Double', type: 'type', info: '64-bit floating point number' },
  { label: 'Float', type: 'type', info: '32-bit floating point number' },
  { label: 'Bool', type: 'type', info: 'Boolean value (true or false)' },
  { label: 'Character', type: 'type', info: 'Single extended grapheme cluster' },
  { label: 'Array', type: 'type', info: 'Ordered collection of elements', detail: 'Array<Element> or [Element]' },
  { label: 'Dictionary', type: 'type', info: 'Key-value collection', detail: 'Dictionary<Key, Value> or [Key: Value]' },
  { label: 'Set', type: 'type', info: 'Unordered collection of unique elements' },
  { label: 'Optional', type: 'type', info: 'Value that can be nil', detail: 'Optional<Wrapped> or Type?' },
  { label: 'Result', type: 'type', info: 'Success or Failure value', detail: 'Result<Success, Failure>' },
  { label: 'Task', type: 'type', info: 'Asynchronous concurrency task', detail: 'Task { await ... }' },
  { label: 'MainActor', type: 'type', info: 'Global actor for main thread execution' },
  { label: 'Sendable', type: 'type', info: 'Thread-safe value across concurrency boundaries' },
  { label: 'Error', type: 'type', info: 'Protocol for throwable error types' },
  { label: 'Data', type: 'type', info: 'Byte buffer representation (Foundation)' },
  { label: 'Date', type: 'type', info: 'Point in time (Foundation)' },
  { label: 'URL', type: 'type', info: 'Uniform Resource Locator (Foundation)' },
  { label: 'UUID', type: 'type', info: 'Universally unique identifier (Foundation)' },
  { label: 'View', type: 'type', info: 'SwiftUI UI element protocol', detail: 'protocol View { var body: some View }' },
  { label: 'Text', type: 'type', info: 'SwiftUI text display view' },
  { label: 'VStack', type: 'type', info: 'SwiftUI vertical stack layout view' },
  { label: 'HStack', type: 'type', info: 'SwiftUI horizontal stack layout view' },
  { label: 'ZStack', type: 'type', info: 'SwiftUI layered z-index stack view' },
  { label: 'Button', type: 'type', info: 'SwiftUI interactive button view' },
  { label: 'Image', type: 'type', info: 'SwiftUI graphic or SF Symbol view' },
  { label: 'List', type: 'type', info: 'SwiftUI scrollable list of rows' },
  { label: 'ScrollView', type: 'type', info: 'SwiftUI scrollable container' },
  { label: 'NavigationStack', type: 'type', info: 'SwiftUI stack-based navigation container' },
];

export const SWIFT_SNIPPETS_COMPLETIONS: Completion[] = [
  {
    label: 'func',
    type: 'snippet',
    detail: 'Function definition',
    apply: 'func name(params: Type) -> ReturnType {\n    // code\n}',
  },
  {
    label: 'struct',
    type: 'snippet',
    detail: 'Struct declaration',
    apply: 'struct Name {\n    var property: String\n}',
  },
  {
    label: 'guard-let',
    type: 'snippet',
    detail: 'Guard optional unwrapping',
    apply: 'guard let value = optionalValue else {\n    return\n}',
  },
  {
    label: 'if-let',
    type: 'snippet',
    detail: 'If-let optional unwrapping',
    apply: 'if let value = optionalValue {\n    // code\n}',
  },
  {
    label: 'for-in',
    type: 'snippet',
    detail: 'For-in iteration',
    apply: 'for item in collection {\n    // code\n}',
  },
  {
    label: 'do-catch',
    type: 'snippet',
    detail: 'Do-catch error handling',
    apply: 'do {\n    try expression\n} catch {\n    print("Error: \\(error)")\n}',
  },
  {
    label: 'task-main',
    type: 'snippet',
    detail: 'Asynchronous Task on MainActor',
    apply: 'Task { @MainActor in\n    // code\n}',
  },
  {
    label: 'swiftui-view',
    type: 'snippet',
    detail: 'SwiftUI View template',
    apply: 'import SwiftUI\n\nstruct MyView: View {\n    var body: some View {\n        VStack {\n            Text("Hello, World!")\n        }\n        .padding()\n    }\n}\n\n#Preview {\n    MyView()\n}',
  },
];

const ALL_SWIFT_COMPLETIONS: Completion[] = [
  ...SWIFT_KEYWORDS_COMPLETIONS,
  ...SWIFT_PROPERTY_WRAPPERS_COMPLETIONS,
  ...SWIFT_TYPES_COMPLETIONS,
  ...SWIFT_SNIPPETS_COMPLETIONS,
];

/**
 * Creates CodeMirror 6 autocompletion source for Swift documents.
 */
export function createSwiftCompletionSource() {
  return swiftCompletionSource;
}

/**
 * CodeMirror 6 autocompletion source for Swift documents.
 */
export function swiftCompletionSource(context: CompletionContext): CompletionResult | null {
  // Support both normal word matching and @propertyWrapper prefixes
  const word = context.matchBefore(/@?[a-zA-Z_]\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  const query = word.text.toLowerCase();
  const filtered = ALL_SWIFT_COMPLETIONS.filter((item) =>
    item.label.toLowerCase().startsWith(query) || item.label.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    return null;
  }

  return {
    from: word.from,
    options: filtered,
    validFor: /^@?[a-zA-Z_]\w*$/,
  };
}
