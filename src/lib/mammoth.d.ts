// The package's prebuilt browser bundle - self-contained, so it needs no
// node polyfills. Only the two calls this app uses are typed.
declare module 'mammoth/mammoth.browser.min.js' {
  interface Result {
    value: string
    messages: { type: string; message: string }[]
  }
  interface Input {
    arrayBuffer: ArrayBuffer
  }
  export function convertToHtml(input: Input, options?: unknown): Promise<Result>
  export function extractRawText(input: Input): Promise<Result>
  const _default: {
    convertToHtml: typeof convertToHtml
    extractRawText: typeof extractRawText
  }
  export default _default
}
