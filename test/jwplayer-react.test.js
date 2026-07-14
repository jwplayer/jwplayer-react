/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import JWPlayer from '../src/jwplayer';
import { loadPlayer } from '../src/util';
import { mockLibrary, players } from './util';

const noop = () => {};

const playlist = 'https://cdn.jwplayer.com/v2/media/1g8jjku3';
const library = 'https://cdn.jwplayer.com/libraries/lqsWlr4Z.js';
let expectedInstance = -1;

beforeEach(() => {
    window.jwplayer = mockLibrary;
});

afterEach(() => {
    window.jwplayer = null;
});

const createMountedComponent = async (props = {}) => {
    const ref = React.createRef();
    let result;
    await act(async () => {
        result = render(<JWPlayer ref={ref} library={library} playlist={playlist} {...props} />);
    });
    return { ...result, instance: ref.current };
};

describe('setup', () => {
    let instance;

    const setupTest = async (props) => {
        const ref = React.createRef();
        await act(async () => {
            render(<JWPlayer ref={ref} {...props} />);
        });
        instance = ref.current;
        expectedInstance++;
    };

    const checkTests = () => {
        expect(instance.ref).toBeTruthy();
        expect(instance.player).toBe(players[instance.id]);
        expect(instance.didMountCallback).toEqual(undefined);
        expect(instance.willUnmountCallback).toEqual(undefined);
        expect(instance.id).toEqual(`jwplayer-${expectedInstance}`);
        expect(window.jwplayer(instance.id).setup.mock.calls.length).toBe(1);
        expect(window.jwplayer(instance.id).setup.mock.calls[0][0]).toEqual({ playlist: 'https://cdn.jwplayer.com/v2/media/1g8jjku3', isReactComponent: true });
    };

    it('sets up when jwplayer is pre-instantiated', async () => {
        await setupTest({ playlist });
        checkTests();
    });

    it('sets up when jwplayer library provided', async () => {
        await setupTest({ playlist, library });
        checkTests();
    });

    it('Errors with no library and falsey window.jwplayer', () => {
        window.jwplayer = null;
        expect(() => loadPlayer()).toThrow("jwplayer-react requires either a library prop, or a library script");
    });

    it('creates a script tag when mounted if window.jwplayer is not defined', () => {
        window.jwplayer = null;
        const ref = React.createRef();
        render(<JWPlayer ref={ref} library={library} playlist={playlist} />);
        expectedInstance++;
        const script = document.getElementsByTagName('script')[0];
        expect(script instanceof HTMLScriptElement).toEqual(true);
    });
});

