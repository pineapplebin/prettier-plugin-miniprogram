import parser from '@wxml/parser'
import {
  type Parser,
  type Plugin,
  type Printer,
  type RequiredOptions,
  type SupportLanguage,
  type SupportOptions,
} from 'prettier'
import { printer } from './printer'

// const { parsers: htmlParsers, printers: htmlPrinters } = htmlPlugin as any
/**
 * wxml prettier 插件
 * wxml 使用 prettier 内置的 html 解析器，wxml 内的 wxs 标签会被解析为 html 的 script 标签
 */
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
      parse: text => parser.parse(text),
      astFormat: 'wxml-ast',
      locStart: node => node.start,
      locEnd: node => node.end,
    },
  },
  printers: {
    'wxml-ast': printer,
  },
  // parsers: {
  //   wxml: {
  //     ...htmlParsers.html,
  //     astFormat: 'wxml-ast',
  //     // parse(text, options) {
  //     //   const ast = htmlParsers.html.parse(text, options)
  //     //   // 遍历 AST，找到 <tjs> 标签并处理
  //     //   traverseAst(ast, node => {
  //     //     if (node.type === 'element' && node.name === 'wxs') {
  //     //       const content = getTextContent(node).trim()
  //     //       console.log('content', node, content)
  //     //       if (content) {
  //     //         const temp = htmlParsers.html.parse(`<script>${content}</script>`, options)
  //     //         node.wxsContent = content
  //     //         node.children = temp.children[0].children
  //     //       }
  //     //     }
  //     //   })
  //     //   return ast
  //     // },
  //   },
  // },
  // printers: {
  //   'wxml-ast': {
  //     ...htmlPrinters.html,
  //     preprocess(ast, options) {
  //       htmlPrinters.html.preprocess(ast, options)
  //       ast.walk(node => {
  //         if (node.type === 'element' && node.name === 'wxs') {
  //           const content = getTextContent(node).trim()
  //           console.log('content', node, content)
  //           if (content) {
  //             const temp = htmlParsers.html.parse(`<script>${content}</script>`, options)
  //             node.wxsContent = content
  //             node.children = temp.children[0].children
  //           }
  //         }
  //       })
  //     },
  //     print(path, options, print) {
  //       return htmlPrinters.html.print(path, options, print)
  //     },
  //     embed(path, options) {
  //       const node = path.getNode()
  //       if (node.type === 'element' && node.name === 'wxs') {
  //         if (node.wxsContent) {
  //           return async (textToDoc: any) => {
  //             const res = await textToDoc(node.wxsContent, {
  //               ...options,
  //               parser: 'babel',
  //             })
  //             const { formatted } = doc.printer.printDocToString(res, {
  //               printWidth: options.printWidth || 120,
  //               tabWidth: options.tabWidth || 2,
  //             })
  //             // TODO: 需要补充标签的属性
  //             return doc.builders.group([
  //               doc.builders.hardline,
  //               '<wxs',
  //               doc.builders.group(node.attrs.map((attr: any) => ` ${attr.name}="${attr.value}"`)),
  //               '>',
  //               doc.builders.hardline,
  //               formatted,
  //               doc.builders.hardline,
  //               '</wxs>',
  //               doc.builders.hardline,
  //             ])
  //           }
  //         } else {
  //           // TODO: 需要补充标签的属性
  //           return doc.builders.group([
  //             doc.builders.hardline,
  //             '<wxs',
  //             doc.builders.group(node.attrs.map((attr: any) => ` ${attr.name}="${attr.value}"`)),
  //             '/>',
  //             doc.builders.hardline,
  //           ])
  //         }
  //       }
  //       return htmlPrinters.html.embed(path, options)
  //     },
  //   },
  // },
}

/** The languages that are picked up by prettier. */
export const languages: SupportLanguage[] | undefined = plugin.languages
/** The parsers object that is picked up by prettier. */
export const parsers: { [parserName: string]: Parser } | undefined = plugin.parsers
/** The printers object that is picked up by prettier. */
export const printers: { [astFormat: string]: Printer } | undefined = plugin.printers
/** The options object that is picked up by prettier. */
export const options: SupportOptions | undefined = plugin.options
/** The default options object that is picked up by prettier. */
export const defaultOptions: Partial<RequiredOptions> | undefined = plugin.defaultOptions

export default plugin
