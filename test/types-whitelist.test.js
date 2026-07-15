const fs = require('fs');
const path = require('path');
const configProps = require('../src/config-props');

describe('jwplayer-react.d.ts config prop whitelist', () => {
  it('matches the runtime whitelist in config-props.js', () => {
    const dts = fs.readFileSync(path.join(__dirname, '../src/jwplayer-react.d.ts'), 'utf8');
    const union = dts.match(/type WhitelistedConfigKey =([\s\S]*?);/);

    expect(union).not.toBeNull();

    const declaredKeys = Array.from(union[1].matchAll(/'([^']+)'/g), (match) => match[1]);

    // React reserves the `key` prop and never forwards it to the component,
    // so it is deliberately absent from the declared props.
    const runtimeKeys = [...configProps].filter((key) => key !== 'key');

    expect([...declaredKeys].sort()).toEqual(runtimeKeys.sort());
  });
});
