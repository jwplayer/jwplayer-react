const configProps = [
  "hlsjsProgressive",
  "__abSendDomainToFeeds",
  "_abZoomThumbnail",
  "advertising",
  "aboutlink",
  "abouttext",
  "aestoken",
  "allowFullscreen",
  "analytics",
  "androidhls",
  "aspectratio",
  "autoPause",
  "autostart",
  "base",
  "captions",
  "cast",
  "controls",
  "defaultBandwidthEstimate",
  "description",
  "displaydescription",
  "displayHeading",
  "displayPlaybackLabel",
  "displaytitle",
  "drm",
  "duration",
  "enableDefaultCaptions",
  "events",
  "file",
  "forceLocalizationDefaults",
  "fwassetid",
  "floating",
  "ga",
  "generateSEOMetadata",
  "height",
  "hlsjsConfig",
  "hlsjsdefault",
  "horizontalVolumeSlider",
  "image",
  "intl",
  "key",
  "listbar",
  "liveSyncDuration",
  "liveTimeout",
  "localization",
  "logo",
  "mediaid",
  "mute",
  "nextUpDisplay",
  "nextupoffset",
  "pad",
  "ph",
  "pid",
  "pipIcon",
  "playbackRateControls",
  "playbackRates",
  "playlist",
  "playlistIndex",
  "plugins",
  "preload",
  "qualityLabel",
  "qualityLabels",
  "recommendations",
  "related",
  "renderCaptionsNatively",
  "repeat",
  "safarihlsjs",
  "sdkplatform",
  "selectedBitrate",
  "setTimeEvents",
  "skin",
  "sharing",
  "sources",
  "stagevideo",
  "streamtype",
  "stretching",
  "title",
  "tracks",
  "type",
  "variations",
  "volume",
  "width",
  "withCredentials",
  "doNotTrack",
  "doNotTrackCookies",
  "images"
];
let idCount = -1;

const generateUniqueId = () => {
  idCount++;
  const id = 'jwplayer-' + idCount;
  return id;
}

class JWPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.ref = props.ref || React.createRef();
    this.config = this.generateConfig(props);
    this.player = null;
    this.playerLoadPromise = this.loadPlayer(props.library);
    this.didMountCallback = props.didMountCallback;
    this.id = props.id || this.generatePlayerId();
  }

  createPlayer() {
    const { config, ref } = this;
    const view = ref.current;
    if (!window.jwplayer) {
      return this.playerLoadPromise.then(() => {
        const setupConfig = Object.assign({}, window.jwDefaults, config);
        return window.jwplayer(view.id).setup(setupConfig);
      });
    }

    return window.jwplayer(view.id).setup(config);
  }

  loadPlayer(src) {
    if (!window.jwplayer && !src) throw new Error("JWPlayer React requires either a library prop, or a library script");
    if (window.jwplayer) return new Promise.resolve(window.jwplayer);

    if (!this.playerLoadPromise) {
      this.playerLoadPromise = new Promise((res, rej) => {
        const script = document.createElement('script');
        script.onload = res;
        script.onerror = rej;
        script.src = src;

        document.body.append(script);
      });
    }

    return this.playerLoadPromise;
  }

  generatePlayerId() {
    return generateUniqueId()
  }

  generateConfig(props) {
    const config = {};

    for (let key of configProps) {
      if (key in props) config[key] = props[key];
    }

    return Object.assign({}, props.config, config);
  }

  createEventListeners() {
    Object.keys(this.props).forEach(prop => {
      const matchedOnce = prop.match('(?<=\^once).*') || [''];
      const onceHandlerHane = matchedOnce[0].charAt(0).toLowerCase() + matchedOnce[0].slice(1);

      if (!!onceHandlerHane) {
        this.player.once(onceHandlerHane, this.props[prop]);
        return;
      }

      const matchedOn = prop.match('(?<=\^on).*') || [''];
      const eventHandlerName = matchedOn[0].charAt(0).toLowerCase() + matchedOn[0].slice(1);

      if (!!eventHandlerName) {
        this.player.on(eventHandlerName, this.props[prop]);
      }
    });
  }

  async componentDidMount() {
    this.player = await this.createPlayer();

    const { player, id } = this;

    this.createEventListeners();
    this.didMountCallback({ player, id });
  }

  componentWillUnmount() {
    this.player.remove();
    this.player = null;
  }

  render() {
    return <div id={this.id} ref={this.ref}></div>;
  }
}

class PlayerContainer extends React.Component {
  constructor(props) {
    super(props);
    this.players = {};
    this.onBeforePlay = this.onBeforePlay.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.didMountCallback = this.didMountCallback.bind(this);
  }
  
  // Registers players as they mount
  didMountCallback({ player, id }) {
    this.players[id] = player;
  }

  // Custom script that prevents multiple players from playing simultaneously
  onBeforePlay(event) {
    this.pauseAllPlaying();
  }
  
  // Put teal outline on currently playing player, removes from all other players.
  onPlay(event) {
    Object.keys(this.players).forEach(playerId => {
      const player = this.players[playerId];
      const container = player.getContainer();
      if (player.getState() === 'playing') {
        container.style.border = '15px solid #00FFFF';
      } else {
        container.style.border = '';
      }
    });
  }
  
  pauseAllPlaying() {
    Object.keys(this.players).forEach(playerId => {
      const player = this.players[playerId];
      const isPlaying = player.getState() === 'playing';
      if (isPlaying) {
        player.pause();
      }
    });
  }

  render() {
    // Re-usable defaults to use between multiple players.
    const configDefaults = { width: 320, height: 180 };

    return (
      <div className='players-container'>
        <JWPlayer
          config={configDefaults}
          onBeforePlay={this.onBeforePlay}
          onPlay={this.onPlay}
          didMountCallback={this.didMountCallback}
          playlist='https://cdn.jwplayer.com/v2/media/1g8jjku3'
          library='https://cdn.jwplayer.com/libraries/lqsWlr4Z.js'
        />
        <JWPlayer
          config={configDefaults}
          onBeforePlay={this.onBeforePlay}
          onPlay={this.onPlay}
          didMountCallback={this.didMountCallback}
          playlist='https://cdn.jwplayer.com/v2/media/QcK3l9Uv'
          library='https://cdn.jwplayer.com/libraries/lqsWlr4Z.js'
        />
        <JWPlayer
          config={configDefaults}
          onBeforePlay={this.onBeforePlay}
          onPlay={this.onPlay}
          didMountCallback={this.didMountCallback}
          playlist='https://cdn.jwplayer.com/v2/playlists/B8FTSH9D'
          playlistIndex="1"
          library='https://cdn.jwplayer.com/libraries/lqsWlr4Z.js'
        />
      </div>
    );
  }
}

ReactDOM.render(<PlayerContainer />, document.getElementById('root'));