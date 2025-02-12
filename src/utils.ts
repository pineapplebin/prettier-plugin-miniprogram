/**
 * Copy from prettier-plugin-astro
 * @see https://github.com/withastro/prettier-plugin-astro/blob/main/src/printer/utils.ts
 */

import {
  type AstPath as AstP,
  type BuiltInParserName,
  type Doc,
  type ParserOptions as ParserOpts,
} from 'prettier';
import type { AST } from '@wxml/parser';

export type printFn = (path: AstPath) => Doc;
export type ParserOptions = ParserOpts<AST.Node>;
export type AstPath = AstP<AST.Node>;

/**
 * 非块级别元素名称
 */
export const nonBlockElements: string[] = [
  'text',
  'image',
  'span',
  'progress',
  'import',
  'icon',
];

/**
 * 强制自闭合标签
 */
export const forceSelfClosingTags: string[] = [
  'import',
  'input',
  'progress',
  'switch',
  'slider',
];

/**
 * 可格式化的属性
 */
export const formattableAttributes: string[] = [];

export type ParentLikeNode = { children: AST.Node[] };

export function isInlineElement(
  path: AstPath,
  opts: ParserOptions,
  node: AST.Node,
): boolean {
  return (
    node &&
    isTagLikeNode(node) &&
    !isBlockElement(node, opts) &&
    !isPreTagContent(path)
  );
}

export function isBlockElement(node: AST.Node, opts: ParserOptions): boolean {
  return (
    node &&
    (node.type === 'WXElement' || node.type === 'WXScript') &&
    opts.htmlWhitespaceSensitivity !== 'strict' &&
    (opts.htmlWhitespaceSensitivity === 'ignore' ||
      !nonBlockElements.includes(node.name))
  );
}

export function isForceSelfClosingTag(node: AST.Node): boolean {
  return (
    node &&
    node.type === 'WXElement' &&
    forceSelfClosingTags.includes(node.name)
  );
}

export function isIgnoreDirective(node: AST.Node): boolean {
  return node.type === 'WXComment' && node.value.trim() === 'prettier-ignore';
}

export function isNodeWithChildren(
  node: AST.Node,
): node is AST.Node & ParentLikeNode {
  return node && 'children' in node && Array.isArray(node.children);
}

export const isEmptyTextNode = (node: AST.Node): boolean => {
  return (
    !!node && node.type === 'WXText' && getUnencodedText(node).trim() === ''
  );
};

export function getUnencodedText(node: AST.WXText | AST.WXComment): string {
  return node.value;
}

export function isTextNodeStartingWithLinebreak(
  node: AST.WXText,
  nrLines = 1,
): node is AST.WXText {
  return startsWithLinebreak(getUnencodedText(node), nrLines);
}

export function startsWithLinebreak(text: string, nrLines = 1): boolean {
  return new RegExp(`^([\\t\\f\\r ]*\\n){${nrLines}}`).test(text);
}

export function endsWithLinebreak(text: string, nrLines = 1): boolean {
  return new RegExp(`(\\n[\\t\\f\\r ]*){${nrLines}}$`).test(text);
}

export function isTextNodeStartingWithWhitespace(
  node: AST.Node,
): node is AST.WXText {
  return isTextNode(node) && /^\s/.test(getUnencodedText(node));
}

function endsWithWhitespace(text: string) {
  return /\s$/.test(text);
}

export function isTextNodeEndingWithWhitespace(
  node: AST.Node,
): node is AST.WXText {
  return isTextNode(node) && endsWithWhitespace(getUnencodedText(node));
}

export function hasWxDirectives(node: AST.BaseTagLike) {
  const attributes = Array.from(node.startTag.attributes, (attr) => attr.key);
  return attributes.some((attr) => attr.startsWith('wx:'));
}

/**
 * Check if given node's start tag should hug its first child. This is the case for inline elements when there's
 * no whitespace between the `>` and the first child.
 */
