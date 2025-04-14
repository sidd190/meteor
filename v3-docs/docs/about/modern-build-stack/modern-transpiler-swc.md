# Modern transpiler: SWC

Meteor has long used Babel, a mature and still widely adopted transpiler. However, it lags behind newer tools like SWC in terms of speed. SWC and others are not only faster but are growing in use and features, often surpassing Babel.

Since transpilation is one of the slowest steps in development, Meteor now gives you the option to use SWC for your apps.

## Enable SWC

Add this to your app's `package.json`:

```json
"meteor": {
  "modernTranspiler": true
}
```

When starting your app for web or native, SWC will handle all files: your app, npm packages, and Atmosphere packages. This also applies to production builds.

## Verbose transpilation process

To analyze and improve transpilation, you can enable verbose output. Add this to `package.json`:

```json
"meteor": {
  "modernTranspiler": {
	  "verbose": true
  }
}
```

This shows each file being processed, its context, cache usage, and whether it fell back to Babel due to incompatibilities.

## Adapt your code to benefit from SWC

If all your code uses SWC, you're good and can turn off verbosity. But if you see logs like:

``` shell
[Transpiler] Used Babel for <file>     (<context>)     Fallback
  <more-details>
```

There are a few things you can do.

First, check the fallback details. It may show why SWC couldn’t handle the file. A common reason is nested imports, `import` statements inside a function. Moving them to the top level may fix it. These nested imports work via a Babel plugin specific to Meteor, which SWC doesn’t support.

Other reasons might involve features tied to Babel plugins. If so, you’ll need to find a similar plugin for SWC. See the [SWC plugin list](https://plugins.swc.rs/versions/range/271).

Second, you might choose to ignore the fallback if those files are fine with Babel. Even with SWC enabled, Meteor will continue using Babel for those files on future rebuilds.

Third, you can exclude files or contexts from SWC. For example, if you're using `babel-plugin-react-compiler`, you can exclude your app code adding this to `package.json`:

```json
"meteor": {
  "modernTranspiler": {
	  "excludeApp": true
  }
}
```

Or exclude only specific files like `.jsx`:

```json
"meteor": {
  "modernTranspiler": {
	  "excludeApp": ["\\.jsx"]
  }
}
```

You can also use `excludePackages`, `excludeNodeModules`, and `excludeLegacy` for finer control. See the [`modernTranspiler` config docs](#config-api) for more.

When no alternatives exist, these settings let you still get most of SWC’s speed benefits by limiting fallback use.

We expect most apps will benefit just by enabling `modernTranspiler: true`. Most Meteor packages should work right away, except ones using nested imports. Node modules will mostly work too, since they follow common standards. Most app code should also work unless it depends on Babel-specific behavior.

> Remember to turn off verbosity when you're done with optimizations.

## Custom .swcrc

You can use .swcrc config in the root of your project to describe specific [SWC plugins](https://github.com/swc-project/plugins) there, that will be applied to compile the entire files of your project.

## Config API

- `modernTranspiler: [true|false]`
  Enables or disables the use of the modern transpiler (SWC). If disabled, Babel will be used directly instead.

- `modernTranspiler.excludeApp: [true|false] or [string[]]`
  If true, the app’s own code (outside of Meteor core and packages) will continue using Babel.
  Otherwise, a list of file paths or regex-like patterns within the app to exclude from SWC transpilation.

- `modernTranspiler.excludeNodeModules: [true|false] or [string[]]`
  If true, the app’s node_modules will continue using Babel.
  Otherwise, a list of NPM packages names, file paths or regex-like patterns within the node_modules folder to exclude from SWC transpilation.

- `modernTranspiler.excludePackages: [true|false] or [string[]]`
  If true, the Meteor’s packages will continue using Babel.
  Otherwise, a list of package names, file paths or regex-like patterns within the package to exclude from SWC transpilation.

- `modernTranspiler.excludeLegacy: [true|false]`
  If true, the Meteor’s bundle for legacy browsers will continue using Babel.

- `modernTranspiler.verbose: [true|false]`
  If true, the transpilation process for files is shown when running the app. This helps understand which transpiler is used for each file, what fallbacks are applied, and gives a chance to either exclude files to always use Babel or migrate fully to SWC.

## Troubleshotting

If you run into issues, try `meteor reset` or delete the `.meteor/local` folder in the project root.

For help or to report issues, post on [GitHub](https://github.com/meteor/meteor/issues) or the [Meteor forums](https://forums.meteor.com). We’re focused on making Meteor faster and your feedback helps.

You can compare performance before and after enabling `modernTranspiler` by running [`meteor profile`](../../cli/index.md#meteorprofile). Share your results to show progress to others.

> **[Check out modern bundler options](./modern-bundler.md) to improve performance and access newer build features.**
