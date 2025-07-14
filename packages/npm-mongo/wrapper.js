const { MongoClient, MongoServerSelectionError, MongoCompatibilityError } = Npm.require('mongodb');

async function ableToConnectToMongo(url) {
  let client;
  try {
    client = new MongoClient(url);
    await client.connect();
  } catch (error) {
    if (error.cause instanceof MongoCompatibilityError && error.message.includes('maximum wire version')) {
      console.warn('Legacy MongoDB version detected, using mongo-legacy package:', error.message);
      console.warn('Warning: MongoDB versions <= 3.6 are deprecated. Some Meteor features may not work properly with this version. It is recommended to use MongoDB >= 4.');
    } else console.error('Failed to get MongoDB server version:', error);
    return false;
  } finally {
    if (client) await client.close().catch(() => {});
    return true
  }
}

const useLegacyMongo = ableToConnectToMongo(process.env.MONGO_URL)

const oldNoDeprecationValue = process.noDeprecation;
try {
  // Silence deprecation warnings introduced in a patch update to mongodb:
  // https://github.com/meteor/meteor/pull/9942#discussion_r218564879
  process.noDeprecation = true;
  NpmModuleMongodb = useLegacyMongo
    ? Package['npm-mongo-legacy'].NpmModuleMongodb
    : Npm.require('mongodb');
} finally {
  process.noDeprecation = oldNoDeprecationValue;
}

NpmModuleMongodbVersion = useLegacyMongo
  ? Package['npm-mongo-legacy'].NpmModuleMongodbVersion
  : Npm.require('mongodb/package.json').version;
