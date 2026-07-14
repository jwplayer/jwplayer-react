/**
 * Verifies the built lib still supports every react major in the peer range.
 * Installs each legacy major with --no-save, runs the smoke test against
 * lib/jwplayer-react.js, then restores node_modules to the lockfile versions.
 * Requires `npm run build` to have run first.
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' });

// --legacy-peer-deps: devDependencies (@testing-library/react) declare react
// 18+ peers, which would otherwise block installing react 17.
const versions = ['17', '18'];

try {
    versions.forEach((version) => {
        run(`npm install --no-save --no-audit --no-fund --legacy-peer-deps react@${version} react-dom@${version}`);
        run('node ./test/compat/smoke.js');
    });
} finally {
    run('npm install --no-audit --no-fund');
}
