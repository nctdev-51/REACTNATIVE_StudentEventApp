const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('Web components share the provider theme and render without Missing theme', () => {
  const { resolver } = require('../metro.config');
  // Apply Metro's actual alias rule to the Node renderer as well.
  const originalResolve = Module._resolveFilename;
  const originalTsx = Module._extensions['.tsx'];
  Module._resolveFilename = function (name, parent, ...rest) {
    return resolver.resolveRequest({
      originModulePath: parent?.filename,
      resolveRequest(context, request) {
        const origin = new Module(context.originModulePath);
        origin.filename = context.originModulePath;
        origin.paths = Module._nodeModulePaths(path.dirname(origin.filename));
        return originalResolve.call(Module, request, origin, ...rest);
      },
    }, name, 'web');
  };
  Module._extensions['.tsx'] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText, filename);
  };
  try {
    const React = require('react');
    const { renderToString } = require('react-dom/server');
    const { createTamagui, TamaguiProvider } = require('tamagui');
    const { config } = require('@tamagui/config/v3');
    const { Button } = require('../src/components/common/Button.tsx');
    const { Card } = require('../src/components/common/Card.tsx');
    const { Input } = require('../src/components/common/Input.tsx');
    const html = renderToString(React.createElement(TamaguiProvider, { config: createTamagui(config), defaultTheme: 'light' },
      React.createElement(Card, null,
        React.createElement(Button, null, 'Nhắc nhở'),
        React.createElement(Input, { label: 'Tên sự kiện' }))));
    assert.ok(html.includes('Nhắc nhở'));
    assert.ok(html.includes('Tên sự kiện'));
    assert.ok(html.includes('<input'));
  } finally {
    Module._resolveFilename = originalResolve;
    if (originalTsx) Module._extensions['.tsx'] = originalTsx;
    else delete Module._extensions['.tsx'];
  }
});
