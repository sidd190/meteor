import { EJSON } from 'meteor/ejson';

interface OplogEntry {
  $v: number;
  diff?: OplogDiff;
  $set?: Record<string, any>;
  $unset?: Record<string, true>;
}

interface OplogDiff {
  i?: Record<string, any>;
  u?: Record<string, any>;
  d?: Record<string, boolean>;
  [key: `s${string}`]: ArrayOperator | Record<string, any>;
}

interface ArrayOperator {
  a: true;
  [key: `u${number}`]: any;
}

const arrayOperatorKeyRegex = /^(a|[su]\d+)$/;

function isArrayOperatorKey(field: string): boolean {
  return arrayOperatorKeyRegex.test(field);
}

function isArrayOperator(operator: unknown): operator is ArrayOperator {
  return (
    operator !== null &&
    typeof operator === 'object' &&
    'a' in operator &&
    (operator as ArrayOperator).a === true &&
    Object.keys(operator).every(isArrayOperatorKey)
  );
}

function join(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key;
}

function flattenObjectInto(
  target: Record<string, any>,
  source: any,
  prefix: string
): void {
  if (
    Array.isArray(source) ||
    typeof source !== 'object' ||
    source === null ||
    source instanceof Mongo.ObjectID ||
    EJSON._isCustomType(source)
  ) {
    target[prefix] = source;
    return;
  }

  const entries = Object.entries(source);
  if (entries.length) {
    entries.forEach(([key, value]) => {
      flattenObjectInto(target, value, join(prefix, key));
    });
  } else {
    target[prefix] = source;
  }
}

function convertOplogDiff(
  oplogEntry: OplogEntry,
  diff: OplogDiff,
  prefix = ''
): void {
  Object.entries(diff).forEach(([diffKey, value]) => {
    if (diffKey === 'd') {
      oplogEntry.$unset ??= {};
      Object.keys(value).forEach(key => {
        oplogEntry.$unset![join(prefix, key)] = true;
      });
    } else if (diffKey === 'i') {
      oplogEntry.$set ??= {};
      flattenObjectInto(oplogEntry.$set, value, prefix);
    } else if (diffKey === 'u') {
      oplogEntry.$set ??= {};
      Object.entries(value).forEach(([key, fieldValue]) => {
        oplogEntry.$set![join(prefix, key)] = fieldValue;
      });
    } else if (diffKey.startsWith('s')) {
      const key = diffKey.slice(1);
      if (isArrayOperator(value)) {
        Object.entries(value).forEach(([position, fieldValue]) => {
          if (position === 'a') return;

          const positionKey = join(prefix, `${key}.${position.slice(1)}`);
          if (position[0] === 's') {
            convertOplogDiff(oplogEntry, fieldValue, positionKey);
          } else if (fieldValue === null) {
            oplogEntry.$unset ??= {};
            oplogEntry.$unset[positionKey] = true;
          } else {
            oplogEntry.$set ??= {};
            oplogEntry.$set[positionKey] = fieldValue;
          }
        });
      } else if (key) {
        convertOplogDiff(oplogEntry, value, join(prefix, key));
      }
    }
  });
}

export function oplogV2V1Converter(oplogEntry: OplogEntry): OplogEntry {
  if (oplogEntry.$v !== 2 || !oplogEntry.diff) {
    return oplogEntry;
  }

  const convertedOplogEntry: OplogEntry = { $v: 2 };
  convertOplogDiff(convertedOplogEntry, oplogEntry.diff);
  return convertedOplogEntry;
}