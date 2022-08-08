import Adapter from "./adapter";
import SyntaxError from "./syntax-error";
import TypescriptAdapter from "./typescript-adapter";
import NodeRules from "./node-rules";
const { parser } = require("./parser");
const { ExpressionList } = require("./compiler");

class NodeQuery<T> {
  private expression?: InstanceType<typeof ExpressionList>;
  private rules?: NodeRules<any>;

  private static adapter?: Adapter<any>;

  /**
   * Configure NodeQuery
   * @static
   * @param options {Object}
   * @param options.adapter {Adapter} - adapter, default is TypescriptAdapter
   */
  static configure(options: { adapter: Adapter<any> }) {
    this.adapter = options.adapter;
  }

  /**
   * Get the adapter.
   * @returns {Aapter} the adapter
   */
  static getAdapter(): Adapter<any> {
    if (!this.adapter) {
      this.adapter = new TypescriptAdapter();
    }
    return this.adapter!;
  }

  /**
   * Create a NodeQuery
   * @param nqlOrRules {string | object} Node query language string or node rules
   */
  constructor(nqlOrRules: string | object) {
    if (typeof nqlOrRules === "string") {
      try {
        parser.parse(nqlOrRules);
        this.expression = parser.yy.result;
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.startsWith("Lexical error") ||
            error.message.startsWith("Parse error"))
        ) {
          throw new SyntaxError(error.message.split("\n").slice(0, 3).join("\n"));
        } else {
          throw error;
        }
      }
    } else {
      this.rules = new NodeRules(nqlOrRules);
    }
  }

  /**
   * check if the node matches the nql or rules.
   * @param node {T} ast node
   * @returns {boolean} if the node matches the nql or rules.
   */
  matchNode(node: T): boolean {
    if (this.expression) {
      return this.expression.matchNode(node);
    } else if (this.rules) {
      return this.rules.matchNode(node);
    } else {
      return false;
    }
  }

  /**
   * Query matching nodes.
   * @param node {T} ast node
   * @param includingSelf {boolean} if check the node itself
   * @returns {T[]} matching ast nodes
   */
  queryNodes(node: T, includingSelf = true): T[] {
    if (this.expression) {
      return this.expression.queryNodes(node, includingSelf);
    } else if (this.rules) {
      return this.rules.queryNodes(node, includingSelf);
    } else {
      return [];
    }
  }
}

export default NodeQuery;
