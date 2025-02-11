import { type Doc, type Printer } from 'prettier';
import _doc from 'prettier/doc';
import { type AST } from '@wxml/parser';
import {
  canOmitSoftlineBeforeClosingTag,
  endsWithLinebreak,
  getNextNode,
  getUnencodedText,
  isEmptyTextNode,
  isIgnoreDirective,
  isInlineElement,
  isPreTagContent,
  isTagLikeNode,
  isTextNode,
  isTextNodeEndingWithWhitespace,
  isTextNodeStartingWithLinebreak,
  isTextNodeStartingWithWhitespace,
  printChildrenRaw,
  shouldHugEnd,
  shouldHugStart,
  startsWithLinebreak,
  trimTextNodeLeft,
  trimTextNodeRight,
} from './utils';

const {
  builders: {
    group,
    join,
    fill,
    indent,
    line,
    softline,
    hardline,
    literalline,
    breakParent,
    dedent,
  },
  utils: { stripTrailingHardline },
} = _doc;

/**
 * Split the text into words separated by whitespace. Replace the whitespaces by lines,
 * collapsing multiple whitespaces into a single line.
 *
 * If the text starts or ends with multiple newlines, two of those should be kept.
 */
function splitTextToDocs(node: AST.WXText): Doc[] {
  const text = getUnencodedText(node);

  const textLines = text.split(/[\t\n\f\r ]+/);

  let docs = join(line, textLines).filter((doc) => doc !== '');

  if (startsWithLinebreak(text)) {
    docs[0] = hardline;
  }
  if (startsWithLinebreak(text, 2)) {
    docs = [hardline, ...docs];
  }

  if (endsWithLinebreak(text)) {
    docs[docs.length - 1] = hardline;
  }
  if (endsWithLinebreak(text, 2)) {
    docs = [...docs, hardline];
  }

  return docs;
}

/**
 * temporary variable to ignore the next node
 */
let ignoreNext = false;

