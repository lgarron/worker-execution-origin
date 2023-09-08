import { WorkerExecutionOriginPolyfill } from "./WorkerExecutionOriginPolyfill.js";
import { assertException, assertString, passedAllTests, showPassedAllTests } from "./assert.js";

function testWorker(message, workerArguments) {
  return new Promise((resolve, reject) => {
    try {
      const worker = new WorkerExecutionOriginPolyfill(...workerArguments);
      worker.addEventListener("message", (e) => resolve(e.data));
      worker.addEventListener("error", (e) => reject(e));
      worker.postMessage(message);
    } catch (e) {
      reject(e);
    }
  });
}

// Same origin
assertString(await testWorker("same origin", [
  import.meta.resolve("./classic-worker.js"),
  {}
]), "same origin but it's classic");

assertString(await testWorker("same origin", [
  import.meta.resolve("./module-worker.js"),
  { type: "module" }
]), "same origin but it's a module");

// Cross-origin without inheriting origin
await assertException(async () => testWorker("cross origin", [
  "http://cross-origin.localhost:8080/classic-worker.js",
  {}
]), DOMException);
await assertException(async () => testWorker("cross origin", [
  "http://cross-origin.localhost:8080/module-worker.js",
  { type: "module" }
]), DOMException);

// Cross-origin, inheriting origin
assertString(await testWorker("cross origin", [
  "http://cross-origin.localhost:8080/classic-worker.js",
  { executionOrigin: "from-calling-script" }
]), "cross origin but it's classic");

assertString(await testWorker("cross origin", [
  "http://cross-origin.localhost:8080/module-worker.js",
  { type: "module", executionOrigin: "from-calling-script" }
]), "cross origin but it's a module");

// Cross-origin, inheriting origin but with mismatched `type`
await assertException(async () => testWorker("cross origin", [
  "http://cross-origin.localhost:8080/classic-worker.js",
  { type: "module", executionOrigin: "from-calling-script"  }
]), ErrorEvent);
await assertException(async () => testWorker("cross origin", [
  "http://cross-origin.localhost:8080/module-worker.js",
  { executionOrigin: "from-calling-script" }
]), ErrorEvent);

showPassedAllTests();
