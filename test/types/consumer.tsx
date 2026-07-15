/**
 * Typechecked by `npm run test:types` (tsc --noEmit) so the shipped declaration
 * file stays valid TypeScript and matches the component's public contract.
 * src/jwplayer-react.d.ts is copied verbatim into lib/ at build time, so
 * checking the source file checks what ships.
 */
import * as React from 'react';
import JWPlayer, {
    JWPlayerConfig,
    JWPlayerInstance,
    JWPlayerProps,
    MountCallbackArguments,
    UnmountCallbackArguments,
} from '../../src/jwplayer-react';

const props: JWPlayerProps = {
    library: 'https://cdn.jwplayer.com/libraries/abcd1234.js',
    playlist: 'https://cdn.jwplayer.com/v2/media/abcd1234',
    width: '100%',
    aspectratio: '16:9',
    config: { autostart: 'viewable' },
    onPlay: () => {},
    onAll: (event) => { void event; },
    onceReady: () => {},
    didMountCallback: ({ player, id }: MountCallbackArguments) => {
        player.on('play', () => {});
        player.setup({ playlist: [] });
        void id;
    },
    willUnmountCallback: ({ player }: UnmountCallbackArguments) => {
        if (player) {
            player.remove();
        }
    },
};

export const withSpreadProps = <JWPlayer {...props} />;

export const withInlineProps = (
    <JWPlayer
        library="https://cdn.jwplayer.com/libraries/abcd1234.js"
        playlist="https://cdn.jwplayer.com/v2/media/abcd1234"
        didMountCallback={({ player }) => { void player; }}
    />
);

// generateConfig() spreads `config` verbatim into setup(), so custom keys the
// player config reference doesn't document must typecheck, including as an
// inline literal (excess-property checking would otherwise reject them).
export const withCustomConfigData = (
    <JWPlayer
        library="https://cdn.jwplayer.com/libraries/abcd1234.js"
        playlist="https://cdn.jwplayer.com/v2/media/abcd1234"
        config={{ _customAdServerData: { segment: 'sports' } }}
    />
);

// All whitelisted player config options are usable as top-level props (per the
// README), including ones with no dedicated declaration and custom ad keys.
export const withTopLevelConfigProps = (
    <JWPlayer
        library="https://cdn.jwplayer.com/libraries/abcd1234.js"
        playlist="https://cdn.jwplayer.com/v2/media/abcd1234"
        floating={{ dismissible: true }}
        advertising={{
            client: 'googima',
            schedule: [{ offset: 'pre', tag: 'https://example.com/vast.xml' }],
            _customAdServerData: { segment: 'sports' },
        }}
    />
);

// Interface types get no implicit index signature, so `config` and
// `advertising` need their `| object` arm to accept interface-typed values.
interface AppPlayerConfig {
    file: string;
    autostart: boolean;
}
declare const appConfig: AppPlayerConfig;
export const withInterfaceTypedConfig = (
    <JWPlayer
        library="https://cdn.jwplayer.com/libraries/abcd1234.js"
        config={appConfig}
        didMountCallback={({ player }) => { player.setup(appConfig); }}
    />
);

// Declared props keep their strict types despite the open index signature.
// @ts-expect-error library must be a string
export const withBadLibrary = <JWPlayer library={123} />;
// @ts-expect-error config must be an object
export const withBadConfig = <JWPlayer config="nope" />;
// @ts-expect-error advertising must be an object
export const withBadAdvertising = <JWPlayer advertising="googima" />;
// @ts-expect-error on<Event> props must be functions
export const withBadEventProp = <JWPlayer onPlay="not-a-callback" />;

export const customConfig: JWPlayerConfig = {
    playlist: 'https://cdn.jwplayer.com/v2/media/abcd1234',
    _customAdServerData: { segment: 'sports' },
};

// A ref resolves to the mounted instance, exposing the player API directly.
const playerRef = React.createRef<JWPlayerInstance>();

export const withRef = <JWPlayer ref={playerRef} {...props} />;

export function usePlayerApi(): void {
    const { current } = playerRef;
    if (current && current.player) {
        current.player.on('play', () => {});
    }
    void current?.id;
}
