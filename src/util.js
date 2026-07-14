import configProps from './config-props';

let idIndex = -1;
export function generateUniqueId() {
  idIndex++;
  const id = `jwplayer-${idIndex}`;
  return id;
}

export function createPlayerLoadPromise(url) {
  const script = document.createElement('script');
  const promise = new Promise((res, rej) => {
    script.onload = res;
    script.onerror = rej;
  });
  script.src = url;
  document.body.append(script);

  return { script, promise };
}

// Reuse an in-flight library load (keyed by URL) so StrictMode remounts or
// multiple players sharing a library don't inject duplicate script tags. An
// entry is ignored once its script leaves the DOM, so a removed or failed load
// can be retried.
const loadPromises = new Map();

export function loadPlayer(url) {
  if (!window.jwplayer && !url) throw new Error('jwplayer-react requires either a library prop, or a library script');
  if (window.jwplayer) return Promise.resolve();

  const pending = loadPromises.get(url);
  if (pending && pending.script.isConnected) {
    return pending.promise;
  }

  const { script, promise } = createPlayerLoadPromise(url);
  const tracked = promise.catch((error) => {
    // Drop the cached rejection and the dead script so a later mount retries
    // with a fresh element instead of leaving an orphaned tag in the DOM. Only
    // evict our own entry, never a newer retry that already replaced it.
    const current = loadPromises.get(url);
    if (current && current.script === script) {
      loadPromises.delete(url);
    }
    script.remove();
    throw error;
  });
  loadPromises.set(url, { script, promise: tracked });

  return tracked;
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
