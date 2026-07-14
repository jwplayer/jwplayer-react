import * as React from 'react';

/**
 * Example: {"2500":"High","1000":"Medium"}
 */
type QualityLabels = Record<string, string>;

type Stretching = 'uniform' | 'exactfit' | 'fill' | 'none';

/**
 * Width in pixels or percentage
 */
type Width = number | string;

interface AppearanceConfig {
    aspectratio?: string;
    controls?: boolean;
    displaydescription?: boolean;
    displayHeading?: boolean;
    displayPlaybackLabel?: boolean;
    displaytitle?: boolean;
    height?: number;
    horizontalVolumeSlider?: boolean;
    nextUpDisplay?: boolean;
    qualityLabels?: QualityLabels;
    renderCaptionsNatively?: boolean;
    stretching?: Stretching;
    width?: Width;
}

type AutoStart = 'viewable';

/**
 * A positive value is an offset from the start of the video.
 * A negative value is an offset from the end of the video.
 * This property can be defined either as a number (-10) or a percentage as a string ("-2%")
 */
type NextUpOffset = string | number;

interface BehaviorConfig {
    aboutlink?: string;
    abouttext?: string;
    allowFullscreen?: boolean;
    autostart?: AutoStart;
    defaultBandwidthEstimate?: number;
    generateSEOMetadata?: boolean;
    liveSyncDuration?: number;
    mute?: boolean;
    nextupoffset?: NextUpOffset;
    pipIcon?: string;
    playbackRateControls?: boolean;
    playbackRates?: number[];
    playlistIndex?: number;
    repeat?: boolean;
}

type MediaType =
    | 'aac' | 'f4a' | 'f4v' | 'hls' | 'm3u' | 'm4v' | 'mov' | 'mp3'
    | 'mp4' | 'mpeg' | 'oga' | 'ogg' | 'ogv' | 'vorbis' | 'webm';

interface MediaConfig {
    file?: string;
    description?: string;
    image?: string;
    mediaid?: string;
    playlist?: string | object[];
    title?: string;
    type?: MediaType;
}

type Preload = 'metadata' | 'auto' | 'none';

interface RenderAndLoadingConfig {
    base?: string;
    flashplayer?: string;
    hlsjsdefault?: boolean;
    liveTimeout?: number;
    loadAndParseHlsMetadata?: boolean;
    preload?: Preload;
}

export type JWPlayerConfig =
    AppearanceConfig & BehaviorConfig & MediaConfig & RenderAndLoadingConfig;

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
    setup(config: Record<string, unknown>): JWPlayerApi;
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
    config?: JWPlayerConfig;
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
