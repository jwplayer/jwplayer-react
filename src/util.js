import configProps from './config-props';

let idIndex = -1;
export function generateUniqueId() {
  idIndex++;
  const id = `jwplayer-${idIndex}`;
  return id;
}

export function createPlayerLoadPromise(url) {
  return new Promise((res, rej) => {
    const script = document.createElement('script');
    script.onload = res;
    script.onerror = rej;
    script.src = url;

    document.body.append(script);
  });
}

export function loadPlayer(url) {
  if (!window.jwplayer && !url) throw new Error('jwplayer-react requires either a library prop, or a library script');
  if (window.jwplayer) return Promise.resolve();

  return createPlayerLoadPromise(url);
}

export function generateConfig(props) {
  const config = {};

  Object.keys(props).forEach((key) => {
    if (configProps.has(key)) config[key] = props[key];
  });

  return { ...props.config, ...config, isReactComponent: true };
}

export function getHandlerName(prop, regex) {
  const match = prop.match(regex) || ['', ''];

  // lowercase the first letter of the match and return
  return match[1].charAt(0).toLowerCase() + match[1].slice(1);
}
