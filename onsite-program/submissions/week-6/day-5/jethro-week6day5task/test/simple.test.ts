import { expect } from "chai";

describe("Simple Test", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).to.equal(2);
  });

  it("should work with async", async () => {
    const result = await Promise.resolve(42);
    expect(result).to.equal(42);
  });
});
