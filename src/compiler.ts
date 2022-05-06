import ts = require('typescript');

export namespace Compiler {
  interface ExpressionParameters {
    selector: Selector | null;
    rest: Expression | null;
    relationship: string | null;
  }

  export class Expression {
    private selector: Selector | null;
    private rest: Expression | null;
    private relationship: string | null;

    constructor({ selector, rest, relationship }: ExpressionParameters) {
      this.selector = selector;
      this.rest = rest;
      this.relationship = relationship;
    }

    match(node: ts.Node) {
      return this.queryNodes(node).length !== 0;
    }

    queryNodes(node: ts.Node, descendantMatch: boolean = true): ts.Node[] {
      if (this.relationship) {
        return this.findNodesByRelationship(node);
      }

      const matchingNodes = this.findNodesWithoutRelationship(node, descendantMatch);
      if (!this.rest) {
        return matchingNodes;
      }
      return matchingNodes.flatMap(matchingNode => this.findNodesByRest(matchingNode, descendantMatch));
    }

    toString(): string {
      const result = [];
      if (this.selector) {
        result.push(this.selector.toString());
      }
      if (this.rest) {
        switch (this.relationship) {
          case 'child':
            result.push(`> ${this.rest.toString()}`);
            break;
          default:
            result.push(this.rest.toString());
            break;
        }
      }
      return result.join(' ');
    }

    private findNodesByRelationship(node: ts.Node): ts.Node[] {
      switch (this.relationship) {
        case 'child':
          let nodes: ts.Node[] = [];
          node.forEachChild(childNode => {
            nodes = nodes.concat(this.findNodesByRest(childNode))
          });
          return nodes;
        default:
          return [];
      }
    }

    private findNodesByRest(node: ts.Node, descendantMatch: boolean = false): ts.Node[] {
      if (!this.rest) {
        return [];
      }
      return this.rest.queryNodes(node, descendantMatch)
    }

    private findNodesWithoutRelationship(node: ts.Node | ts.Node[], descendantMatch: boolean = true): ts.Node[] {
      if (Array.isArray(node)) {
        return node.flatMap((eachNode) => {
          return this.findNodesWithoutRelationship(eachNode, descendantMatch)
        });
      }

      if (!this.selector) {
        return [node];
      }

      const nodes = [];
      if (this.selector.match(node)) {
        nodes.push(node);
      }
      if (descendantMatch) {
        this.recusriveEachChild(node, (childNode) => {
          if (this.selector && this.selector.match(childNode)) {
            nodes.push(childNode);
          }
        });
      }
      return nodes;
    }

    private recusriveEachChild(node: ts.Node, cb: (childNode: ts.Node) => void): void {
      node.forEachChild(childNode => {
        cb(childNode);
        this.recusriveEachChild(childNode, cb);
      });
    }
  }

  interface SelectorParameters {
    nodeType: string;
    attributeList: AttributeList | null;
  }

  export class Selector {
    private nodeType: string;
    private attributeList: AttributeList | null;

    constructor({ nodeType, attributeList }: SelectorParameters) {
      this.nodeType = nodeType;
      this.attributeList = attributeList;
    }

    match(node: ts.Node): boolean {
      return this.nodeType == ts.SyntaxKind[node.kind] &&
        (!this.attributeList || this.attributeList.match(node));
    }

    toString(): string {
      const result = [];
      if (this.nodeType) {
        result.push(`.${this.nodeType}`);
      }
      if (this.attributeList) {
        result.push(this.attributeList.toString());
      }
      return result.join('');
    }
  }

  interface AttributeListParameters {
    attribute: Attribute;
    rest: AttributeList | null;
  }

  export class AttributeList {
    private attribute: Attribute;
    private rest: AttributeList | null;

    constructor({ attribute, rest }: AttributeListParameters) {
      this.attribute = attribute;
      this.rest = rest;
    }

    match(node: ts.Node): boolean {
      return this.attribute.match(node) && (!this.rest || this.rest.match(node));
    }

    toString(): string {
      if (this.rest) {
        return `[${this.attribute}]${this.rest.toString()}`
      }
      return `[${this.attribute}]`;
    }
  }

  interface AttributeParameters {
    key: string;
    value: Value;
    operator: string;
  }

  export class Attribute {
    private key: string;
    private value: Value;
    private operator: string;

    constructor({ key, value, operator }: AttributeParameters) {
      this.key = key;
      this.value = value;
      this.operator = operator;
    }

    match(node: ts.Node): boolean {
      return this.value.match(this.getTargetNode(node), this.operator);
    }

    toString(): string {
      return `${this.key}=${this.value}`;
    }

    getTargetNode(node: ts.Node): ts.Node {
      let result = node as any;
      this.key.split('.').forEach(key => {
        result = result[key]
      })
      return result;
    }
  }

  export class Value {
    private value: string

    constructor(value: string) {
      this.value = value;
    }

    match(node: ts.Node, operator: string): boolean {
      switch (operator) {
        case '!=':
          return this.actualValue(node) != this.expectedValue();
        default:
          return this.actualValue(node) == this.expectedValue();
      }
    }

    actualValue(node: ts.Node | string): string {
      if (typeof node === 'string') {
        return `${node}`;
      }
      return node.getFullText().trim();
    }

    expectedValue(): string {
      return this.value.toString();
    }

    toString(): string {
      return this.value;
    }
  }
}

module.exports = Compiler;