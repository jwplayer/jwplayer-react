/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import JWPlayer from '../src/jwplayer';
import { loadPlayer, isDeepEqual } from '../src/util';
import { mockLibrary, players } from './util';

const noop = () => {};

const playlist = 'https://cdn.jwplayer.com/v2/media/1g8jjku3';
const library = 'https://cdn.jwplayer.com/libraries/lqsWlr4Z.js';

beforeEach(() => {
    window.jwplayer = mockLibrary;
});

afterEach(() => {
    window.jwplayer = null;
    document.querySelectorAll('script').forEach((script) => script.remove());
    jest.restoreAllMocks();
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
    };

    const checkTests = () => {
        expect(instance.ref).toBeTruthy();
        expect(instance.player).toBe(players[instance.id]);
        expect(instance.didMountCallback).toEqual(undefined);
        expect(instance.willUnmountCallback).toEqual(undefined);
        expect(instance.id).toMatch(/^jwplayer-\d+$/);
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
        it('forwards all non-component props into the setup config, including custom keys', async () => {
            const { instance } = await createMountedComponent({ _customAdServerData: { segment: 'sports' }, floating: {}, width: 500 });
            const setupConfig = window.jwplayer(instance.id).setup.mock.calls[0][0];
            const expectedSetupConfig = {
                _customAdServerData: { segment: 'sports' },
                floating: {},
                isReactComponent: true,
                playlist: 'https://cdn.jwplayer.com/v2/media/1g8jjku3',
                width: 500
            };
            expect(setupConfig).toEqual(expectedSetupConfig);
        });

        it('excludes component props and event handlers from the setup config', async () => {
            const { instance } = await createMountedComponent({
                didMountCallback: noop,
                willUnmountCallback: noop,
                onPlay: noop,
                onceReady: noop,
                width: 500
            });
            const setupConfig = window.jwplayer(instance.id).setup.mock.calls[0][0];
            expect(setupConfig).toEqual({
                isReactComponent: true,
                playlist: 'https://cdn.jwplayer.com/v2/media/1g8jjku3',
                width: 500
            });
        });

        it('Props overwrite matching base config properties', async () => {
            const baseConfig = { width: 400, height: 300 };
            const { instance } = await createMountedComponent({ config: baseConfig, _customAdServerData: { segment: 'sports' }, floating: {}, width: 500 });
            const setupConfig = window.jwplayer(instance.id).setup.mock.calls[0][0];
            const expectedSetupConfig = {
                _customAdServerData: { segment: 'sports' },
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

    describe('isDeepEqual', () => {
        it.each([
            ['identical primitives', 'a.mp4', 'a.mp4', true],
            ['different primitives', 'a.mp4', 'b.mp4', false],
            ['a primitive and an object', 'a.mp4', { file: 'a.mp4' }, false],
            ['null and an object', null, {}, false],
            ['an array and an object', [], {}, false],
            ['objects with different key counts', { a: 1 }, { a: 1, b: 2 }, false],
            ['objects with different keys', { a: undefined }, { b: undefined }, false],
            ['nested equal values', { a: [{ b: 1 }] }, { a: [{ b: 1 }] }, true],
            ['nested different values', { a: [{ b: 1 }] }, { a: [{ b: 2 }] }, false],
        ])('compares %s', (_name, a, b, expected) => {
            expect(isDeepEqual(a, b)).toBe(expected);
        });
    });

    describe('loadPlaylist', () => {
        const nextPlaylist = 'https://cdn.jwplayer.com/v2/media/QcK3l9Uv';

        // Mount with the given props, then re-render with the next set of props.
        const rerenderWith = async (props, nextProps) => {
            const ref = React.createRef();
            let rerender;
            await act(async () => {
                ({ rerender } = render(<JWPlayer ref={ref} library={library} {...props} />));
            });
            const { player } = ref.current;

            await act(async () => {
                rerender(<JWPlayer ref={ref} library={library} {...nextProps} />);
            });

            return player.load;
        };

        it('loads the new playlist when the playlist prop changes', async () => {
            const load = await rerenderWith({ playlist }, { playlist: nextPlaylist });
            expect(load.mock.calls).toEqual([[nextPlaylist]]);
        });

        it('loads the new playlist when playlist items change', async () => {
            const load = await rerenderWith(
                { playlist: [{ file: 'first.mp4' }] },
                { playlist: [{ file: 'second.mp4' }] }
            );
            expect(load.mock.calls).toEqual([[[{ file: 'second.mp4' }]]]);
        });

        it('does not reload when a new playlist array holds the same items', async () => {
            const load = await rerenderWith(
                { playlist: [{ file: 'same.mp4', tracks: [{ label: 'English' }] }] },
                { playlist: [{ file: 'same.mp4', tracks: [{ label: 'English' }] }] }
            );
            expect(load).not.toHaveBeenCalled();
        });

        it('loads the new playlist when it is nested in the config prop', async () => {
            const load = await rerenderWith(
                { config: { playlist } },
                { config: { playlist: nextPlaylist } }
            );
            expect(load.mock.calls).toEqual([[nextPlaylist]]);
        });

        it('does not reload when a config prop other than the playlist changes', async () => {
            const load = await rerenderWith({ playlist, width: 400 }, { playlist, width: 500 });
            expect(load).not.toHaveBeenCalled();
        });

        it.each([
            ['removed', undefined],
            ['null', null],
            ['an empty string', ''],
            ['an empty array', []],
        ])('does not reload when the playlist becomes %s', async (_name, nextValue) => {
            const load = await rerenderWith({ playlist }, { playlist: nextValue });
            expect(load).not.toHaveBeenCalled();
        });

        it('loads the new playlist when an event handler changes in the same update', async () => {
            const load = await rerenderWith(
                { playlist, onPlay: noop },
                { playlist: nextPlaylist, onPlay: () => {} }
            );
            expect(load.mock.calls).toEqual([[nextPlaylist]]);
        });

        it('sets up with the latest playlist when it changed before the library loaded', async () => {
            window.jwplayer = null;
            const ref = React.createRef();
            let rerender;
            act(() => {
                ({ rerender } = render(<JWPlayer ref={ref} library={library} playlist={playlist} />));
            });
            const script = Array.from(document.getElementsByTagName('script')).pop();

            // The playlist resolves while the library request is still in flight.
            act(() => {
                rerender(<JWPlayer ref={ref} library={library} playlist={nextPlaylist} />);
            });

            window.jwplayer = mockLibrary;
            await act(async () => {
                script.onload();
            });

            const { id, player } = ref.current;
            expect(window.jwplayer(id).setup.mock.calls)
                .toEqual([[{ playlist: nextPlaylist, isReactComponent: true }]]);
            expect(player.load).not.toHaveBeenCalled();
        });

        it('tracks the latest config even when the playlist is unchanged', async () => {
            const { instance } = await createMountedComponent();
            instance.shouldComponentUpdate({ playlist, width: 500 });
            expect(instance.config).toEqual({ playlist, width: 500, isReactComponent: true });
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

        it('does not create duplicate players when StrictMode remounts during library load', async () => {
            window.jwplayer = null;
            const ref = React.createRef();
            render(
                <React.StrictMode>
                    <JWPlayer ref={ref} library={library} playlist={playlist} />
                </React.StrictMode>
            );

            await act(async () => {});
            const scripts = Array.from(document.getElementsByTagName('script'));
            expect(scripts.length).toBeGreaterThan(0);

            window.jwplayer = mockLibrary;
            await act(async () => {
                scripts.forEach((script) => script.onload());
            });

            const { id } = ref.current;
            expect(window.jwplayer(id).setup.mock.calls.length).toBe(1);
        });

        const scriptsFor = (url) => Array.from(document.getElementsByTagName('script'))
            .filter((script) => script.src === url);

        it('reuses a single script tag when two players share a library', async () => {
            window.jwplayer = null;
            await act(async () => {
                render(<JWPlayer library={library} playlist={playlist} />);
                render(<JWPlayer library={library} playlist={playlist} />);
            });

            expect(scriptsFor(library).length).toBe(1);
        });

        it('logs, creates no player, and removes the dead script when the load fails', async () => {
            window.jwplayer = null;
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const ref = React.createRef();

            await act(async () => {
                render(<JWPlayer ref={ref} library={library} playlist={playlist} />);
            });
            const [script] = scriptsFor(library);

            await act(async () => {
                script.onerror(new Error('network error'));
            });

            expect(ref.current.player).toBe(null);
            expect(errorSpy).toHaveBeenCalled();
            expect(document.body.contains(script)).toBe(false);
        });

        it('appends a fresh script on retry after a failed load', async () => {
            window.jwplayer = null;
            jest.spyOn(console, 'error').mockImplementation(() => {});

            await act(async () => {
                render(<JWPlayer library={library} playlist={playlist} />);
            });
            const [failedScript] = scriptsFor(library);
            await act(async () => {
                failedScript.onerror(new Error('network error'));
            });

            await act(async () => {
                render(<JWPlayer library={library} playlist={playlist} />);
            });
            const scripts = scriptsFor(library);

            expect(scripts.length).toBe(1);
            expect(scripts[0]).not.toBe(failedScript);
        });

        it('does not evict a newer retry when a stale load fails late', async () => {
            window.jwplayer = null;
            // First load caches script A, then A is detached before it settles.
            const first = loadPlayer(library);
            const [scriptA] = scriptsFor(library);
            scriptA.remove();

            // A retry sees the detached entry and caches a fresh script B.
            const second = loadPlayer(library);
            const [scriptB] = scriptsFor(library);

            // A's late failure must not evict B's live cache entry.
            scriptA.onerror(new Error('stale failure'));
            await expect(first).rejects.toThrow('stale failure');

            // B still resolves, proving its entry survived.
            scriptB.onload();
            await expect(second).resolves.toBeUndefined();
        });
    });
});