export function shouldHugStart(node: AST.Node, opts: ParserOptions): boolean {
  if (isBlockElement(node, opts)) {
    return false;
  }

  if (!isNodeWithChildren(node)) {
    return false;
  }

  const children = node.children;
  if (children.length === 0) {
    return true;
  }

  const firstChild = children[0]!;
  return !isTextNodeStartingWithWhitespace(firstChild);
}

/**
 * Check if given node's end tag should hug its last child. This is the case for inline elements when there's
 * no whitespace between the last child and the `</`.
 */
export function shouldHugEnd(node: AST.Node, opts: ParserOptions): boolean {
  if (isBlockElement(node, opts)) {
    return false;
  }

  if (!isNodeWithChildren(node)) {
    return false;
  }

  const children = node.children;
  if (children.length === 0) {
    return true;
  }

  const lastChild = children[children.length - 1]!;
  if (isExpressionNode(lastChild)) return true;
  if (isTagLikeNode(lastChild)) return true;
  return !isTextNodeEndingWithWhitespace(lastChild);
}

/**
 * Returns true if the softline between `</tagName` and `>` can be omitted.
 */
export function canOmitSoftlineBeforeClosingTag(
  path: AstPath,
  opts: ParserOptions,
): boolean {
  return isLastChildWithinParentBlockElement(path, opts);
}

function getChildren(node: AST.Node): AST.Node[] {
  return isNodeWithChildren(node) ? node.children : [];
}

function isLastChildWithinParentBlockElement(
  path: AstPath,
  opts: ParserOptions,
): boolean {
  const parent = path.getParentNode();
  if (!parent || !isBlockElement(parent, opts)) {
    return false;
  }

  const children = getChildren(parent);
  const lastChild = children[children.length - 1];
  return lastChild === path.getNode();
}

export function trimTextNodeLeft(node: AST.WXText): void {
  node.value = node.value && node.value.trimStart();
}

export function trimTextNodeRight(node: AST.WXText): void {
  node.value = node.value && node.value.trimEnd();
}

export function printClassNames(value: string) {
  const lines = value.trim().split(/[\r\n]+/);
  const formattedLines = lines.map((line) => {
    const spaces = /^\s+/.exec(line);
    return (spaces ? spaces[0] : '') + line.trim().split(/\s+/).join(' ');
  });
  return formattedLines.join('\n');
}

/** dedent string & return tabSize (the last part is what we need) */
export function manualDedent(input: string): {
  tabSize: number;
  char: string;
  result: string;
} {
  let minTabSize = Infinity;
  let result = input;
  // 1. normalize
  result = result.replace(/\r\n/g, '\n');

  // 2. count tabSize
  let char = '';
  for (const line of result.split('\n')) {
    if (!line) continue;
    // if any line begins with a non-whitespace char, minTabSize is 0
    if (line[0] && /^\S/.test(line[0])) {
      minTabSize = 0;
      break;
    }
    const match = /^(\s+)\S+/.exec(line); // \S ensures we don’t count lines of pure whitespace
    if (match) {
      if (match[1] && !char) char = match[1][0]!;
      if (match[1]!.length < minTabSize) minTabSize = match[1]!.length;
    }
  }

  // 3. reformat string
  if (minTabSize > 0 && Number.isFinite(minTabSize)) {
    result = result.replace(
      new RegExp(`^${new Array(minTabSize + 1).join(char)}`, 'gm'),
      '',
    );
  }

  return {
    tabSize: minTabSize === Infinity ? 0 : minTabSize,
    char,
    result,
  };
}

/** True if the node is of type text */
export function isTextNode(node: AST.Node): node is AST.WXText {
  return node.type === 'WXText';
}

export function isExpressionNode(node: AST.Node): node is AST.WXInterpolation {
  return node.type === 'WXInterpolation';
}

