import type { AstPath, Doc, Options, Printer } from 'prettier';
import _doc from 'prettier/doc';
import type { AST } from '@wxml/parser';
import { type ParserOptions } from './utils';

// https://prettier.io/docs/en/plugins.html#optional-embed
type TextToDoc = (text: string, options: Options) => Promise<Doc>;

type Embed = Printer<AST.Node>['embed'];

const {
  builders: { group, indent, softline, hardline },
  utils: { stripTrailingHardline },
} = _doc;

async function wrapParserTryCatch(
  cb: TextToDoc,
  text: string,
  options: Options,
) {
  try {
    return await cb(text, options);
  } catch (e) {
    console.error('Failed to parse:', e);
    // If we couldn't parse the expression (ex: syntax error) and we throw here, Prettier fallback to `print` and we'll
    // get a totally useless error message (ex: unhandled node type). An undocumented way to work around this is to set
    // `PRETTIER_DEBUG=1`, but nobody know that exists / want to do that just to get useful error messages. So we force it on
    process.env.PRETTIER_DEBUG = 'true';
    throw e;
  }
}

export const embed = ((path: AstPath<AST.Node>, options) => {
  const parserOption = options as ParserOptions;
  return async (textToDoc, print) => {
    const node = path.getNode();
    if (!node || !node.type) return undefined;

    // Expression
    if (
      node.type === 'WXInterpolation' ||
      node.type === 'WXAttributeInterpolation'
    ) {
      let content: Doc;
      content = await wrapParserTryCatch(textToDoc, node.value, {
        ...parserOption,
        semi: false,
        singleQuote: true,
        parser: 'babel',
      });
      content = stripTrailingHardline(content);
      return ['{{', content, '}}'];
    }

    // WXScript
    if (node.type === 'WXScript' && !node.startTag.selfClosing) {
      const scriptContent = node.value || '';
      let formattedScript = await wrapParserTryCatch(textToDoc, scriptContent, {
        ...options,
        singleQuote: true,
        parser: 'babel',
        __embeddedInHtml: true,
      });

      formattedScript = stripTrailingHardline(formattedScript);
      const isEmpty = /^\s*$/.test(scriptContent);

      // print
      if (!node.attributes) {
        node.attributes = node.startTag.attributes;
      }
      const attributes = path.map(print, 'attributes');
      const openingTag = group([
        '<wxs',
        indent(group(attributes)),
        softline,
        '>',
      ]);

      return [
        openingTag,
        indent([isEmpty ? '' : hardline, formattedScript]),
        isEmpty ? '' : hardline,
        '</wxs>',
      ];
    }

    return undefined;
  };
}) satisfies Embed;
