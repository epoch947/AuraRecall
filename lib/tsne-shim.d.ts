declare module 'tsne-js' {
  interface TSNEOptions {
    epsilon?: number
    perplexity?: number
    dim?: number
  }
  class TSNE {
    constructor(opts?: TSNEOptions)
    init(opts: { data: number[][]; type: 'dense' | 'sparse' }): void
    run(): void
    rerun(): void
    getOutput(): number[][]
    getOutputScaled(): number[][]
  }
  export = TSNE
}
