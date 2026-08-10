import React from 'react';
import {
  ALL, ON_REGEX, ONCE_REGEX,
} from './const';
import {
  generateConfig, generateUniqueId, loadPlayer, getHandlerName, isDeepEqual,
} from './util';

function createOnEventHandler(props) {
  return (name, optReturn) => {
    Object.keys(props).forEach((prop) => {
      const onHandlerName = getHandlerName(prop, ON_REGEX);
      if (onHandlerName === name) {
        props[prop](optReturn);
      }
      if (onHandlerName === ALL) {
        props[prop](name, optReturn);
      }
    });
  };
}
class JWPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.config = generateConfig(props);
    this.player = null;
    this.didMountCallback = props.didMountCallback;
    this.willUnmountCallback = props.willUnmountCallback;
    this.id = props.id || generateUniqueId();
    this.onHandler = null;
    this.library = props.library;
  }

  async componentDidMount() {
    try {
      await loadPlayer(this.library);
    } catch (error) {
      // A failed library load must not surface as an unhandled rejection in the
      // consumer's app; log it and leave the player uninitialized.
      // eslint-disable-next-line no-console
      console.error('jwplayer-react: failed to load the player library', error);
      return;
    }

    // The library loads asynchronously: bail if the component unmounted in the
    // meantime (ref detached), or if an overlapping mount already created the
    // player (StrictMode's dev remount can start a second load before the first
    // resolves). A completed mount/unmount/mount cycle still recreates the player.
    if (this.player || !this.ref.current) {
      return;
    }

    this.player = this.createPlayer();
    this.createEventListeners();

    if (this.didMountCallback) {
      const { player, id } = this;
      this.didMountCallback({ player, id });
    }
  }

  shouldComponentUpdate(nextProps) {
    const prevPlaylist = this.config.playlist;

    // Track the latest props even before the player exists: a change that lands
    // while the library is still loading has to reach the pending setup() call.
    this.config = generateConfig(nextProps);

    if (!this.player) {
      return false;
    }

    // The rendered output is always the same container div, so a playlist
    // change reaches the player through its API here, not through a re-render.
    this.loadPlaylist(prevPlaylist);

    if (this.didOnEventsChange(nextProps)) {
      this.updateOnEventListener(nextProps);
      return false;
    }

    return true;
  }

  componentWillUnmount() {
    if (this.willUnmountCallback) {
      const { player, id } = this;
      this.willUnmountCallback({ player, id });
    }

    if (this.player) {
      this.player.off();
      this.player.remove();
      this.player = null;
    }
  }

  createPlayer() {
    const { config, ref } = this;
    const setupConfig = { ...window.jwDefaults, ...config };
    const view = ref.current;

    return window.jwplayer(view.id).setup(setupConfig);
  }

  // Load new content when the playlist changes. Only the playlist is applied
  // after setup: the rest of the config is read by the player when it is
  // created, and re-running setup() to change it would tear down playback.
  // https://docs.jwplayer.com/players/reference/javascript-player-api-introduction
  loadPlaylist(prevPlaylist) {
    const { playlist } = this.config;

    // An absent or empty playlist means the content has not resolved yet, not
    // that a playing player should be blanked out.
    if (playlist == null || playlist.length === 0) {
      return;
    }

    if (isDeepEqual(prevPlaylist, playlist)) {
      return;
    }

    this.player.load(playlist);
  }

  didOnEventsChange(nextProps) {
    const onEventFilter = (prop) => prop.match(ON_REGEX);
    const currEvents = Object.keys(this.props).filter(onEventFilter).sort();
    const nextEvents = Object.keys(nextProps).filter(onEventFilter).sort();

    if (nextEvents.length !== currEvents.length) {
      return true;
    }

    const newEvents = nextEvents.some((event, index) => currEvents[index] !== event
      || nextProps[event] !== this.props[event]);

    return newEvents;
  }

  createEventListeners() {
    Object.keys(this.props).forEach((prop) => {
      const onceHandlerName = getHandlerName(prop, ONCE_REGEX);
      if (onceHandlerName) {
        this.player.once(onceHandlerName, this.props[prop]);
      }
    });

    // each on event is handled through the on('ALL') event listener instead of its own listener
    this.onHandler = createOnEventHandler(this.props);
    this.player.on(ALL, this.onHandler);
  }

  updateOnEventListener(nextProps) {
    if (this.onHandler) {
      this.player.off(ALL, this.onHandler);
    }

    this.onHandler = createOnEventHandler(nextProps);
    this.player.on(ALL, this.onHandler);
  }

  render() {
    return <div id={this.id} ref={this.ref} />;
  }
}

export default JWPlayer;
