import { EditorState, Annotation } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

const autoRenameAnnotation = Annotation.define<boolean>();

// Valid tag identifier characters (HTML, XML, JSX/TSX)
const VALID_TAG_NAME_REGEX = /^[a-zA-Z0-9_\-.:]*$/;

interface TagNodeInfo {
  from: number;
  to: number;
  text: string;
}

interface TagPairInfo {
  isOpening: boolean;
  openTagNameNode: TagNodeInfo | null;
  closeTagNameNode: TagNodeInfo | null;
}

/**
 * Searches the syntax tree for the opening and closing tag names corresponding
 * to the given position in HTML, XML, or JSX/TSX.
 */
function findTagNodes(state: EditorState, pos: number): TagPairInfo | null {
  const tree = syntaxTree(state);

  // Check boundary with bias -1 first, then fallback to 1
  let node = tree.resolveInner(pos, -1);
  if (!node || !['TagName', 'JSXIdentifier', 'JSXBuiltin'].includes(node.name)) {
    node = tree.resolveInner(pos, 1);
  }
  if (!node) return null;

  // Resolve to TagName / JSXIdentifier node
  let tagNode: any = node;
  while (tagNode && !['TagName', 'JSXIdentifier', 'JSXBuiltin'].includes(tagNode.name)) {
    tagNode = tagNode.parent;
  }
  if (!tagNode) return null;

  // Resolve to tag wrapper (OpenTag, CloseTag, JSXOpenTag, JSXCloseTag, etc.)
  let tagWrapper: any = tagNode.parent;
  while (
    tagWrapper &&
    ![
      'OpenTag',
      'CloseTag',
      'MismatchedCloseTag',
      'JSXOpenTag',
      'JSXCloseTag',
    ].includes(tagWrapper.name)
  ) {
    tagWrapper = tagWrapper.parent;
  }
  if (!tagWrapper) return null;

  const isOpening = tagWrapper.name === 'OpenTag' || tagWrapper.name === 'JSXOpenTag';
  const isClosing =
    tagWrapper.name === 'CloseTag' ||
    tagWrapper.name === 'MismatchedCloseTag' ||
    tagWrapper.name === 'JSXCloseTag';

  if (!isOpening && !isClosing) return null;

  // Resolve to enclosing Element or JSXElement
  const element = tagWrapper.parent;
  if (!element || (element.name !== 'Element' && element.name !== 'JSXElement')) {
    return null;
  }

  let openTagNameNode: TagNodeInfo | null = null;
  let closeTagNameNode: TagNodeInfo | null = null;

  let child = element.firstChild;
  while (child) {
    if (child.name === 'OpenTag' || child.name === 'JSXOpenTag') {
      child.cursor().iterate((n: any) => {
        if (
          (n.name === 'TagName' || n.name === 'JSXIdentifier' || n.name === 'JSXBuiltin') &&
          !openTagNameNode
        ) {
          openTagNameNode = {
            from: n.from,
            to: n.to,
            text: state.sliceDoc(n.from, n.to),
          };
        }
      });
    } else if (
      child.name === 'CloseTag' ||
      child.name === 'MismatchedCloseTag' ||
      child.name === 'JSXCloseTag'
    ) {
      child.cursor().iterate((n: any) => {
        if (
          (n.name === 'TagName' || n.name === 'JSXIdentifier' || n.name === 'JSXBuiltin') &&
          !closeTagNameNode
        ) {
          closeTagNameNode = {
            from: n.from,
            to: n.to,
            text: state.sliceDoc(n.from, n.to),
          };
        }
      });
    }
    child = child.nextSibling;
  }

  return { isOpening, openTagNameNode, closeTagNameNode };
}

/**
 * CodeMirror 6 extension that automatically renames the matching closing tag
 * when the opening tag is edited (and vice versa) in real time.
 */
export const autoRenameTagExtension = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged || tr.annotation(autoRenameAnnotation)) return tr;

  const extraChanges: { from: number; to: number; insert: string }[] = [];
  const processedPositions = new Set<number>();

  tr.changes.iterChanges((fromA, toA) => {
    const pair = findTagNodes(tr.startState, fromA);
    if (!pair || !pair.openTagNameNode || !pair.closeTagNameNode) return;

    if (pair.isOpening) {
      // User edited the opening tag
      if (fromA >= pair.openTagNameNode.from && toA <= pair.openTagNameNode.to) {
        if (processedPositions.has(pair.closeTagNameNode.from)) return;

        const mappedOpenFrom = tr.changes.mapPos(pair.openTagNameNode.from, -1);
        const mappedOpenTo = tr.changes.mapPos(pair.openTagNameNode.to, 1);
        const newTagName = tr.newDoc.sliceString(mappedOpenFrom, mappedOpenTo);

        // Ensure the new tag name doesn't contain spaces (e.g. typing attributes) or invalid characters
        if (VALID_TAG_NAME_REGEX.test(newTagName)) {
          processedPositions.add(pair.closeTagNameNode.from);
          extraChanges.push({
            from: pair.closeTagNameNode.from,
            to: pair.closeTagNameNode.to,
            insert: newTagName,
          });
        }
      }
    } else {
      // User edited the closing tag
      if (fromA >= pair.closeTagNameNode.from && toA <= pair.closeTagNameNode.to) {
        if (processedPositions.has(pair.openTagNameNode.from)) return;

        const mappedCloseFrom = tr.changes.mapPos(pair.closeTagNameNode.from, -1);
        const mappedCloseTo = tr.changes.mapPos(pair.closeTagNameNode.to, 1);
        const newTagName = tr.newDoc.sliceString(mappedCloseFrom, mappedCloseTo);

        if (VALID_TAG_NAME_REGEX.test(newTagName)) {
          processedPositions.add(pair.openTagNameNode.from);
          extraChanges.push({
            from: pair.openTagNameNode.from,
            to: pair.openTagNameNode.to,
            insert: newTagName,
          });
        }
      }
    }
  });

  if (extraChanges.length > 0) {
    extraChanges.sort((a, b) => a.from - b.from);
    return [tr, { changes: extraChanges, annotations: autoRenameAnnotation.of(true) }];
  }

  return tr;
});
