declare module 'virtual:question-index' {
  /**
   * `[id, unitId]` za svako pitanje, grupirano po temi. Gradi ga
   * `questionIndexPlugin` u vite.config.ts iz src/data/questions/*.json.
   */
  const questionIndex: Record<string, [string, string][]>;
  export default questionIndex;
}
