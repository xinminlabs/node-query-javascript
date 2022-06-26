import dedent from "dedent";
import { ClassDeclaration } from "typescript";
import TypescriptAdapter from "../src/typescript-adapter";
import { parseCode } from "./test-helper";

describe("TypescriptAdapter", () => {
  const adapter = new TypescriptAdapter();
  const code = dedent`
    class UserAccount {
      name: string;
      id: number;
      active: boolean;
    }
  `;
  const node = parseCode(code).statements[0];

  it("getNodeType", () => {
    expect(adapter.getNodeType(node)).toEqual("ClassDeclaration");
  });

  it("getSource", () => {
    expect(adapter.getSource(node)).toEqual(code);
  });

  it("getChildren", () => {
    expect(adapter.getChildren(node).length).toEqual(4);
  });

  it("getSiblings", () => {
    expect(
      adapter.getSiblings((node as ClassDeclaration).members[0]).length
    ).toEqual(2);
  });
});
