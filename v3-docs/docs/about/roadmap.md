# Roadmap

Describes the high-level features and actions for the Meteor project in the near-to-medium term future.

## Introduction

**Last updated: March 6th, 2025.**

The description of many items includes sentences and ideas from Meteor community members.

Contributors are encouraged to focus their efforts on work that aligns with the roadmap then we can work together in these areas.

> As with any roadmap, this is a living document that will evolve as priorities and dependencies shift.

> If you have new feature requests or ideas, you should open a new [discussion](https://github.com/meteor/meteor/discussions/new).

### Next releases

- Bundle optimization
> We need to improve the bundle size and performance of Meteor apps. We should consider tree-shaking, code-splitting,
> and other optimizations to make our apps leaner and faster.
> To achieve that we plan to integrate or have an easy way to integrate with modern bundlers like RSPack, ESBuild, or Rollup.

- Support package.json exports fields ([Discussion](https://github.com/meteor/meteor/discussions/11727))
- Tree-shaking
> Tree sharking and exports fields may be implemented by integrating with more modern build tools, see previous items.

- Capacitor support
> Capacitor is a modern alternative to Cordova; we should provide an easy way to build mobile apps using Capacitor.

- MongoDB Change Streams support ([Discussion](https://github.com/meteor/meteor/discussions/11842))
> Change Streams is the official way to listen to changes in MongoDB. We should provide a way to use it seamlessly in Meteor. It has been planned for a long time, and now we’re in a position to do it.

- Improve TypeScript support for Meteor and packages ([Discussion](https://github.com/meteor/meteor/discussions/12080))
> Should be an ongoing effort to improve the TypeScript support in Meteor and packages. We should provide a better experience for TypeScript users, including better type definitions and support for TypeScript features.

- Improve release CI/CD speed and reliability (optimized build times will help)
> Our CI/CD takes too long to run, causing long queues and delays in our release process and feedback loop; we need to improve that.

### Candidate items

We need to discuss further to decide whether to proceed with these implementations.

- Improve DDP Client
- Improve Passwordless package ([Discussion](https://github.com/meteor/meteor/discussions/12075))
- Integrate with Tauri, it might replace Cordova and Electron in a single tool
- Bring Redis-oplog to core ([Repository](https://github.com/Meteor-Community-Packages/redis-oplog))
- Better file upload support via DDP ([Discussion](https://github.com/meteor/meteor/discussions/11523))

### Finished items

- Change how Meteor executes Async code ([Discussion](https://github.com/meteor/meteor/discussions/11505))
  - Provide new async APIs where Fibers are required
    - Mongo package with Async API ([PR](https://github.com/meteor/meteor/pull/12028))
    - Provide async versions for Accounts and core packages
    - Adapt Meteor Promise implementation
- Enable Top-Level Await (TLA) on Meteor server-side ([PR](https://github.com/meteor/meteor/pull/12095))
- Support Top-Level Await (TLA) on Reify
- Remove Fibers dependency from Meteor Public APIs
- Remove Fibers entirely
- Update Cordova integration to Meteor 3.0
- Run Meteor on Node.js v20
- Change web engine from Connect to Express

-----------

For more completed items, refer to our [changelog](https://docs.meteor.com/history.html).