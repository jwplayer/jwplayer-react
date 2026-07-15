import * as React from 'react';

/**
 * Player setup options, passed through verbatim to `jwplayer().setup()`.
 * The player's config surface evolves independently of this package, so keys
 * are intentionally left open rather than enumerated here. See the official
 * configuration reference for the supported options and their shapes:
 * https://docs.jwplayer.com/players/reference/setup-options
 */
export type JWPlayerConfig = Record<string, unknown>;

export type EventCallback = (...args: unknown[]) => void;

/**
 * The player API instance returned by the global jwplayer(id) call.
 * Only the members this component interacts with are typed; the full API is
 * documented at https://docs.jwplayer.com/players/reference/javascript-player-api-introduction
 */
export interface JWPlayerApi {
    on(event: string, callback: EventCallback): JWPlayerApi;
    once(event: string, callback: EventCallback): JWPlayerApi;
    off(event?: string, callback?: EventCallback): JWPlayerApi;
    remove(): void;
    setup(config: JWPlayerConfig | object): JWPlayerApi;
    [member: string]: unknown;
}

export interface MountCallbackArguments {
    id: string;
    player: JWPlayerApi;
}

export interface UnmountCallbackArguments {
    id: string;
    /** null when the player was never created or was destroyed externally */
    player: JWPlayerApi | null;
}

export interface JWPlayerProps extends JWPlayerConfig {
    didMountCallback?: (args: MountCallbackArguments) => void;
    willUnmountCallback?: (args: UnmountCallbackArguments) => void;
    id?: string;
    /** Required unless a jwplayer library script is already loaded on the page */
    library?: string;
    /**
     * The `| object` arm accepts interface-typed configs, which lack the
     * implicit index signature TypeScript requires for Record assignability.
     */
    config?: JWPlayerConfig | object;
    /**
     * Config merging is shallow, so a top-level advertising prop replaces the
     * entire advertising block — both `config.advertising` and the player
     * library/dashboard defaults. Include the full ad config here, not just
     * the keys being changed. See the official reference for its shape:
     * https://docs.jwplayer.com/players/reference/advertising-config-ref
     */
    advertising?: JWPlayerConfig | object;
    /**
     * on<Event> props subscribe to player events; onAll fires for every event.
     * once<Event> props subscribe to the first firing only.
     */
    [eventProp: `on${string}`]: EventCallback;
}

/**
 * The mounted JWPlayer instance. A ref to the component resolves to this,
 * exposing the player API (`ref.current.player`) once `didMountCallback` has
 * fired, per the "API Functionality" section of the README.
 */
export interface JWPlayerInstance extends React.Component<JWPlayerProps> {
    /** The JW Player API instance; null until mounted or after unmount. */
    player: JWPlayerApi | null;
    /** The DOM id of the player container. */
    id: string;
}

declare const JWPlayer: React.ComponentClass<JWPlayerProps> & {
    new (props: JWPlayerProps): JWPlayerInstance;
};

export default JWPlayer;
