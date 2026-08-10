import { ON_REGEX } from './const';

// Props that configure this component rather than the player. Everything else
// is forwarded verbatim into setup(), so the player — not this wrapper —
// decides which config keys are meaningful.
const componentProps = new Set([
  'children',
  'config',
  'didMountCallback',
  'id',
  'library',
  'willUnmountCallback',
]);

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

// How long to wait for a library the consumer loads themselves before giving up.
export const EXTERNAL_LIBRARY_TIMEOUT_MS = 10000;
const EXTERNAL_LIBRARY_POLL_MS = 50;

// window.jwplayer must be callable, not merely present: a library script that is
// still executing, or a placeholder left by another integration, would otherwise
// be mistaken for a ready player and fail inside setup().
function isLibraryReady() {
  return typeof window.jwplayer === 'function';
}

// Without a library prop the consumer loads the script themselves — a Next.js
// <Script>, a tag in index.html — and that script can still be pending when a
// player mounts. Nothing fires an event when window.jwplayer is assigned, so
// poll for it instead of failing the mount outright.
function waitForExternalLibrary() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + EXTERNAL_LIBRARY_TIMEOUT_MS;
    const poll = setInterval(() => {
      if (isLibraryReady()) {
        clearInterval(poll);
        resolve();
        return;
      }

      if (Date.now() >= deadline) {
        clearInterval(poll);
        reject(new Error('jwplayer-react requires either a library prop, or a library script. Waited '
          + `${EXTERNAL_LIBRARY_TIMEOUT_MS}ms for window.jwplayer and it was never defined.`));
      }
    }, EXTERNAL_LIBRARY_POLL_MS);
  });
}

export function loadPlayer(url) {
  if (isLibraryReady()) return Promise.resolve();
  if (!url) return waitForExternalLibrary();

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
    if (componentProps.has(key)) return;
    // on* event handler props (once* also matches ON_REGEX) are not config
    if (key.match(ON_REGEX)) return;
    config[key] = props[key];
  });

  return { ...props.config, ...config, isReactComponent: true };
}

export function getHandlerName(prop, regex) {
  const match = prop.match(regex) || ['', ''];

  // lowercase the first letter of the match and return
  return match[1].charAt(0).toLowerCase() + match[1].slice(1);
}
