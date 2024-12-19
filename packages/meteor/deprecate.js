function cleanStackTrace(stackTrace) {
  if (!stackTrace) return [];
  const lines = stackTrace.split('\n');
  const trace = [];
  for (const line of lines) {
    const _line = line.trim();
    if (_line.includes('Meteor.deprecate')) continue;
    if (_line.includes('packages/')) {
      trace.push(_line);
    } else if (_line && _line.includes('/')) {
      // Stop processing if a valid path that does not start with 'packages/**' is found
      break;
    }
  }
  return trace.join('\n');
}

Meteor.deprecate = function (...messages) {
  if (!Meteor.isDevelopment) {
    return;
  }
  if (typeof console !== 'undefined' && typeof console.warn !== 'undefined') {
    const stackStrace = cleanStackTrace(new Error().stack || '');
    console.warn(
      '[DEPRECATION]',
      ...messages,
      ...stackStrace?.length > 0 && [
        '\n\n',
        'Trace:',
        '\n',
        stackStrace
      ] || []
    );
  }
};
