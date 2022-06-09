/**
 * @jest-environment jsdom
 */

import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import JWPlayer from '../src/jwplayer';
import { mockLibrary, players } from './util';

Enzyme.configure({ adapter: new Adapter() });

const noop = () => {};

const playlist = 'https://cdn.jwplayer.com/v2/media/1g8jjku3';
const library = 'https://cdn.jwplayer.com/libraries/lqsWlr4Z.js';
let expectedInstance = -1;

beforeEach(() => {
    window.jwplayer = mockLibrary;
});

afterEach(() => {
    window.jwplayer = null;
})

describe('setup', () => {
    let component, mounted, instance;

    const setupTest = async (props) => {
        component = <JWPlayer {...props} />
        mounted = await mount(component);
        instance = mounted.instance();
        expectedInstance++;
        
    };

    const checkTests = () => {
        // Has ref
        expect(instance.ref).toBeTruthy();
        // Sets api instance to instance.player
        expect(instance.player).toBe(players[instance.id]);
        // Populates loadPromise
        expect(typeof instance.playerLoadPromise).toEqual('object');
        // Doesn't set didMount/WillUnmount callbacks if they aren't passed in props
        expect(instance.didMountCallback).toEqual(undefined)
        expect(instance.willUnmountCallback).toEqual(undefined);
        // Increments ID Properly
        expect(instance.id).toEqual(`jwplayer-${expectedInstance}`);
        // Invokes player setup with correct config
        expect(window.jwplayer(instance.id).setup.mock.calls.length).toBe(1);
        expect(window.jwplayer(instance.id).setup.mock.calls[0][0]).toEqual({ playlist: 'https://cdn.jwplayer.com/v2/media/1g8jjku3', isReactComponent: true });
    }

    it('sets up when jwplayer is pre-instantiated', (done) => {
        setupTest({ playlist }).then(checkTests).then(done);
    });

    it('sets up when jwplayer library provided', (done) => {
        setupTest({ playlist, library }).then(checkTests).then(done);
    });

    it('Errors with no library and falsey window.jwplayer', async () => {
        window.jwplayer = null;
        const _consoleError = console.error;
        console.error = jest.fn();

        await expect(setupTest).rejects.toThrow("jwplayer-react requires either a library prop, or a library script");
        
        console.error = _consoleError;
    });

    it('creates a script tag when mounted if window.jwplayer is not defined', () => {
        window.jwplayer = null;
        setupTest({ library, playlist });
        const script = document.getElementsByTagName('script')[0];
        expect(script instanceof HTMLScriptElement).toEqual(true);
    });
});

describe('methods', () => {
    const createMountedComponent = async (props) => {
        const component = <JWPlayer library={library} playlist={playlist} {...props} />;
        const mounted = await mount(component);
        return mounted;
    }

    describe('generateId', () => {
        it('increments index when generating unique ID', async () => {
            const component = await createMountedComponent();
            expectedInstance++;
            expect(component.instance().id).toEqual(`jwplayer-${expectedInstance}`);
            const component2 = await createMountedComponent();
            expect(component2.instance().id).toEqual(`jwplayer-${++expectedInstance}`);
            const component3 = await createMountedComponent();
            expect(component3.instance().id).toEqual(`jwplayer-${++expectedInstance}`);
        });
    });

    describe('generateConfig', () => {
        it('generates a setup config from props without assigning unsupported properties', async () => {
            const comp = await createMountedComponent({ unsupportedProperty: 3, floating: {}, width: 500 });
            const setupConfig = window.jwplayer(comp.instance().id).setup.mock.calls[0][0];
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
            const comp = await createMountedComponent({ config: baseConfig, unsupportedProperty: 3, floating: {}, width: 500 });
            const setupConfig = window.jwplayer(comp.instance().id).setup.mock.calls[0][0];
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
            }
            const comp = await createMountedComponent({ config: baseConfig });
            const setupConfig = window.jwplayer(comp.instance().id).setup.mock.calls[0][0];
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
        const component = await createMountedComponent({ onReady: noop, onPlay: noop, oncePause: noop});
        const id = component.instance().id;
        expect(window.jwplayer(id).once.mock.calls.length).toBe(1);
        expect(window.jwplayer(id).on.mock.calls.length).toBe(1);
        expect(window.jwplayer(id).on.mock.calls).toContainEqual(['all', expect.any(Function)]);
    });

    describe('updateOnEventListener', () => {
        it('fires on handler on event', async () => {
            const component = await createMountedComponent();
            component.instance().player.on = (name, handler) => {handler('play')};

            let fired = false;
            const nextProps = {onPlay: () => {fired = true}};
            component.instance().updateOnEventListener(nextProps);
            expect(fired).toBe(true);
        });

        it('fires all handler on all event', async () => {
            const component = await createMountedComponent();
            component.instance().player.on = (name, handler) => {handler('all')};

            let fired = false;
            const nextProps = {onAll: () => {fired = true}};
            component.instance().updateOnEventListener(nextProps);
            expect(fired).toBe(true);
        });

        it('removes previous on event listener', async () => {
            const component = await createMountedComponent();
            const offSpy = component.instance().player.off;

            const nextProps = {onPlay: noop};
            component.instance().updateOnEventListener(nextProps);
            expect(offSpy).toHaveBeenCalled();
        });
    });

    describe('didOnEventsChange', () => {
        it('should return false if on event props did not change', async () => {
            const component = await createMountedComponent();
            const nextProps = {unsupportedProperty: 3};
            const eventsChange = component.instance().didOnEventsChange(nextProps);
            expect(eventsChange).toBe(false);
        });

        it('should return true if on event props changed', async () => {
            const component = await createMountedComponent();
            const nextProps = {onPlay: noop};
            const eventsChange = component.instance().didOnEventsChange(nextProps);
            expect(eventsChange).toBe(true);
        });
    });

    describe('lifecycle', () => {
        it('mounts with callback', async () => {
            const spy = jest.fn();
            const mounted = await createMountedComponent({didMountCallback:(...args) => spy(...args)});
            await mounted.instance().componentDidMount();
            expect(spy).toHaveBeenCalled();
        });

        it('unmounts with callback', async () => {
            const spy = jest.fn();
            const mounted = await createMountedComponent({willUnmountCallback:(...args) => spy(...args)});
            const removeSpy = mounted.instance().player.remove

            mounted.unmount();
            expect(spy).toHaveBeenCalled();
            expect(removeSpy).toHaveBeenCalled();
        });

        it('can unmount without callback', async () => {
            const mounted = await createMountedComponent();
            const removeSpy = mounted.instance().player.remove

            mounted.unmount();
            expect(removeSpy).toHaveBeenCalled();
        });

        it('still unmounts if player externally destroyed', async () => {
            const mounted = await createMountedComponent();
            mounted.instance().player = null;
            mounted.unmount();
        });

        it('should update component if props have changed', async () => {
            const component = await createMountedComponent();
            const nextProps = {unsupportedProperty: 3};
            const shouldUpdate = component.instance().shouldComponentUpdate(nextProps);
            expect(shouldUpdate).toBe(true);
        });

        it('should not update component if on event props change', async () => {
            const component = await createMountedComponent();
            const nextProps = {onPlay: noop};
            const shouldUpdate = component.instance().shouldComponentUpdate(nextProps);
            expect(shouldUpdate).toBe(false);
        });
    });
});
