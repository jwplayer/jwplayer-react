declare module '@jwplayer/jwplayer-react' {
    import type { ComponentType, HTMLProps } from 'react';

    /**
     * Example: {"2500":"High","1000":"Medium"}
     */
    type QualityLabels = Record<string, string>

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

    type MediaType = 'aac' | 'f4a' | 'f4v' | 'hls' | 'm3u' | 'm4v' | 'mov' | 'mp3' | 'mp4' | 'mpeg' | 'oga' | 'ogg' | 'ogv' | 'vorbis' | 'webm';

    interface MediaConfig {
        file?: string;
        description?: string;
        image?: string;
        mediaid?: string;
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

    /* eslint-disable max-len */
    export type JWPlayerConfig = AppearanceConfig & BehaviorConfig & MediaConfig & RenderAndLoadingConfig;

    export interface JWPlayer extends jwplayer.JWPlayer {

    }

    export interface DidMountCallbackArguments {
        id: string;
        player: JWPlayer;
    }

    type DidMountCallback = () => void;

    export interface JWPlayerProps extends JWPlayerConfig {
        didMountCallback?: DidMountCallback;
        willUnmountCallback?: () => void;
        id?: string;
        library: string;
        config?: JWPlayerConfig;
    }

    const JWPlayerComponent: ComponentType<JWPlayerProps & HTMLProps<HTMLVideoElement>>;

    export default JWPlayerComponent;
}
