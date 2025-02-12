import type { AstPath, Doc, Options, Printer } from 'prettier';
import _doc from 'prettier/doc';
import type { AST } from '@wxml/parser';
import { type ParserOptions } from './utils';

// https://prettier.io/docs/en/plugins.html#optional-embed
type TextToDoc = (text: string, options: Options) => Promise<Doc>;

type Embed = Printer<AST.Node>['embed'];

const {
  printer: { printDocToString },
  builders: { group, indent, softline, hardline },
  utils: { stripTrailingHardline },
} = _doc;

async function wrapParserTryCatch(
  cb: TextToDoc,
  text: string,
  options: Options,
): Promise<Doc> {
  try {
    let content = text;
    if (options.parser === 'wxml-interpolation' && /\.\.\./.test(content)) {
      content = `{${content}}`;
    }
    const doc = await cb(content, options);
    return doc;
  } catch (e1) {
    try {
      if (options.parser === 'wxml-interpolation') {
        const doc = await cb(`{${text}}`, options);
        return doc;
      } else {
        throw e1;
      }
    } catch (e2) {
      // real error
      console.error('Failed to parse:', e2);
      // If we couldn't parse the expression (ex: syntax error) and we throw here, Prettier fallback to `print` and we'll
      // get a totally useless error message (ex: unhandled node type). An undocumented way to work around this is to set
      // `PRETTIER_DEBUG=1`, but nobody know that exists / want to do that just to get useful error messages. So we force it on
      process.env.PRETTIER_DEBUG = 'true';
      throw e2;
    }
  }
}

export const embed = ((path: AstPath<AST.Node>, options) => {
  const parserOption = options as ParserOptions;
  return async (textToDoc, print) => {
    const node = path.getNode();
    if (!node || !node.type) return undefined;

    // Interpolation
    if (
      node.type === 'WXInterpolation' ||
      node.type === 'WXAttributeInterpolation'
    ) {
      console.log('node.value:', node.value);
      let content = await wrapParserTryCatch(textToDoc, node.value, {
        ...parserOption,
        parser: 'wxml-interpolation',
        semi: false,
        singleQuote: true,
        bracketSpacing: false,
        __embeddedInHtml: true,
      });
      console.log(content);
      content = stripTrailingHardline(content);
      // 保留在一行
      const { formatted: contentString } = printDocToString(
        content,
        options as Required<Options>,
      );
      const needExtraBracket = !/^{{.*}}$/.test(contentString);
      return [
        needExtraBracket ? '{' : '',
        contentString,
        needExtraBracket ? '}' : '',
      ];
    }

    // WXScript
    if (node.type === 'WXScript' && !node.startTag.selfClosing) {
      const scriptContent = node.value || '';
      let formattedScript = await wrapParserTryCatch(textToDoc, scriptContent, {
        ...options,
        parser: 'babel',
        singleQuote: true,
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
