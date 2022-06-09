import React from 'react';
import {
  ALL, ON_REGEX, ONCE_REGEX,
} from './const';
import {
  generateConfig, generateUniqueId, loadPlayer, getHandlerName,
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
    this.ref = props.ref || React.createRef();
    this.config = generateConfig(props);
    this.player = null;
    this.playerLoadPromise = loadPlayer(props.library);
    this.didMountCallback = props.didMountCallback;
    this.willUnmountCallback = props.willUnmountCallback;
    this.id = props.id || generateUniqueId();
  }

  async componentDidMount() {
    this.player = await this.createPlayer();
    this.createEventListeners();

    if (this.didMountCallback) {
      const { player, id } = this;
      this.didMountCallback({ player, id });
    }
  }

  shouldComponentUpdate(nextProps) {
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

    return this.playerLoadPromise.then(() => window.jwplayer(view.id).setup(setupConfig));
  }

  didOnEventsChange(nextProps) {
    const onEventFilter = (prop) => prop.match(ON_REGEX);
    const currEvents = Object.keys(this.props).filter(onEventFilter);
    const nextEvents = Object.keys(nextProps).filter(onEventFilter);
    const newEvents = nextEvents.some((event) => currEvents.indexOf(event) === -1);

    return nextEvents.length < currEvents.length
      || nextEvents.length > currEvents.length
      || newEvents;
  }

  createEventListeners() {
    Object.keys(this.props).forEach((prop) => {
      const onceHandlerName = getHandlerName(prop, ONCE_REGEX);
      if (onceHandlerName) {
        this.player.once(onceHandlerName, this.props[prop]);
      }
    });

    const onHandler = createOnEventHandler(this.props);
    this.player.on(ALL, onHandler);
  }

  updateOnEventListener(nextProps) {
    this.player.off(ALL);

    const onHandler = createOnEventHandler(nextProps);
    this.player.on(ALL, onHandler);
  }

  render() {
    return <div id={this.id} ref={this.ref} />;
  }
}

export default JWPlayer;