describe('methods', () => {
    describe('generateId', () => {
        it('increments index when generating unique ID', async () => {
            const { instance: i1 } = await createMountedComponent();
            const { instance: i2 } = await createMountedComponent();
            const { instance: i3 } = await createMountedComponent();

            const num = (id) => parseInt(id.replace('jwplayer-', ''), 10);
            expect(num(i2.id)).toBe(num(i1.id) + 1);
            expect(num(i3.id)).toBe(num(i2.id) + 1);
        });
    });

    describe('generateConfig', () => {
        it('generates a setup config from props without assigning unsupported properties', async () => {
            const { instance } = await createMountedComponent({ unsupportedProperty: 3, floating: {}, width: 500 });
            const setupConfig = window.jwplayer(instance.id).setup.mock.calls[0][0];
            const expectedSetupConfig = {
                floating: {},
                isReactComponent: true,
                playlist: 'https://cdn.jwplayer.com/v2/media/1g8jjku3',
                width: 500
            };
            expect(setupConfig).toEqual(expectedSetupConfig);
        });

        it('Props overwrite matching base config properties', async () => {
            const baseConfig = { width: 400, height: 300 };
            const { instance } = await createMountedComponent({ config: baseConfig, unsupportedProperty: 3, floating: {}, width: 500 });
            const setupConfig = window.jwplayer(instance.id).setup.mock.calls[0][0];
            const expectedSetupConfig = {
                floating: {},
                isReactComponent: true,
                playlist: 'https://cdn.jwplayer.com/v2/media/1g8jjku3',
                width: 500,
                height: 300
            };
            expect(setupConfig).toEqual(expectedSetupConfig);
        });

        it('Base config overwrites jwDefaults', async () => {
            const baseConfig = { width: 720, height: 480 };
            window.jwDefaults = {
                width: 400,
                height: 300,
                floating: {}
            };
            const { instance } = await createMountedComponent({ config: baseConfig });
            const setupConfig = window.jwplayer(instance.id).setup.mock.calls[0][0];
            window.jwDefaults = {};
            expect(setupConfig).toEqual({
                width: 720,
                height: 480,
                floating: {},
                isReactComponent: true,
                playlist: 'https://cdn.jwplayer.com/v2/media/1g8jjku3'
            });
        });
    });

    it('createEventListeners', async () => {
        const { instance } = await createMountedComponent({ onReady: noop, onPlay: noop, oncePause: noop });
        const id = instance.id;
        expect(window.jwplayer(id).once.mock.calls.length).toBe(1);
        expect(window.jwplayer(id).on.mock.calls.length).toBe(1);
        expect(window.jwplayer(id).on.mock.calls).toContainEqual(['all', expect.any(Function)]);
    });

    describe('updateOnEventListener', () => {
        it('does not fire on handler on invalid event', async () => {
            const { instance } = await createMountedComponent();
            instance.player.on = (name, handler) => { handler('invalid'); };

            let fired = false;
            const nextProps = { onPlay: () => { fired = true; } };
            instance.updateOnEventListener(nextProps);
            expect(fired).toBe(false);
        });

        it('fires on handler on event', async () => {
            const { instance } = await createMountedComponent();
            instance.player.on = (name, handler) => { handler('play'); };

            let fired = false;
            const nextProps = { onPlay: () => { fired = true; } };
            instance.updateOnEventListener(nextProps);
            expect(fired).toBe(true);
        });

        it('fires all handler on all event', async () => {
            const { instance } = await createMountedComponent();
            instance.player.on = (name, handler) => { handler(name); };

            let fired = false;
            const nextProps = { onAll: () => { fired = true; } };
            instance.updateOnEventListener(nextProps);
            expect(fired).toBe(true);
        });

        it('does not remove previous on event listener if it does not exist', async () => {
            const { instance } = await createMountedComponent();
            const offSpy = instance.player.off;

            const nextProps = { onPlay: noop };
            instance.onHandler = null;
            instance.updateOnEventListener(nextProps);
            expect(offSpy).not.toHaveBeenCalled();
        });

        it('removes previous on event listener', async () => {
            const { instance } = await createMountedComponent();
            const offSpy = instance.player.off;

            const nextProps = { onPlay: noop };
            instance.updateOnEventListener(nextProps);
            expect(offSpy).toHaveBeenCalled();
        });
    });

    describe('didOnEventsChange', () => {
        it('should return false if on event props did not change', async () => {
            const { instance } = await createMountedComponent();
            const nextProps = { unsupportedProperty: 3 };
            const eventsChange = instance.didOnEventsChange(nextProps);
            expect(eventsChange).toBe(false);
        });

        it('should return true if on event prop was added', async () => {
            const { instance } = await createMountedComponent();
            const nextProps = { onPlay: noop };
            const eventsChange = instance.didOnEventsChange(nextProps);
            expect(eventsChange).toBe(true);
        });

        it('should return true if on event prop was removed', async () => {
            const { instance } = await createMountedComponent({ onPlay: noop });
            const nextProps = {};
            const eventsChange = instance.didOnEventsChange(nextProps);
            expect(eventsChange).toBe(true);
        });

        it('should return true if on event prop was changed', async () => {
            const { instance } = await createMountedComponent({ onPlay: jest.fn() });
            const nextProps = { onPlay: noop };
            const eventsChange = instance.didOnEventsChange(nextProps);
            expect(eventsChange).toBe(true);
        });
    });

    describe('lifecycle', () => {
        it('mounts with callback', async () => {
            const spy = jest.fn();
            await createMountedComponent({ didMountCallback: (...args) => spy(...args) });
            expect(spy).toHaveBeenCalled();
        });

        it('unmounts with callback', async () => {
            const spy = jest.fn();
            const { instance, unmount } = await createMountedComponent({ willUnmountCallback: (...args) => spy(...args) });
            const removeSpy = instance.player.remove;

            unmount();
            expect(spy).toHaveBeenCalled();
            expect(removeSpy).toHaveBeenCalled();
        });

        it('can unmount without callback', async () => {
            const { instance, unmount } = await createMountedComponent();
            const removeSpy = instance.player.remove;

            unmount();
            expect(removeSpy).toHaveBeenCalled();
        });

        it('still unmounts if player externally destroyed', async () => {
            const { instance, unmount } = await createMountedComponent();
            instance.player = null;
            unmount();
        });

        it('should update component if props have changed', async () => {
            const { instance } = await createMountedComponent();
            const nextProps = { unsupportedProperty: 3 };
            const shouldUpdate = instance.shouldComponentUpdate(nextProps);
            expect(shouldUpdate).toBe(true);
        });

        it('should not update component if on event props change', async () => {
            const { instance } = await createMountedComponent();
            const nextProps = { onPlay: noop };
            const shouldUpdate = instance.shouldComponentUpdate(nextProps);
            expect(shouldUpdate).toBe(false);
        });

        it('should not update component if player does not exist', async () => {
            const { instance } = await createMountedComponent();
            instance.player = null;
            const shouldUpdate = instance.shouldComponentUpdate({});
            expect(shouldUpdate).toBe(false);
        });

        it('does not create a player when unmounted before the library loads', async () => {
            window.jwplayer = null;
            const ref = React.createRef();
            const { unmount } = render(<JWPlayer ref={ref} library={library} playlist={playlist} />);
            const instance = ref.current;
            const script = Array.from(document.getElementsByTagName('script')).pop();

            unmount();
            window.jwplayer = mockLibrary;

            await instance.componentDidMount();
            expect(instance.player).toBe(null);
            expect(players[instance.id]).toBeUndefined();

            await act(async () => {
                script.onload();
            });
            expect(instance.player).toBe(null);
        });

        it('creates only one player when StrictMode remounts', async () => {
            const ref = React.createRef();
            await act(async () => {
                render(
                    <React.StrictMode>
                        <JWPlayer ref={ref} library={library} playlist={playlist} />
                    </React.StrictMode>
                );
            });
            const { id } = ref.current;
            expect(window.jwplayer(id).setup.mock.calls.length).toBe(1);
        });
    });
});
