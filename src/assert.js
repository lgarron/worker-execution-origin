export let passedAllTests = true;

let i = 0;
function showResult(consoleFn, resultMessage) {
  consoleFn(resultMessage);
  const li = globalThis.document?.querySelector("#results").children[i++];
  if (li) {
    li.textContent = resultMessage;
  }
}

export function assertString(observed, expected) {
  if (observed !== expected) {
    showResult(console.error, `✅ Expected \"${expected}\", observed \"${observed}\"`)
  }
  showResult(console.log, `✅ ${expected}`)
}

export async function assertException(fn, expectedConstructor) {
  try {
    const value = await fn();
    showResult(console.error, `❌ Expected a \`${expectedConstructor.name}\` error, saw a returned value: ${value}`);
    passedAllTests = false;
  } catch (e) {
    if (! (e instanceof expectedConstructor)) {
      showResult(console.error, `❌ Expected a \`${expectedConstructor.name}\` error, observed exception: ${e}`);
      passedAllTests = false;
    }
    showResult(console.log, `✅ Exception matches expected constructor: ${expectedConstructor.name}`);
  }
}

export function showPassedAllTests() {
  console.log("Passed all tests?", passedAllTests);
  const span = globalThis.document?.querySelector("#passed-all-tests");
  if (span) {
    span.textContent = passedAllTests ? "✅ YES" : "❌ NO";
  }
}
