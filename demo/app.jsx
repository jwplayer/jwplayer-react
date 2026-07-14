import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import JWPlayer from '../src/jwplayer';

const LIBRARY = 'https://cdn.jwplayer.com/libraries/ZMmVnLUo.js';
const PLAYLIST = 'https://cdn.jwplayer.com/v2/media/1g8jjku3';

const HIGHLIGHT_EVENTS = new Set([
  'play', 'pause', 'complete', 'error', 'ready', 'setupError',
]);

function App() {
  const [events, setEvents] = useState([]);
  const [playerReady, setPlayerReady] = useState(false);

  const addEvent = useCallback((name, detail) => {
    setEvents((prev) => {
      const entry = {
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        name,
      };
      const next = [entry, ...prev];
      return next.length > 200 ? next.slice(0, 200) : next;
    });
  }, []);

  const clearLog = useCallback(() => setEvents([]), []);

  const handleMount = useCallback(({ id }) => {
    setPlayerReady(true);
    addEvent('didMountCallback', { id });
  }, [addEvent]);

  const handleUnmount = useCallback(({ id }) => {
    addEvent('willUnmountCallback', { id });
  }, [addEvent]);

  return (
    <div>
      <div className="player-card">
        <div className="card-header">
          <h2>Player</h2>
          <span className="tag">{playerReady ? 'READY' : 'LOADING'}</span>
        </div>
        <div className="player-wrapper">
          <JWPlayer
            library={LIBRARY}
            playlist={PLAYLIST}
            width="100%"
            aspectratio="16:9"
            didMountCallback={handleMount}
            willUnmountCallback={handleUnmount}
            onAll={(name, detail) => addEvent(name, detail)}
          />
        </div>
      </div>

      <div className="event-log-section">
        <div className="card-header">
          <h2>Event Log</h2>
          <button type="button" onClick={clearLog}>CLEAR</button>
        </div>
        <div className="event-log">
          {events.length === 0 ? (
            <div className="empty-log">Waiting for events...</div>
          ) : (
            events.map((e, i) => (
              <div
                key={i}
                className={`event-entry${HIGHLIGHT_EVENTS.has(e.name) ? ' highlight' : ''}`}
              >
                <span className="timestamp">{e.time}</span>
                <span className="event-name">{e.name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="code-block">
        <div className="card-header">
          <h2>Usage</h2>
        </div>
        <pre>
          <code
            dangerouslySetInnerHTML={{
              __html:
                '<span class="kw">import</span> <span class="comp">JWPlayer</span> <span class="kw">from</span> <span class="str">\'@jwplayer/jwplayer-react\'</span>;\n\n'
                + '<span class="kw">function</span> <span class="fn">VideoPage</span>() {\n'
                + '  <span class="kw">return</span> (\n'
                + '    <span class="cmt">&lt;</span><span class="comp">JWPlayer</span>\n'
                + '      <span class="prop">library</span>=<span class="str">"https://cdn.jwplayer.com/libraries/YOUR_ID.js"</span>\n'
                + '      <span class="prop">playlist</span>=<span class="str">"https://cdn.jwplayer.com/v2/media/MEDIA_ID"</span>\n'
                + '      <span class="prop">width</span>=<span class="str">"100%"</span>\n'
                + '      <span class="prop">onReady</span>={<span class="fn">handleReady</span>}\n'
                + '      <span class="prop">onPlay</span>={<span class="fn">handlePlay</span>}\n'
                + '      <span class="prop">didMountCallback</span>={<span class="fn">handleMount</span>}\n'
                + '    <span class="cmt">/&gt;</span>\n'
                + '  );\n'
                + '}',
            }}
          />
        </pre>
      </div>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<App />);
