import {
  NpmModuleMongodb as NpmModuleMongodbLegacy,
  NpmModuleMongodbVersion as NpmModuleMongodbVersionLegacy
} from 'meteor/npm-mongo-legacy';

const useLegacyMongo = process.env.METEOR_USE_LEGACY_MONGO;

const oldNoDeprecationValue = process.noDeprecation;
try {
  // Silence deprecation warnings introduced in a patch update to mongodb:
  // https://github.com/meteor/meteor/pull/9942#discussion_r218564879
  process.noDeprecation = true;
  NpmModuleMongodb = useLegacyMongo
    ? NpmModuleMongodbLegacy
    : Npm.require('mongodb');
} finally {
  process.noDeprecation = oldNoDeprecationValue;
}

NpmModuleMongodbVersion = useLegacyMongo
  ? NpmModuleMongodbVersionLegacy
  : Npm.require('mongodb/package.json').version;
