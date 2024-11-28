import has from 'lodash.has';

var AllowAsyncValidateCollection;

Tinytest.addAsync(
  "collection - validate server operations when using allow-deny rules on the client",
  async function (test) {
    AllowAsyncValidateCollection =
      AllowAsyncValidateCollection ||
      new Mongo.Collection(`allowdeny-async-validation`);
    if (Meteor.isServer) {
      await AllowAsyncValidateCollection.removeAsync();
    }
    AllowAsyncValidateCollection.allow({
      insertAsync() {
        return true;
      },
      insert() {
        return true;
      },
      updateAsync() {
        return true;
      },
      update() {
        return true;
      },
      removeAsync() {
        return true;
      },
      remove() {
        return true;
      },
    });

    if (Meteor.isClient) {
      /* sync tests */
      var id = await new Promise((resolve, reject) => {
        AllowAsyncValidateCollection.insert({ num: 1 }, (error, result) =>
          error ? reject(error) : resolve(result)
        );
      });
      console.log('id', id);
      await new Promise((resolve, reject) => {
        AllowAsyncValidateCollection.update(
          id,
          { $set: { num: 11 } },
          (error, result) => (error ? reject(error) : resolve(result))
        );
      });
      await new Promise((resolve, reject) => {
        AllowAsyncValidateCollection.remove(id, (error, result) =>
          error ? reject(error) : resolve(result)
        );
      });

      /* async tests */
      id = await AllowAsyncValidateCollection.insertAsync({ num: 2 });
      await AllowAsyncValidateCollection.updateAsync(id, { $set: { num: 22 } });
      await AllowAsyncValidateCollection.removeAsync(id);
    }
  }
);

function configAllAsyncAllowDeny(collection, configType = 'allow', enabled) {
  collection[configType]({
    async insertAsync(selector, doc) {
      if (doc.force) return true;
      await Meteor._sleepForMs(100);
      return enabled;
    },
    async updateAsync() {
      await Meteor._sleepForMs(100);
      return enabled;
    },
    async removeAsync() {
      await Meteor._sleepForMs(100);
      return enabled;
    },
  });
}

async function runAllAsyncExpect(test, collection, allow) {
  let id;
  /* async tests */
  try {
    id = await collection.insertAsync({ num: 2 });
    test.isTrue(allow);
  } catch (e) {
    test.isTrue(!allow);
  }
  try {
    id = await collection.insertAsync({ force: true });
    await collection.updateAsync(id, { $set: { num: 22 } });
    test.isTrue(allow);
  } catch (e) {
    test.isTrue(!allow);
  }
  try {
    await collection.removeAsync(id);
    test.isTrue(allow);
  } catch (e) {
    test.isTrue(!allow);
  }
}

var AllowDenyAsyncRulesCollections = {};

testAsyncMulti("collection - async definitions on allow/deny rules", [
  async function (test) {
    AllowDenyAsyncRulesCollections.allowed =
      AllowDenyAsyncRulesCollections.allowed ||
      new Mongo.Collection(`allowdeny-async-rules-allowed`);
    if (Meteor.isServer) {
      await AllowDenyAsyncRulesCollections.allowed.removeAsync();
    }

    configAllAsyncAllowDeny(AllowDenyAsyncRulesCollections.allowed, 'allow', true);
    if (Meteor.isClient) {
      await runAllAsyncExpect(test, AllowDenyAsyncRulesCollections.allowed, true);
    }
  },
  async function (test) {
    AllowDenyAsyncRulesCollections.notAllowed =
      AllowDenyAsyncRulesCollections.notAllowed ||
      new Mongo.Collection(`allowdeny-async-rules-notAllowed`);
    if (Meteor.isServer) {
      await AllowDenyAsyncRulesCollections.notAllowed.removeAsync();
    }

    configAllAsyncAllowDeny(AllowDenyAsyncRulesCollections.notAllowed, 'allow', false);
    if (Meteor.isClient) {
      await runAllAsyncExpect(test, AllowDenyAsyncRulesCollections.notAllowed, false);
    }
  },
  async function (test) {
    AllowDenyAsyncRulesCollections.denied =
      AllowDenyAsyncRulesCollections.denied ||
      new Mongo.Collection(`allowdeny-async-rules-denied`);
    if (Meteor.isServer) {
      await AllowDenyAsyncRulesCollections.denied.removeAsync();
    }

    configAllAsyncAllowDeny(AllowDenyAsyncRulesCollections.denied, 'deny', true);
    if (Meteor.isClient) {
      await runAllAsyncExpect(test, AllowDenyAsyncRulesCollections.denied, false);
    }
  },
]);

