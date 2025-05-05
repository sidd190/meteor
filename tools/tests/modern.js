var selftest = require('../tool-testing/selftest.js');
var Sandbox = selftest.Sandbox;

// No need for a high value since the asserts already wait long enough to pass tests
const waitToStart = 5;

async function writeModernConfig(s, modernConfig) {
  const json = JSON.parse(s.read("package.json"));

  json.meteor = {
    ...json.meteor,
    modern: modernConfig,
  };

  s.write("package.json", JSON.stringify(json, null, 2) + "\n");

}

selftest.define("legacy build stack", async function () {
  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");

  await writeModernConfig(s, false);

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* check legacy stack */
  await run.match(/Babel\.compile/, false, true);
  await run.match(/safeWatcher\.watchLegacy/, false, true);
  await run.match(/_findSources for web\.browser.legacy/, false, true);

  await run.stop();
});

selftest.define("modern build stack", async function () {
  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");
  
  await writeModernConfig(s, true);

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* check modern stack */
  await run.match(/SWC\.compile/, false, true);
  await run.match(/safeWatcher\.watchModern/, false, true);
  await run.match(/_findSources for web\.browser/, false, true);

  run.forbid(/Babel\.compile/, false, true);
  run.forbid(/_findSources for web\.browser\.legacy/, false, true);

  await run.stop();
});

selftest.define("modern build stack - disable transpiler", async function () {
  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");

  await writeModernConfig(s, { transpiler: false });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* disable transpiler */
  run.forbid(/SWC\.compile/, false, true);
  await run.match(/Babel\.compile/, false, true);

  /* Keep rest of modern build stack */
  await run.match(/safeWatcher\.watchModern/, false, true);
  await run.match(/_findSources for web\.browser/, false, true);
  run.forbid(/_findSources for web\.browser\.legacy/, false, true);

  await run.stop();
});

selftest.define("modern build stack - disable watcher", async function () {
  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");

  await writeModernConfig(s, { watcher: false });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* disable watcher */
  run.forbid(/safeWatcher\.watchModern/, false, true);
  await run.match(/safeWatcher\.watchLegacy/, false, true);

  /* Keep rest of modern build stack */
  await run.match(/SWC\.compile/, false, true);
  await run.match(/_findSources for web\.browser/, false, true);
  run.forbid(/_findSources for web\.browser\.legacy/, false, true);

  await run.stop();
});

selftest.define("modern build stack - disable webArchOnly", async function () {
  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");

  await writeModernConfig(s, { webArchOnly: false });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* disable webArchOnly */
  await run.match(/_findSources for web\.browser/, false, true);
  await run.match(/_findSources for web\.browser\.legacy/, false, true);

  /* Keep rest of modern build stack */
  await run.match(/safeWatcher\.watchModern/, false, true);
  await run.match(/SWC\.compile/, false, true);

  await run.stop();
});

selftest.define("modern build stack - transpiler boolean-like options", async function () {
  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  process.env.METEOR_DISABLE_COLORS = true;

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
    },
  });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* check transpiler options */
  await run.match(/\[Transpiler] Used SWC.*\(app\)/, false, true);
  await run.match(/\[Transpiler] Used SWC.*\(package\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludeApp: true,
    },
  });
  await run.match(/\[Transpiler] Used Babel.*\(app\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludePackages: true,
    },
  });
  await run.match(/\[Transpiler] Used Babel.*\(package\)/, false, true);

  await run.stop();
});

selftest.define("modern build stack - transpiler string-like options", async function () {
  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  process.env.METEOR_DISABLE_COLORS = true;

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
    },
  });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* check transpiler options */
  await run.match(/\[Transpiler] Used SWC.*\(app\)/, false, true);
  await run.match(/\[Transpiler] Used SWC.*\(package\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludeApp: ['main.js'],
    },
  });
  await run.match(/\[Transpiler] Used Babel.*\(app\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludePackages: ['ejson'],
    },
  });
  await run.match(/\[Transpiler] Used Babel.*\(package\)/, false, true);

  await run.stop();
});
