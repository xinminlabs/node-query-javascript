import { Node } from "typescript";
import NodeQuery from "../src/node-query";
import SyntaxError from "../src/syntax-error";
import { parseCode } from "./test-helper";

describe("NodeQuery", () => {
  describe("#queryNodes", () => {
    const node = parseCode(`
      interface User {
        name: string;
        id: number;
        active: boolean;
      }

      class UserAccount {
        name: string;
        id: number;
        active: boolean;

        constructor(name: string, id: number, active: boolean) {
          this.name = name;
          this.id = id;
          this.active = active;
        }
      }

      const user: User = new UserAccount("Murphy", 1, true);
    `);

    describe("nql", () => {
      it("queries nodes", () => {
        const nodeQuery = new NodeQuery<Node>(
          ".ClassDeclaration .PropertyDeclaration",
          { adapter: "typescript" },
        );
        expect(nodeQuery.queryNodes(node).length).toEqual(3);
      });

      it("raises SyntaxError", () => {
        expect(() => {
          new NodeQuery<Node>(".ClassDeclaration .", { adapter: "typescript" });
        }).toThrow(SyntaxError);
      });
    });

    describe("rules", () => {
      it("queries nodes", () => {
        const nodeQuery = new NodeQuery<Node>(
          {
            nodeType: "PropertyDeclaration",
            type: { nodeType: "StringKeyword" },
          },
          { adapter: "typescript" },
        );
        expect(nodeQuery.queryNodes(node).length).toEqual(1);
      });
    });
  });

  describe("#matchNode", () => {
    const node = parseCode(`
      class UserAccount {
        name: string;
        id: number;
        active: boolean;

        constructor(name: string, id: number, active: boolean) {
          this.name = name;
          this.id = id;
          this.active = active;
        }
      }
    `).statements[0];

    describe("nql", () => {
      it("match node", () => {
        const nodeQuery = new NodeQuery<Node>(".ClassDeclaration", {
          adapter: "typescript",
        });
        expect(nodeQuery.matchNode(node)).toBeTruthy();
      });
    });

    describe("rules", () => {
      it("match node", () => {
        const nodeQuery = new NodeQuery<Node>(
          { nodeType: "ClassDeclaration" },
          { adapter: "typescript" },
        );
        expect(nodeQuery.matchNode(node)).toBeTruthy();
      });
    });
  });
});
