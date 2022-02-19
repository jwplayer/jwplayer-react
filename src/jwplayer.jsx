import React from 'react';
import { configProps, generateUniqueId } from './util';

class JWPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.ref = props.ref || React.createRef();
    this.config = this.generateConfig(props);
    this.player = null;
    this.playerLoadPromise = this.loadPlayer(props.library);
    this.didMountCallback = props.didMountCallback;
    this.willUnmountCallback = props.willUnmountCallback;
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
    if (window.jwplayer) return Promise.resolve(window.jwplayer);

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

  render() {
    return <div id={this.id} ref={this.ref}></div>;
  }
}

export default JWPlayer;