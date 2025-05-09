const useLegacyMongo = !!Package['npm-mongo-legacy'];

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
