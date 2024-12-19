function cleanStackTrace(stackTrace) {
  if (!stackTrace) return [];
  var lines = stackTrace.split('\n');
  var trace = [];
  for (var i = 0; i < lines.length; i++) {
    var _line = lines[i].trim();
    if (_line.indexOf('Meteor.deprecate') !== -1) continue;
    if (_line.indexOf('packages/') !== -1) {
      trace.push(_line);
    } else if (_line && _line.indexOf('/') !== -1) {
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
    var stackStrace = cleanStackTrace(new Error().stack || '');
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
