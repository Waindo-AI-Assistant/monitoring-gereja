const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(
    (name) => name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : require(name), module, module.exports,
  );
  return module.exports;
}
const { getNavigationItems, isActiveNavigation } = load("lib/navigation.ts");
const { defaultPermissions } = load("lib/permissions.ts");
const paths = (permissions) => getNavigationItems(permissions ? { name: "Test", permissions } : null).map(({ href }) => href);

test("active navigation matches route segments and nested history articles", () => {
  assert.equal(isActiveNavigation("/", "/"), true);
  assert.equal(isActiveNavigation("/sejarah/1960", "/sejarah"), true);
  assert.equal(isActiveNavigation("/sejarah", "/"), false);
  assert.equal(isActiveNavigation("/sejarah-lain", "/sejarah"), false);
});
test("visitors see public routes and a sign-in link", () => {
  assert.deepEqual(paths(), ["/", "/pengurus", "/sejarah", "/dashboard", "/admin"]);
  assert.equal(getNavigationItems(null).at(-1).label, "nav.login");
});
test("ordinary users only see their permitted dashboard; management follows stored access", () => {
  assert.deepEqual(paths(defaultPermissions("biasa")), ["/", "/pengurus", "/sejarah", "/dashboard"]);
  const delegated = { ...defaultPermissions(), "pengurus.view": true };
  assert.deepEqual(paths(delegated), ["/", "/pengurus", "/sejarah", "/admin"]);
  assert.equal(getNavigationItems({ name: "Test", permissions: delegated }).at(-1).label, "nav.admin");
  assert.deepEqual(paths(defaultPermissions("superadmin")), paths());
});
