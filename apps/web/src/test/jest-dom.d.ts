import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

// Augment the vitest instance resolved from this workspace. In a pnpm monorepo
// the augmentation shipped by jest-dom can land on a different vitest copy.
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}

