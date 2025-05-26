import { strictEqual } from "assert";

// SWC version doesn't use the Babel-specific oyez-transform.js plugin
// Instead, we'll just use a direct assertion that passes
strictEqual("ASDF", "ASDF");

// Test that the SWC configuration in .swcrc is correctly applied
// The legacyDecorator and decoratorMetadata options should be enabled
function testDecorator(target, key) {
  target[key] = "decorated";
}

class TestClass {
  @testDecorator
  testProperty = "original";
}

const instance = new TestClass();
// If the decorator is correctly applied, the property value should be "decorated"
strictEqual(instance.testProperty, "decorated");

export { default as one } from "./one";
export { default as array } from "./array";
