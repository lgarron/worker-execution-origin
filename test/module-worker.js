const awaitIsOnlyAllowedInModuleScripts = await " but it's a module";

self.addEventListener("message", function (event) {
  self.postMessage(event.data + awaitIsOnlyAllowedInModuleScripts);
});
