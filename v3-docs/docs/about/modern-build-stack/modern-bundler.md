# Modern Bundler

Meteor handles watching and linking all project files into the final bundle. While we'd like to offload more of this to modern bundlers, we're still focused on keeping what's left in the Meteor context as fast as possible.

Integration with a modern bundler is in progress for Meteor 3.4. Meanwhile, we've optimized existing processes for better performance.

## Modern builds

Starting with Meteor 3.3, new apps skip `web.browser.legacy` and `web.cordova` by default in development mode (unless developing for native). This results on getting a faster build process on development mode.

For existing apps, enable this by adding to `package.json`:

```json
"meteor": {
  "modernWebArchsOnly": true
}
```

This works like using `--exclude-archs web.browser.legacy,web.cordova` with `meteor run`.

## Modern watcher

Starting with Meteor 3.3, development mode uses a modern, cross-platform watcher: [`@parcel/watcher`](https://github.com/parcel-bundler/watcher). It responds quickly to file changes using native file watching. Symbolic link changes and all traversed files are supported via polling.

If the watcher doesn’t work properly, such as when using WSL with host, a volume, or a remote setup, switch fully to the polling strategy.

To enable polling, run your Meteor app with:

```shell
# enable polling
METEOR_WATCH_FORCE_POLLING=true meteor run

# set polling interval (in ms)
METEOR_WATCH_POLLING_INTERVAL_MS=1000 METEOR_WATCH_FORCE_POLLING=true meteor run
```

> Polling uses more CPU and RAM, but it's the most reliable option in some environments.