function configAllSyncAllowDeny(collection, configType = 'allow', enabled) {
  collection[configType]({
    insert(selector, doc) {
      if (doc.force) return true;
      return enabled;
    },
    update() {
      return enabled;
    },
    remove() {
      return enabled;
    },
  });
}

async function runAllSyncExpect(test, collection, expected) {
  let id;
  /* sync tests */
  const syncCallback = (error) => {
    if (error) {
      test.isTrue(!expected);
      return;
    }
    test.isTrue(expected);
  };

  await new Promise((resolve) => {
    id = collection.insert({ num: 2 }, (error, result) => {
      if (error) {
        test.isTrue(!expected);
        resolve();
        return;
      }
      test.isTrue(expected && result != null);
      resolve();
    });
  });

  await new Promise((resolve) => {
    collection.update(id, { $set: { num: 22 } }, (error, result) => {
      if (error) {
        test.isTrue(!expected);
        resolve();
        return;
      }
      test.isTrue(expected && result != null);
      resolve();
    });
  });

  await new Promise((resolve) => {
    collection.remove(id, (error, result) => {
      if (error) {
        test.isTrue(!expected);
        resolve();
        return;
      }
      test.isTrue(expected && result != null);
      resolve();
    });
  });
}

var AllowDenySyncRulesCollections = {};

testAsyncMulti("collection - sync definitions on allow/deny rules", [
  async function (test) {
    AllowDenySyncRulesCollections.allowed =
      AllowDenySyncRulesCollections.allowed ||
      new Mongo.Collection(`allowdeny-sync-rules-allowed`);
    if (Meteor.isServer) {
      await AllowDenySyncRulesCollections.allowed.removeAsync();
    }

    configAllAsyncAllowDeny(AllowDenySyncRulesCollections.allowed, 'allow', true);
    if (Meteor.isClient) {
      await runAllSyncExpect(test, AllowDenySyncRulesCollections.allowed, true);
    }
  },
  async function (test) {
    AllowDenySyncRulesCollections.notAllowed =
      AllowDenySyncRulesCollections.notAllowed ||
      new Mongo.Collection(`allowdeny-sync-rules-notAllowed`);
    if (Meteor.isServer) {
      await AllowDenySyncRulesCollections.notAllowed.removeAsync();
      await AllowDenySyncRulesCollections.notAllowed.insertAsync({ num: 2 });
    }

    configAllSyncAllowDeny(AllowDenySyncRulesCollections.notAllowed, 'allow', false);
    if (Meteor.isClient) {
      await runAllSyncExpect(test, AllowDenySyncRulesCollections.notAllowed, false);
    }
  },
  async function (test) {
    AllowDenySyncRulesCollections.denied =
      AllowDenySyncRulesCollections.denied ||
      new Mongo.Collection(`allowdeny-sync-rules-denied`);
    if (Meteor.isServer) {
      await AllowDenySyncRulesCollections.denied.removeAsync();
    }

    configAllSyncAllowDeny(AllowDenySyncRulesCollections.denied, 'deny', true);
    if (Meteor.isClient) {
      await runAllSyncExpect(test, AllowDenySyncRulesCollections.denied, false);
    }
  },
]);
