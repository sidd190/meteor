Package.describe({
  name: "socket-stream-client",
  version: '0.6.0',
  summary: "Provides the ClientStream abstraction used by ddp-client",
  documentation: "README.md"
});

Npm.depends({
  "faye-websocket": "0.11.4",
  "permessage-deflate2": "0.1.8",
  "lodash.isequal": "4.5.0",
  "lodash.once": "4.1.1"
});

Package.onUse(function(api) {
  api.use("ecmascript");
  api.use("modern-browsers");
  api.use("retry"); // TODO Try to remove this.

  api.mainModule("browser.js", "client", { lazy: true });

  api.addFiles("server.js", "server");
  api.mainModule("node.js", "server", { lazy: true });
});

Package.onTest(function(api) {
  api.use("ecmascript");
  api.use("tinytest");
  api.use("test-helpers");
  api.use("tracker");
  api.use("http");
  api.use("socket-stream-client");
  api.mainModule("client-tests.js", "client");
});
