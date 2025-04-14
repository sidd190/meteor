# Modern bundler

Meteor handles watching and linking all project files into the final bundle. While we'd like to offload more of this to modern bundlers, we're still focused on keeping what's left in the Meteor context as fast as possible.

Integration with a modern bundler is in progress for Meteor 3.4. Meanwhile, we've optimized existing processes for better performance.

## Modern builds

Starting with Meteor 3.3, new apps skip `web.browser.legacy` and `web.cordova` by default in development mode (unless developing for native).

For existing apps, enable this by adding to `package.json`:

```json
"meteor": {
  "modernWebArchsOnly": true
}
```

This works like using `--exclude-archs web.browser.legacy,web.cordova` with `meteor run`.
