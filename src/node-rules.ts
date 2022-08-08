import flatten from "flat";
import { t } from "typy";
import NodeQuery from "./node-query";
import { getTargetNode, toString, handleRecursiveChild, isNode } from "./compiler/helpers";

const KEYWORDS = ["not", "in", "notIn", "gt", "gte", "lt", "lte"];

class NodeRules<T> {
  constructor(private rules: object) {}

  queryNodes(node: T, includingSelf = true): T[] {
    const matchingNodes = [];
    if (includingSelf && this.matchNode(node)) {
      matchingNodes.push(node);
    }
    handleRecursiveChild(node, (childNode) => {
      if (this.matchNode(childNode)) {
        matchingNodes.push(childNode);
      }
    })
    return matchingNodes;
  }

  matchNode(node: T): boolean {
    return Object.keys(flatten(this.rules, { safe: true })).every((multiKey) => {
      const keys = multiKey.split(".");
      const lastKey = keys[keys.length - 1];
      const actual = KEYWORDS.includes(lastKey)
        ? getTargetNode(node, keys.slice(0, -1).join("."))
        : getTargetNode(node, multiKey);
      let expected = t(this.rules, multiKey).safeObject;
      if (typeof expected === "string") {
        const found = expected.match(/{{(.*)}}/);
        if (found) {
          expected = getTargetNode(node, found[1]);
        }
      }
      if (Array.isArray(actual) && Array.isArray(expected)) {
        return actual.length === expected.length && expected.every((expectedItem, index) => this.matchValue(actual[index], expectedItem));
      }
      switch (lastKey) {
        case "not":
          return !this.matchValue(actual, expected);
        case "in":
          return expected.some((expectedItem: any) =>
            this.matchValue(actual, expectedItem)
          );
        case "notIn":
          return expected.every(
            (expectedItem: any) => !this.matchValue(actual, expectedItem)
          );
        case "gt":
          return (actual as any) > expected;
        case "gte":
          return (actual as any) >= expected;
        case "lt":
          return (actual as any) < expected;
        case "lte":
          return (actual as any) <= expected;
        default:
          return this.matchValue(actual, expected);
      }
    });
  };

  matchValue(actual: any, expected: any): boolean {
    if (actual === expected) return true;
    if (!actual && expected) return false;
    if (expected instanceof RegExp) {
      if (typeof actual === "string") return expected.test(actual);
      if (typeof actual === "number") return expected.test(actual.toString());
      return expected.test(NodeQuery<T>.getAdapter().getSource(actual));
    }
    if (typeof actual === "object") {
      // actual is a node
      const source = NodeQuery<T>.getAdapter().getSource(actual);
      return expected.toString() === source || `"${expected}"` === source;
    }
    return false;
  };
}

export default NodeRules;