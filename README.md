# jwplayer-react

`<JWPlayer>` is a React Component for initializing an instance of JW Player's web player. It allows for any of the event hooks that can be used on the standard player, and provides access to the player API via `JWPlayer.api`.


## Contents

* [Installation](#installation)
* [Usage](#usage)
* Props
  * [Required Props](#required-props)
  * Optional Props
    * [Configuration](#optional-configuration-props)
    * [Event Hooks](#event-hooks)
      * [Advertising](#optional-advertising-event-hook-props)
      * [Player Events](#optional-player-event-hook-props)
      * [Time Events](#optional-time-event-hook-props)
* [Example Container Component](#example-container-component)
* [Contributing](#contributing)

## Installation

```shell
npm i https://github.com/zetagame/jwplayer-react
```

## Usage

### Standard player with file/library

``` javascript
import JWPlayer from 'jwplayer-react';
...
<JWPlayer
  file='https://path-to-my.mp4'
  library='https://path-to-my-jwplayer-library.js'
/>
...
```
### Platform-hosted playlist

``` javascript
import JWPlayer from 'jwplayer-react';
...
<JWPlayer
  library='https://path-to-my-jwplayer-library.js'
  playlist='https://cdn.jwplayer.com/v2/playlists/playlist_media_id'
/>
...
```

### Custom playlist

``` javascript
const playlist = [{
  file: 'myfile.mp4',
  image: 'myPoster.jpg',
  tracks: [{
    file: 'https://mySubtitles.vtt',
    label: 'English',
    kind: 'captions',
    'default': true
  }],
},
{
  file: 'mySecondFile.mp4',
  image: 'MysecondFilesPoster.jpg',
}];
...
<SomeReactView>
  <JWPlayer
    library='https://path-to-my-jwplayer-library.js'
    playlist={playlist}
  />
</SomeReactView>
...
```

## Required Props

These props are required to instantient an instance of JW Player:

* `library`
  * Must be a url to a jwplayer web player library. Required if jwplayer library not already instantiated on page (ie. if window.jwplayer is undefined).
  * Type: `string`
  * Example: `https://content.jwplatform.com/libraries/abcd1234.js`
* `playlist` OR `file` OR `advertising` block with `oustream: true`
  * Player will require content in order to instantiate. See more [here](https://developer.jwplayer.com/jwplayer/docs/jw8-player-configuration-reference).
  * Type: `string` (for `file` or `playlist`) or `array` (for `playlist`) or `object` for `advertising`
  * Example: `https://cdn.jwplayer.com/v2/playlists/abcd1234`


## Optional Configuration Props
* All config options can be individually passed as props. See the full list [here](https://developer.jwplayer.com/jwplayer/docs/jw8-player-configuration-reference), ie: `advertising`, `analytics`, `playlist`, `related`, `width`, `height`, etc.
* You can also use prop, `config`, a JSON config with all the available options/types of a standard player config.
* `didMountCallback`
  * A callback triggered after component mounts. Can be used to expose the player API to other parts of your app.
  * Type: (playerAPI) => void
  * Example: See [advanced implementation example](#advanced-implementation-example)

# Events/API Functionality

## Events
`jwplayer-react` dynamically supports all events in JW Player. Simply preface the event name with `on` (to fire every time) or `once` (to only fire the first time) and pass it in as a prop. See full list [here](https://developer.jwplayer.com/jwplayer/docs/jw8-javascript-api-reference)

Examples:
* `.on('ready', callback)` => `onReady={callback}`               // Executes callback every time `ready` triggered by API
* `.once('complete', callback)` => `onceComplete={callback}`     // Executes callback the first time `complete` is triggered by API
* `.on('time', callback)` => `onTime={callback}`                 // Executes callback every time `time` is triggered by API.


## API Functionality
`jwplayer-react` creates an instance of the player API when it mounts, and sets it to `this.player`. If you want to 



## Advanced Implementation Example

``` javascript
import React from 'react';
import JWPlayer from 'jwplaye-react';

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
    Object.keys(this.players).forEach(playerId => {
      const player = this.players[playerId];
      const isPlaying = player.getState() === 'playing';
      if (isPlaying) {
        player.pause();
      }
    });
  }
  
  // Put teal colored outline on currently playing player, remove it from all other players.
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
export default PlayerContainer;
```

## Contributing
Post issues, or put up PRs that solve pre-existing issues.
