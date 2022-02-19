# jwplayer-react

`<JWPlayer>` is a React Component for initializing an instance of JW Player's web player. It allows for any of the event hooks that can be used on the standard player, and provides access to the player API via `JWPlayer.api`.


## Contents

* [Installation](#installation)
* [Usage](#usage)
* Props
  * [Required Props](#required-props)
  * [Optional Props](#optional-props)
  * [Events](#events)
  * [API Functionality](#api-functionality)
* [Advanced Implementation Example](#advanced-implementation-example)
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
<JWPlayer
  library='https://path-to-my-jwplayer-library.js'
  playlist={playlist}
/>
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


## Optional Props
* All config options can be individually passed as props. See the full list [here](https://developer.jwplayer.com/jwplayer/docs/jw8-player-configuration-reference), ie: `advertising`, `analytics`, `playlist`, `related`, `width`, `height`, etc.
* You can also use a `config` prop: a JSON config object with all the available options/types of a standard player config.
* `didMountCallback`
  * A callback triggered after component mounts. Can be used to expose the player API to other parts of your app.
  * Type: ({api, id}) => void
  * Example: See [advanced implementation example](#advanced-implementation-example)
* `willUnmountCallback`
  * A callback triggered before component unmounts. Can be used to fire any final api calls to player before it is removed, or to inform a higher order component that a player has been removed.
  * Type: ({api, id}) => void
  * Example: See [advanced implementation example](#advanced-implementation-example)
* `on<Event>`
  * `jwplayer-react` dynamically supports all events in JW Player. Props beginning with `on` are parsed and added as JW Player event handlers. Find the full list of supported events [here]
  * Examples:
    * `onReady={callback}` => `playerInstance.on('ready', callback)`           // Executes callback every time `ready` event is triggered by player API
    * `onComplete={callback}` => `playerInstance.on('complete', callback)`     // Executes callback every time `complete` event is triggered by player API
    * `onTime={callback}` => `playerInstance.on('time', callback)`             // Executes callback every time `time` event is triggered by player API.
* `once<Event>`
  * `jwplayer-react` dynamically supports all events in JW Player. Props beginning with `once` are parsed and added as JW Player event handlers. Find the full list of supported events [here]
  * Examples:
    * `onceReady={callback}` => `playerInstance.once('ready', callback)`           // Executes callback the first time `ready` event is triggered by player API
    * `onceComplete={callback}` => `playerInstance.once('complete', callback)`     // Executes callback the first time `complete` event is triggered by player API
    * `onceTime={callback}` => `playerInstance.once('time', callback)`             // Executes callback the first time `time` event is triggered by player API.

## Events
(https://developer.jwplayer.com/jwplayer/docs/jw8-javascript-api-reference).




## API Functionality
For advanced usage,`jwplayer-react` creates an instance of the player API when mounted, and sets it to `this.player`, exposing all api functionality listed [here](https://developer.jwplayer.com/jwplayer/docs/jw8-javascript-api-reference). 



## Advanced Implementation Example

[Interactive Example](https://codepen.io/afrophysics/pen/oNopMBK/8cd58c84536dc8fdd180ef206687558f)

``` javascript
import React from 'react';
import JWPlayer from 'jwplaye-react';

class PlayerContainer extends React.Component {
  constructor(props) {
    super(props);
    this.players = {};
    this.onBeforePlay = this.onBeforePlay.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.playerMountedCallback = this.playerMountedCallback.bind(this);
    this.playerUnmountingCallback = this.playerUnmountingCallback.bind(this);
  }
  
  // Registers players as they mount
  playerMountedCallback({ player, id }) {
    this.players[id] = player;
  }

  // Nulls registered players as they unmount
  playerUnmountingCallback({ id }) {
    this.players[id] = null;
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
          didMountCallback={this.playerMountedCallback}
          willUnmountCallback={this.playerUnmountingCallback}
          playlist='https://cdn.jwplayer.com/v2/media/1g8jjku3'
          library='https://cdn.jwplayer.com/libraries/lqsWlr4Z.js'
        />
        <JWPlayer
          config={configDefaults}
          onBeforePlay={this.onBeforePlay}
          onPlay={this.onPlay}
          didMountCallback={this.playerMountedCallback}
          willUnmountCallback={this.playerUnmountingCallback}
          playlist='https://cdn.jwplayer.com/v2/media/QcK3l9Uv'
          library='https://cdn.jwplayer.com/libraries/lqsWlr4Z.js'
        />
        <JWPlayer
          config={configDefaults}
          onBeforePlay={this.onBeforePlay}
          onPlay={this.onPlay}
          didMountCallback={this.playerMountedCallback}
          willUnmountCallback={this.playerUnmountingCallback}
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
