var selftest = require('../tool-testing/selftest.js');
var Sandbox = selftest.Sandbox;

const waitToStart = 10;

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
  await run.matchAsync(/Babel\.compile/, false, true);
  await run.matchAsync(/safeWatcher\.watchLegacy/, false, true);
  await run.matchAsync(/_findSources for web\.browser.legacy/, false, true);

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
  await run.matchAsync(/SWC\.compile/, false, true);
  await run.matchAsync(/safeWatcher\.watchModern/, false, true);
  await run.matchAsync(/_findSources for web\.browser/, false, true);

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
  await run.matchAsync(/Babel\.compile/, false, true);

  /* Keep rest of modern build stack */
  await run.matchAsync(/safeWatcher\.watchModern/, false, true);
  await run.matchAsync(/_findSources for web\.browser/, false, true);
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
  await run.matchAsync(/safeWatcher\.watchLegacy/, false, true);

  /* Keep rest of modern build stack */
  await run.matchAsync(/SWC\.compile/, false, true);
  await run.matchAsync(/_findSources for web\.browser/, false, true);
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
  await run.matchAsync(/_findSources for web\.browser/, false, true);
  await run.matchAsync(/_findSources for web\.browser\.legacy/, false, true);

  /* Keep rest of modern build stack */
  await run.matchAsync(/safeWatcher\.watchModern/, false, true);
  await run.matchAsync(/SWC\.compile/, false, true);

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
  await run.matchAsync(/\[Transpiler] Used SWC.*\(app\)/, false, true);
  await run.matchAsync(/\[Transpiler] Used SWC.*\(package\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludeApp: true,
    },
  });
  await run.matchAsync(/\[Transpiler] Used Babel.*\(app\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludePackages: true,
    },
  });
  await run.matchAsync(/\[Transpiler] Used Babel.*\(package\)/, false, true);

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
  await run.matchAsync(/\[Transpiler] Used SWC.*\(app\)/, false, true);
  await run.matchAsync(/\[Transpiler] Used SWC.*\(package\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludeApp: ['main.js'],
    },
  });
  await run.matchAsync(/\[Transpiler] Used Babel.*\(app\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludePackages: ['ejson'],
    },
  });
  await run.matchAsync(/\[Transpiler] Used Babel.*\(package\)/, false, true);

  await run.stop();
});
