# Worker `executionOrigin` Proposal

This proposal aims to make it easy for JavaScript libraries to instantiate web workers when hosted on a CDN (or any origin that does not match) by introducing a `executionOrigin` option to the `Worker` constructor:

```js
// https://web-app.example.com
import { calculation } from "https://cdn.example.com/lib/index.js";
console.log(await calculation());

// https://cdn.example.com/lib/index.js (served using CORS)
export async function calculation() {
  const worker = new Worker(import.meta.resolve("./worker.js"), {
    "type": "module",
    "executionOrigin": "from-calling-script"
  })
  …
  return …;
}

// https://cdn.example.com/lib/worker.js (served using CORS)
self.addEventListener("message", function (event) {
  // heavy work can go here without freezing the main thread
});
```

## Motivation

[Web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) are invaluable for implementing computationally intensive operations on the web, [without blocking the main thread](https://web.dev/off-main-thread/).

Unfortunately, writing portable web worker code [has always been
difficult](https://github.com/whatwg/html/issues/6911). This has gotten easier over time, due to new features like
[`import.meta.resolve(…)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta/resolve). However, it remains difficult to instantiate a web worker using a URL that does
not share its origin with the calling script — the "CDN problem". This is because the default
execution origin of the a worker comes from its URL rather than the script that
is instantiating it, which blocks the worker code due the [same-origin
policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).[^1]

[^1]:Note that this is in contrast with the `<script>` tag and imported scripts, which are run in the same origin as the calling script regardless of their URL. This relies on [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) as an alternative security mechanism. This proposal relies on CORS for security in exactly the same way.

```js
// Script on https://a.example.com
new Worker("https://b.example.com/worker.js"); // Throws `DOMException`
```

Nevertheless, it has long been possible to work around this by using a [worker
trampoline](https://github.com/lgarron/web-worker-compat#problem-7-web-workers-cannot-be-instantiated-cross-origin). That is to say, it is perfectly valid to instantiate a worker using the same origin as the calling script — this is already supported by browsers, and not a security issue. However, the worker trampoline is… not great:

- Although this trampoline is a combination of several straightforward web APIs, this combination is not obvious as a workaround to a web author encountering a `DOMException`. It's quite possible that most authors would assume it's impossible.
- The implementation has footguns (read: security issues) if not carefully implemented, since it requires constructing a JavaScript source string.
- It requires loading the worker from a `blob:` URL, which in turn requires adding `blob:` to `worker-src` for a page with CSP.
- The "obvious" implementation invites a memory leak in the form of an unrevoked object URL.

This is already sufficiently undesirable that most code authors don't ever prepare for their code to be hosted on a different origin than the page that uses it. But this presents a particular challenge when libraries hosted on CDNs, as these limitations are passed on to websites using these libraries and can ultimately result in a bad user experience when web workers fail to instantiate. (Note that it doesn't matter whether the worker instantiation happens from a script on the current page origin, or from a script on the CDN. The same problem applies in both cases.)

There are proposals that would provide flexible ergonomic APIs for working with web workers, each of which would also address this issue:

- [Blank `Worker`](https://github.com/whatwg/html/issues/6911)
- [Module expressions](https://github.com/tc39/proposal-module-expressions) (formerly "module blocks" in turn based on previous proposals)

Unfortunately, the scope of these proposals has prevented them from getting
close to shipping in any browsers. Therefore, this proposal focuses on the "CDN
use case" by adopting the simplest possible solution that has been discussed in
the blank `Worker` proposal discussion: a way to specify a single script to be run in a worker while inheriting the execution origin of its calling script.

## Proposal details

Add the `executionOrigin` option to the `Worker` constructor as follows (using TypeScript syntax):

```ts
declare class WorkerExecutionOriginPolyfill extends Worker {
  constructor(
    url: URL | string,
    options?: {
      // New option
      executionOrigin?: "from-url" | "from-calling-script";
      // Other options. Currently:
      type?: "classic" | "module";
      credentials?: "omit" | "same-origin" | "include";
    },
  );
}
```

When constructing a worker, if the `executionOrigin` option is present and set to `"from-calling-script"`:

- Set `QUOTED_URL` to a quoted JavaScript source form of a string containing the URL passed via `url`.[^2]
- If the `type` options is present and set to `"module"`:
  - Set `SCRIPT_SOURCE` to the following:

```js
import QUOTED_URL; // replace QUOTED_URL with the value from above
```

- Else:
  - Set `SCRIPT_SOURCE` to the following:

```js
importScripts(QUOTED_URL); // replace QUOTED_URL with the value from above
```

- Instead of instantiating the worker using the script content of `url`, set its script content to the value of `SCRIPT_SOURCE`.
- The script URL and the CSP `worker-src` of the `Worker` are both the string value of `url`.

Note that it's not necessary for a browser to literally follow these steps, as long as semantically equivalent steps are substituted.

[^2]: While a URL can't contain double quotes, note that it can contain single quotes, and a string value of `url` could contain single quotes. Expressed in JavaScript, safe ways to do this include `QUOTED_URL = JSON.stringify(url.toString());` or `QUOTED_URL = \`"${new URL(url)}"\`;`.

## Polyfill

See:

- [`WorkerExecutionOriginPolyfill.js`](./src/WorkerExecutionOriginPolyfill.js) for a small, fully working working polyfill.
  - Note: this polyfill uses a [worker trampoline](https://github.com/lgarron/web-worker-compat#problem-7-web-workers-cannot-be-instantiated-cross-origin), which has the drawbacks described in the "Motivation" section above. The main point of this proposal is for browsers to provide equivalent functionality without these drawbacks.
- [`WorkerExecutionOriginPolyfill.d.ts`](./src/WorkerExecutionOriginPolyfill.d.ts) for TypeScript definition file matchin the proposed new form of `Worker`.

## Comparison to other open proposals

- If the [blank `Worker` proposal](https://github.com/whatwg/html/issues/6911)
  is implemented, the `executionOrigin` option could possibly be changed to be
  implemented or defined on top of it (although the top-level script URL of the
  web worker may be different if `about:blankjs` is used). Either way, it should
  be possible to avoid any more security risk than the blank `Worker` proposal
  by using a thoughtful implementation.
  - Also note that the `executionOrigin` option retains the single-URL constructor, which avoids the potential of [injecting code into a worker that may not expect it](https://github.com/whatwg/html/issues/6911#issuecomment-896889807).
- [Module expressions](https://github.com/tc39/proposal-module-expressions) would probably make this proposal obsolete, but there is no inherent compatibility issue with supporting both.

## Tests

Run `make serve` in this repo and open `http://localhost:8080`.