export const print: Printer<AST.Node>['print'] = (path, options, print) => {
  const node = path.getNode();
  // 1. check node types
  if (!node) {
    return '';
  }
  if (typeof node !== 'object' || !node.type) {
    console.warn('Invalid ast node:', node);
    throw new Error(`Invalid ast node: ${node}`);
  }

  // 1-1. prettier-ignore handles
  if (ignoreNext && !isEmptyTextNode(node)) {
    ignoreNext = false;
    return [
      options.originalText
        .slice(options.locStart(node), options.locEnd(node))
        .split('\n')
        .map((lineContent, i) =>
          i == 0 ? [lineContent] : [literalline, lineContent],
        )
        .flat(),
    ];
  }

  // 2. handle printing
  switch (node.type) {
    case 'Program':
      return [stripTrailingHardline(path.map(print, 'body')), hardline];

    case 'WXComment':
      if (isIgnoreDirective(node)) {
        ignoreNext = true;
      }
      const nextNode = getNextNode(path);
      let trailingLine: string | _doc.builders.Hardline = '';
      if (nextNode && isTagLikeNode(nextNode)) {
        trailingLine = hardline;
      }
      return ['<!--', getUnencodedText(node), '-->', trailingLine];

    case 'WXText':
      const rawText = getUnencodedText(node);
      if (isEmptyTextNode(node)) {
        const hasWhiteSpace = rawText.trim().length < rawText.length;
        const hasOneOrMoreNewlines = getUnencodedText(node).includes('\n');
        const hasTwoOrMoreNewlines = /\n\s*\n\r?/.test(rawText);
        if (hasTwoOrMoreNewlines) {
          return [hardline, hardline];
        }
        if (hasOneOrMoreNewlines) {
          return hardline;
        }
        if (hasWhiteSpace) {
          return line;
        }
        return '';
      }
      return fill(splitTextToDocs(node));

    case 'WXAttribute':
      if (!node.value && (!node.children || !node.children.length)) {
        return [line, node.key];
      }
      return [
        line,
        node.key,
        '=',
        node.quote || '"',
        node.children && node.children.length
          ? path.map(print, 'children')
          : node.value!,
        node.quote || '"',
      ];

    case 'WXElement':
    case 'WXScript':
      if (!node.attributes) {
        node.attributes = node.startTag.attributes;
      }

      const isEmpty =
        (node.type === 'WXElement' &&
          (!node.children.length ||
            node.children.every((child) => isEmptyTextNode(child)))) ||
        (node.type === 'WXScript' && (!node.value || !node.value.trim()));
      const isSelfClosingTag = node.startTag.selfClosing;

      const isSingleLinePerAttribute =
        options.singleAttributePerLine && node.startTag.attributes.length > 1;
      const attributeLine = isSingleLinePerAttribute ? breakParent : '';
      const attributes = join(attributeLine, path.map(print, 'attributes'));

      if (isSelfClosingTag) {
        return group(['<', node.name, indent(attributes), line, `/>`]);
      }

      if (node.type === 'WXScript') {
        // embed 已经处理
        return '';
      }

      const children = node.children || [];
      const firstChild = children[0];
      const lastChild = children[children.length - 1];

      // No hugging of content means it's either a block element and/or there's whitespace at the start/end
      let noHugSeparatorStart:
        | _doc.builders.Line
        | _doc.builders.Softline
        | _doc.builders.Hardline
        | string = softline;
      let noHugSeparatorEnd:
        | _doc.builders.Line
        | _doc.builders.Softline
        | _doc.builders.Hardline
        | string = softline;
      const hugStart = shouldHugStart(node, options);
      const hugEnd = shouldHugEnd(node, options);

      let body;
      if (isEmpty) {
        body =
          isInlineElement(path, options, node) &&
          node.children.length &&
          isTextNodeStartingWithWhitespace(node.children[0]!) &&
          !isPreTagContent(path)
            ? () => line
            : () => softline;
      } else if (isPreTagContent(path)) {
        body = () => printChildrenRaw(node);
      } else if (
        isInlineElement(path, options, node) &&
        !isPreTagContent(path)
      ) {
        body = () => path.map(print, 'children');
      } else {
        body = () => path.map(print, 'children');
      }

      const openingTag = [
        '<',
        node.name,
        indent(
          group([
            attributes,
            hugStart
              ? ''
              : !isPreTagContent(path) && !options.bracketSameLine
                ? dedent(softline)
                : '',
          ]),
        ),
      ];

      if (hugStart && hugEnd) {
        const huggedContent = [
          isSingleLinePerAttribute ? hardline : softline,
          group(['>', body(), `</${node.name}`]),
        ];

        const omitSoftlineBeforeClosingTag =
          isEmpty || canOmitSoftlineBeforeClosingTag(path, options);
        return group([
          ...openingTag,
          isEmpty ? group(huggedContent) : group(indent(huggedContent)),
          omitSoftlineBeforeClosingTag ? '' : softline,
          '>',
        ]);
      }

      if (isPreTagContent(path)) {
        noHugSeparatorStart = '';
        noHugSeparatorEnd = '';
      } else {
        let didSetEndSeparator = false;

        if (!hugStart && firstChild && isTextNode(firstChild)) {
          if (
            isTextNodeStartingWithLinebreak(firstChild) &&
            firstChild !== lastChild &&
            (!isInlineElement(path, options, node) ||
              isTextNodeEndingWithWhitespace(lastChild!))
          ) {
            noHugSeparatorStart = hardline;
            noHugSeparatorEnd = hardline;
            didSetEndSeparator = true;
          } else if (isInlineElement(path, options, node)) {
            noHugSeparatorStart = line;
          }
          trimTextNodeLeft(firstChild);
        }
        if (!hugEnd && lastChild && isTextNode(lastChild)) {
          if (isInlineElement(path, options, node) && !didSetEndSeparator) {
            noHugSeparatorEnd = line;
          }
          trimTextNodeRight(lastChild);
        }
      }

      if (hugStart) {
        return group([
          ...openingTag,
          indent([softline, group(['>', body()])]),
          noHugSeparatorEnd,
          `</${node.name}>`,
        ]);
      }

      if (hugEnd) {
        return group([
          ...openingTag,
          '>',
          indent([noHugSeparatorStart, group([body(), `</${node.name}`])]),
          canOmitSoftlineBeforeClosingTag(path, options) ? '' : softline,
          '>',
        ]);
      }

      if (isEmpty) {
        return group([...openingTag, '>', body(), `</${node.name}>`]);
      }

      return group([
        ...openingTag,
        '>',
        indent([noHugSeparatorStart, body()]),
        noHugSeparatorEnd,
        `</${node.name}>`,
      ]);

    default:
      console.error('Unimplemented node:', node);
      throw new Error(`Unimplemented ast type: ${node.type}`);
  }
};
