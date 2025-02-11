declare module '@wxml/parser' {
  declare namespace AST {
    interface Position {
      line: number;
      column: number;
    }

    interface Location {
      start: Position;
      end: Position;
    }

    interface BaseNode {
      type: string;
      loc: Location;
      start: number;
      end: number;
      range: [number, number];
    }

    interface Program extends BaseNode {
      type: 'Program';
      body: Node[];
    }

    interface WXComment extends BaseNode {
      type: 'WXComment';
      value: string;
    }

    interface WXText extends BaseNode {
      type: 'WXText';
      value: string;
    }

    interface WXAttribute extends BaseNode {
      type: 'WXAttribute';
      key: string;
      quote: string | null;
      value: string | null;
      rawValue: string | null;
      children: (WXText | WXAttributeInterpolation)[] | null;
      interpolations: WXAttributeInterpolation[];
    }

    interface WXAttributeInterpolation extends BaseNode {
      type: 'WXAttributeInterpolation';
      value: string;
      rawValue: string;
    }

    interface WXStartTag extends BaseNode {
      type: 'WXStartTag';
      name: string;
      selfClosing: boolean;
      attributes: WXAttribute[];
    }

    interface WXEndTag extends BaseNode {
      type: 'WXEndTag';
      name: string;
    }

    interface WXInterpolation extends BaseNode {
      type: 'WXInterpolation';
      value: string;
      rawValue: string;
    }

    interface BaseTagLike extends BaseNode {
      name: string;
      startTag: WXStartTag;
      endTag?: WXEndTag;
      attributes?: WXAttribute[];
    }

    interface WXElement extends BaseTagLike {
      type: 'WXElement';
      children: (WXComment | WXText | WXElement | WXInterpolation)[];
    }

    interface WXScript extends BaseTagLike {
      type: 'WXScript';
      value: string | null;
    }

    type Node =
      | Program
      | WXComment
      | WXText
      | WXStartTag
      | WXEndTag
      | WXAttribute
      | WXAttributeInterpolation
      | WXInterpolation
      | WXElement
      | WXScript;
    type NodeTypes = Node['type'];
  }

  interface Parser {
    parse(text: string): any;
  }

  const parser: Parser;
  export default parser;

  export { AST, parser };
}
