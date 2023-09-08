undeclaredVariablesAreOnlyAllowedInClassicScripts = " but it's classic";

self.addEventListener("message", function (event) {
  self.postMessage(event.data + undeclaredVariablesAreOnlyAllowedInClassicScripts);
});
