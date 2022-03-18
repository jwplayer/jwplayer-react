import configProps from './config-props';

let idIndex = -1;
export function generateUniqueId() {
  idIndex++;
  const id = `jwplayer-${idIndex}`;
  return id;
}

export function createPlayerLoadPromise(src) {
  return new Promise((res, rej) => {
    const script = document.createElement('script');
    script.onload = res;
    script.onerror = rej;
    script.src = src;

    document.body.append(script);
  });
}

export function loadPlayer(src) {
  if (!window.jwplayer && !src) throw new Error('jwplayer-react requires either a library prop, or a library script');
  if (window.jwplayer) return Promise.resolve();

  return createPlayerLoadPromise();
}

export function generateConfig(props) {
  const config = {};

  Object.keys(props).forEach((key) => {
    if (configProps.has(key)) config[key] = props[key];
  });

  return { ...props.config, ...config };
}
