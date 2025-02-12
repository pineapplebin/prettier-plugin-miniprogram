import parser, { type AST } from '@wxml/parser';
import {
  type Parser,
  type Plugin,
  type Printer,
  type RequiredOptions,
  type SupportLanguage,
  type SupportOptions,
} from 'prettier';
import { print } from './print';
import { embed } from './embed';
import * as prettierPluginBabel from 'prettier/plugins/babel';

const babelParser = prettierPluginBabel.parsers.babel;

export const plugin: Plugin = {
  languages: [
    {
      name: 'wxml',
      parsers: ['wxml'],
      extensions: ['.wxml'],
      vscodeLanguageIds: ['wxml'],
    },
  ],
  parsers: {
    wxml: {
      parse: (text) => parser.parse(text),
      astFormat: 'wxml-ast',
      locStart: (node) => node.start,
      locEnd: (node) => node.end,
    },
    /**
     * 兼容小程序的插值表达式
     *
     * data="{{...data}}" 或 data="{{a: 1}}"
     */
    'wxml-interpolation': {
      ...babelParser,
      preprocess(text) {
        return `<>{${text}\n}</>`;
      },
      parse(text, opts) {
        const ast = babelParser.parse(text, opts);
        return {
          ...ast,
          program: ast.program.body[0].expression.children[0],
        };
      },
    },
  },
  printers: {
    'wxml-ast': {
      print,
      embed,
    },
  },
};

export const languages: SupportLanguage[] | undefined = plugin.languages;
export const parsers: { [parserName: string]: Parser } | undefined =
  plugin.parsers;
export const printers: { [astFormat: string]: Printer } | undefined =
  plugin.printers;
export const options: SupportOptions | undefined = plugin.options;
export const defaultOptions: Partial<RequiredOptions> | undefined =
  plugin.defaultOptions;

export default plugin;

export type { AST as MiniprogramAST };
