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
