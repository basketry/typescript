declare global {
  namespace jest {
    interface Matchers<R> {
      toContainAst(expected: string): R | Promise<R>;
    }
  }
}
export {};
