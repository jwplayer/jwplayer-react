/**
 * Renders the built lib (lib/jwplayer-react.js) against whichever react/react-dom
 * versions are currently installed and verifies mount, event wiring, and unmount.
 * Run through `npm run test:compat`, which cycles the supported react majors.
 */
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);

const calls = { setup: [], on: [], remove: 0 };
const api = {
    setup(config) { calls.setup.push(config); return api; },
    on(name, handler) { calls.on.push(name); api.onHandler = handler; return api; },
    once() { return api; },
    off() { return api; },
    remove() { calls.remove += 1; return api; },
};
dom.window.jwplayer = () => api;

const React = require('react');
const JWPlayer = require('../../lib/jwplayer-react.js').default;

const reactMajor = Number(React.version.split('.')[0]);

function fail(message) {
    console.error(`react ${React.version}: ${message}`);
    process.exit(1);
}

function assert(condition, message) {
    if (!condition) {
        fail(message);
    }
}

const container = document.getElementById('root');
let mountArgs = null;
let playEvents = 0;
let onMounted = null;
const mounted = new Promise((resolve) => { onMounted = resolve; });

const element = React.createElement(JWPlayer, {
    playlist: 'https://example.com/playlist',
    onPlay: () => { playEvents += 1; },
    didMountCallback: (args) => { mountArgs = args; onMounted(); },
});

let unmount;
if (reactMajor >= 18) {
    const { createRoot } = require('react-dom/client');
    const root = createRoot(container);
    root.render(element);
    unmount = () => root.unmount();
} else {
    const ReactDOM = require('react-dom');
    ReactDOM.render(element, container);
    unmount = () => ReactDOM.unmountComponentAtNode(container);
}

setTimeout(() => fail('timed out waiting for didMountCallback'), 15000);

mounted.then(() => {
    assert(calls.setup.length === 1, 'expected exactly one player setup');
    assert(calls.setup[0].isReactComponent === true, 'setup config is missing isReactComponent');
    assert(mountArgs && mountArgs.player, 'didMountCallback was not invoked with a player');
    assert(calls.on.includes('all'), 'the on("all") listener was not registered');

    api.onHandler('play');
    assert(playEvents === 1, 'the onPlay handler did not fire');

    unmount();
    assert(calls.remove === 1, 'player.remove() was not called on unmount');

    console.log(`react ${React.version}: compat smoke test passed`);
    // Exit explicitly: react-dom's scheduler holds an open MessageChannel that
    // would otherwise keep the process alive past the failure timeout above.
    process.exit(0);
});
