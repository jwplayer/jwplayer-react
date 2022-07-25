import React from 'react';
import { generateConfig, generateUniqueId, loadPlayer } from './util';

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

  componentWillUnmount() {
    if (this.willUnmountCallback) {
      const { player, id } = this;
      this.willUnmountCallback({ player, id });
    }

    if (this.player) {
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

  createEventListeners() {
    Object.keys(this.props).forEach((prop) => {
      const matchedOnce = prop.match('^once(.*)') || ['', ''];
      const onceHandlerName = matchedOnce[1].charAt(0).toLowerCase() + matchedOnce[1].slice(1);

      if (onceHandlerName) {
        this.player.once(onceHandlerName, this.props[prop]);
        return;
      }

      const matchedOn = prop.match('^on(.*)') || ['', ''];
      const eventHandlerName = matchedOn[1].charAt(0).toLowerCase() + matchedOn[1].slice(1);

      if (eventHandlerName) {
        this.player.on(eventHandlerName, this.props[prop]);
      }
    });
  }

  render() {
    return <div id={this.id} ref={this.ref} />;
  }
}

export default JWPlayer;
