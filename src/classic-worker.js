undeclaredVariablesAreOnlyAllowedInClassicScripts = " but it's classic";

self.addEventListener("message", function (e) {
  self.postMessage(e.data + undeclaredVariablesAreOnlyAllowedInClassicScripts);
});