/** True if the node is TagLikeNode:
 *
 * WXElement | WXScript */
export function isTagLikeNode(
  node: AST.Node,
): node is AST.WXElement | AST.WXScript {
  return node.type === 'WXElement' || node.type === 'WXScript';
}

/**
 * Returns siblings, that is, the children of the parent.
 */
export function getSiblings(path: AstPath): AST.Node[] {
  const parent = path.getParentNode();
  if (!parent) return [];

  return getChildren(parent);
}

export function getNextNode(path: AstPath): AST.Node | null {
  const node = path.getNode();
  if (node) {
    const siblings = getSiblings(path);
    if (node.start === siblings[siblings.length - 1]?.start) return null;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i]!;
      if (sibling.start === node.start && i !== siblings.length - 1) {
        return siblings[i + 1] || null;
      }
    }
  }
  return null;
}

export const isPreTagContent = (path: AstPath): boolean => {
  if (!path || !path.stack || !Array.isArray(path.stack)) return false;
  return path.stack.some(
    (node: AST.Node) =>
      (node.type === 'WXElement' && node.name.toLowerCase() === 'pre') ||
      (node.type === 'WXAttribute' &&
        !formattableAttributes.includes(node.key)),
  );
};

interface QuoteResult {
  quote: '"' | "'";
  regex: RegExp;
  escaped: string;
}

// Adapted from Prettier's source code as it's unfortunately not exported
// https://github.com/prettier/prettier/blob/237e681936fc533c27d7ce8577d3fc98838a3314/src/common/util.js#L238
export function getPreferredQuote(
  rawContent: string,
  preferredQuote: string,
): QuoteResult {
  const double: QuoteResult = { quote: '"', regex: /"/g, escaped: '&quot;' };
  const single: QuoteResult = { quote: "'", regex: /'/g, escaped: '&apos;' };

  const preferred = preferredQuote === "'" ? single : double;
  const alternate = preferred === single ? double : single;

  let result = preferred;

  // If `rawContent` contains at least one of the quote preferred for enclosing
  // the string, we might want to enclose with the alternate quote instead, to
  // minimize the number of escaped quotes.
  if (
    rawContent.includes(preferred.quote) ||
    rawContent.includes(alternate.quote)
  ) {
    const numPreferredQuotes = (preferred.regex.exec(rawContent) || []).length;
    const numAlternateQuotes = (alternate.regex.exec(rawContent) || []).length;

    result = numPreferredQuotes > numAlternateQuotes ? alternate : preferred;
  }

  return result;
}

export function inferParser(node: AST.BaseTagLike): BuiltInParserName {
  const tag = node.name;

  switch (tag) {
    default:
      return 'babel';
  }
}

export function serialize(node: AST.Node): string {
  switch (node.type) {
    case 'WXInterpolation':
      return `{{${node.value}}}`;
    case 'WXText':
      return node.value;
    case 'WXComment':
      return `<!--${node.value}-->`;
    default:
      throw new Error(`Cannot serialize node of type ${node.type}`);
  }
}

export function printChildrenRaw(
  node: AST.Node,
  stripLeadingAndTrailingNewline = false,
): string {
  if (!isNodeWithChildren(node)) {
    return '';
  }

  if (!node.children || node.children.length === 0) {
    return '';
  }

  let raw = (node.children as AST.Node[]).reduce(
    (prev: string, curr: AST.Node) => prev + serialize(curr),
    '',
  );

  if (!stripLeadingAndTrailingNewline) {
    return raw;
  }

  if (startsWithLinebreak(raw)) {
    raw = raw.substring(raw.indexOf('\n') + 1);
  }
  if (endsWithLinebreak(raw)) {
    raw = raw.substring(0, raw.lastIndexOf('\n'));
    if (raw.charAt(raw.length - 1) === '\r') {
      raw = raw.substring(0, raw.length - 1);
    }
  }

  return raw;
}
