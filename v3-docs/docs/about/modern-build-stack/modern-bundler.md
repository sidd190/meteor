# Modern Bundler

:::info
Starting with Meteor 3.3
:::

Meteor handles watching and linking all project files into the final bundle. While we'd like to offload more of this to modern bundlers, we're still focused on keeping what's left in the Meteor context as fast as possible.

Integration with a modern bundler is in progress for Meteor 3.4. Meanwhile, we've optimized existing processes for better performance.

## Modern builds

Starting with Meteor 3.3, new apps skip `web.browser.legacy` and `web.cordova` by default in development mode (unless developing for native). This results on getting a faster build process on development mode.

For existing apps, enable this by adding to `package.json`:

```json
"meteor": {
  "modern": true
}
```

This works like using `--exclude-archs web.browser.legacy,web.cordova` with `meteor run`.

By default, `"modern": true` enables all build stack upgrades: new transpiler, web arch-only compilation, watcher and more. To opt out of web arch-only compilation, set `"webArchOnly": false` in your `package.json`.

```json
"meteor": {
  "modern": {
    "webArchOnly": false
  }
}
```

## Modern watcher

Starting with Meteor 3.3, new apps use a modern, cross-platform watcher: [`@parcel/watcher`](https://github.com/parcel-bundler/watcher). It responds quickly to file changes using native file watching. Symbolic link changes and all traversed files are supported via polling.

For existing apps, enable this by adding to `package.json`:

```json
"meteor": {
  "modern": true
}
```

If you run into issues with the new watcher, you can revert to the previous implementation for better file change detection. To disable the new watcher, set `"watcher": false` in your package.json.

```json
"meteor": {
  "modern": {
    "watcher": false
  }
}
```

The modern watcher uses the OS's native file watching with a performance-first approach. Both modern and legacy watchers support environment variables for polling, useful in edge cases like WSL with host, volumes, or remote setups.

To enable polling, run your Meteor app with:

```shell
# enable polling
METEOR_WATCH_FORCE_POLLING=true meteor run

# set polling interval (in ms)
METEOR_WATCH_POLLING_INTERVAL_MS=1000 METEOR_WATCH_FORCE_POLLING=true meteor run
```

> Polling uses more CPU and RAM, but it's the most reliable option in some environments.
