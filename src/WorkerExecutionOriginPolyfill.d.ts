declare class WorkerExecutionOriginPolyfill extends Worker {
  constructor(
    url: URL | string,
    options?: {
      type?: "classic" | "module";
      credentials?: "omit" | "same-origin" | "include";
      executionOrigin?: "url-origin" | "inherit-origin";
    },
  );
}
