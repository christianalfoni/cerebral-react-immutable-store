# cerebral-react-immutable-store
Cerebral package with react and immutable store

## Requirements
It is required that you use a Webpack or Browserify setup. Read more at [The ultimate webpack setup](http://www.christianalfoni.com/articles/2015_04_19_The-ultimate-webpack-setup) for an example.

## Debugger
You can download the Chrome debugger [here](https://chrome.google.com/webstore/detail/cerebral-debugger/ddefoknoniaeoikpgneklcbjlipfedbb?hl=no).

## More info on Cerebral and video introduction
Cerebral main repo is located [here](https://github.com/christianalfoni/cerebral) and a video demonstration can be bound [here](https://www.youtube.com/watch?v=xCIv4-Q2dtA).

## Install
`npm install cerebral-react-immutable-store`

## API
All examples are shown with ES6 syntax.

### Instantiate a Cerebral controller
```js
import React from 'react';
import AppComponent from './AppComponent.js';
import Controller from 'cerebral-react-immutable-store';
import request from 'superagent';

// The initial state of the application
const state = {
  isLoading: false,
  user: null,
  error: null
};

// Any default arguments you want each action to receive
const defaultArgs = {
  utils: {
    request: request
  }
};

// Instantiate the controller
const controller = Controller(state, defaultArgs);

React.render(controller.injectInto(AppComponent), document.body);
```
With immutable-store you can also map state using functions, read more about that [here](https://github.com/christianalfoni/immutable-store#mapping-state).

### Create signals
```js
const controller = Controller(state, defaultArgs);

// We create an action
const setLoading = function (args, state) {
  state.set('isLoading', true);
};

// This action has a third promise argument because it will be
// run async in the signal. We either reject or resolve, which
// will lead our signal into two different paths
const getUser = function (args, state, promise) {
  args.utils.request('/user', function (err, response) {
    if (err) {
      promise.reject({
        error: err
      });
    } else {
      promise.resolve({
        user: JSON.parse(response)
      });
    }
  });
};

// Since our previous action resolved with a user property this will now
// be available as an argument
const setUser = function (args, state) {
  state.set('user', args.user);
};

// If the promise was rejected, this will run
const setError = function (args, state) {
  state.set('error', args.error);
};

const unsetLoading = function (args, state) {
  state.set('isLoading', false);
};

// And now we define the signal. An application has many signals with many actions and
// all actions can be used across different signals. This composability makes you very
// productive. All actions are also pure, making them very easy to test
controller.signal('appMounted',
  setLoading,
  [getUser, {
    success: [setUser],
    reject: [setError]
  }],
  unsetLoading
);

React.render(controller.injectInto(AppComponent), document.body);
```

### Using the controller in a component

#### Decorator
```js
import React from 'react';
import {Decorator as State} from 'cerebral-react-immutable-store';

@State({
  isLoading: ['isLoading'],
  user: ['user'],
  error: ['error']  
})
class App extends React.Component {
  componentDidMount() {
    this.props.signals.appMounted();
  }
  render() {
    return (
      <div>
        {this.props.isLoading ? 'Loading...' : 'hello ' + this.props.user.name}
        {this.props.error ? this.props.error : null}
      </div>
    );
  }
}
```

#### Higher Order Component
```js
import React from 'react';
import {HOC} from 'cerebral-react-immutable-store';

class App extends React.Component {
  componentDidMount() {
    this.props.signals.appMounted();
  }
  render() {
    return (
      <div>
        {this.props.isLoading ? 'Loading...' : 'hello ' + this.props.user.name}
        {this.props.error ? this.props.error : null}
      </div>
    );
  }
}

App = HOC(App, {
  isLoading: ['isLoading'],
  user: ['user'],
  error: ['error']  
});
```

#### Mixin
```js
import React from 'react';
import {Mixin} from 'cerebral-react-immutable-store';

const App = React.createClass({
  mixins: [Mixin],
  getStatePaths() {
    return {
      isLoading: ['isLoading'],
      user: ['user'],
      error: ['error']  
    };
  },
  componentDidMount() {
    this.props.signals.appMounted();
  },
  render() {
    return (
      <div>
        {this.state.isLoading ? 'Loading...' : 'hello ' + this.state.user.name}
        {this.state.error ? this.state.error : null}
      </div>
    );
  }
});
```

### Listening to changes
```js
const onChange = function (state) {
  state // New state
};
controller.eventEmitter.on('change', onChange);
controller.eventEmitter.removeListener('change', onChange);
```
