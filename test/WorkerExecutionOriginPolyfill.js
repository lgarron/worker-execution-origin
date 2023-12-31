// This script is checked in as `.js` to demonstrate , but a `.ts` version is generated by TypeScript.

// When substituted by a browser-native alternative, this would:
// - Use `url.toString()` instead of a `blob:` URL to check against CSP `worker-src` (and therefore not count as using `blob:`).
//   - Note that both variants of the import syntax will also count it as a `script-src`.
// - Not leak an object URL.
function sameOriginURL(url, type) {
  const quotedImportURL = JSON.stringify(url.toString());
  const importSource =
    type === "module"
      ? `import ${quotedImportURL};`
      : `importScripts(${quotedImportURL});`;
  const blob = new Blob([importSource], {
    type: "text/javascript",
  });
  return URL.createObjectURL(blob);
}

export class WorkerExecutionOriginPolyfill extends Worker {
  constructor(
    url,
    options,
  ) {
    if (options?.executionOrigin === "from-calling-script") {
      url = sameOriginURL(url, options?.type);
    }
    super(url, options);
  }
}
