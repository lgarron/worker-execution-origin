const awaitIsOnlyAllowedInModuleScripts = await " but it's a module";

self.addEventListener("message", function (e) {
  self.postMessage(e.data + awaitIsOnlyAllowedInModuleScripts);
});
