import { doc, type Printer } from 'prettier'

const NodeType = {
  Program: 'Program',
  WXElement: 'WXElement',
  WXScript: 'WXScript',
  WXText: 'WXText',
  WXAttributeInterpolation: 'WXAttributeInterpolation',
  WXInterpolation: 'WXInterpolation',
  WXComment: 'WXComment',
  WXAttribute: 'WXAttribute',
  WXStartTag: 'WXStartTag',
  WXEndTag: 'WXEndTag',
} as const

const {
  group, // (d.1) Prettier 最基本的方法，会根据 printWidth 等配置项自动换行（或不换行）
  join,
  indent,
  ifBreak,
  line,
  softline,
  hardline, // (d.2) 换行
} = doc.builders

const JS_OPTIONS = {
  semi: false,
  singleQuote: true,
  __embeddedInHtml: true,
}

export const printer: Printer = {
  print(path, options, print) {
    const node = path.getNode()
    console.log('print', node)
    if (node.type === NodeType.Program) {
      return path.map(print, 'body')
    } else if (node.type === NodeType.WXElement) {
      if (node.startTag.selfClosing) {
        return path.call(print, 'startTag')
      }
      return group([
        path.call(print, 'startTag'),
        indent([ifBreak('', line), path.map(print, 'children')]),
        line,
        path.call(print, 'endTag'),
      ])
    } else if (node.type === NodeType.WXStartTag) {
      const { name, selfClosing, attributes } = node
      if (attributes.length === 0) {
        return selfClosing ? `<${name}/>` : `<${name}>`
      }
      if (selfClosing) {
        return group([`<${name}`, indent([line, join(line, path.map(print, 'attributes'))]), line, '/>'])
      }
      return group([`<${name}`, indent([line, join(line, path.map(print, 'attributes'))]), softline, '>'])
    } else if (node.type === NodeType.WXEndTag) {
      return [`</${node.name}>`]
    } else if (node.type === NodeType.WXAttribute) {
      console.log('WXAttribute', node)
      const { key, value, children } = node
      if (Array.isArray(children) && children.length > 0) {
        return [`${key}="`, group(path.map(print, 'children')), '"']
      }
      if (value === null) {
        return `${key}`
      }
      return group([`${key}`, `="${value}"`])
    } else if (node.type === NodeType.WXText) {
      return (node.value || '').trim()
    } else if (node.type === NodeType.WXComment) {
      return [`<!-- ${node.value} -->`]
    } else if (node.type === NodeType.WXAttributeInterpolation) {
      console.log('WXAttributeInterpolation', node)
      return ['{{ ', path.call(print, 'value'), ' }}']
    } else if (node.type === NodeType.WXInterpolation) {
      console.log('WXInterpolation', node)
      return ['{{ ', path.call(print, 'value'), ' }}']
    } else if (node.type === NodeType.WXScript) {
      if (node.startTag.selfClosing) {
        return group([hardline, path.call(print, 'startTag'), hardline])
      }
    }
    throw new Error(`Unknown node type: ${node.type}`)
  },
  embed(path, options) {
    const node = path.getNode()
    const toStringOptions = {
      printWidth: options.printWidth || 120,
      tabWidth: options.tabWidth || 2,
      useTabs: options.useTabs || false,
    }

    // 返回 null，则交给 print(c.1) 继续执行
    if (!node || !node.type) return null

    if (node.type === NodeType.WXAttributeInterpolation || node.type === NodeType.WXInterpolation) {
      // TIPS: 这里js表达式的格式化会换行，需要去掉res末尾的换行符
      return async textToDoc => {
        const jsExp = await textToDoc(node.value, { ...options, ...JS_OPTIONS, parser: 'babel' })
        const { formatted } = doc.printer.printDocToString(jsExp, toStringOptions)
        return group(['{{ ', formatted, ' }}'])
      }
    } else if (node.type === NodeType.WXScript) {
      if (!node.startTag.selfClosing) {
        return async (textToDoc, print) => {
          const jsdoc = await textToDoc(node.value, { ...options, ...JS_OPTIONS, parser: 'babel' })
          const { formatted } = doc.printer.printDocToString(indent(jsdoc), toStringOptions)
          return group([
            hardline,
            path.call(print, 'startTag'),
            indent([line, formatted]),
            line,
            path.call(print, 'endTag'),
            hardline,
          ])
        }
      }
    }
    return null
  },
}
