/**
 * Typechecked by `npm run test:types` (tsc --noEmit) so the shipped declaration
 * file stays valid TypeScript and matches the component's public contract.
 * src/jwplayer-react.d.ts is copied verbatim into lib/ at build time, so
 * checking the source file checks what ships.
 */
import * as React from 'react';
import JWPlayer, {
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
