var cerebral = require('cerebral');
var React = require('react');
var Store = require('immutable-store');
var EventEmitter = require('events').EventEmitter;

var eventHub = new EventEmitter();
var Value = cerebral.Value;

var Factory = function (state, defaultArgs) {

  var initialState = Store(state);

  state = initialState;

  var controller = cerebral.Controller({
    defaultArgs: defaultArgs,
    onReset: function () {
      state = initialState;
    },
    onSeek: function (seek, isPlaying, currentRecording) {
      state = state.import(currentRecording.initialState);
      eventHub.emit('change', state);
    },
    onUpdate: function () {
      eventHub.emit('change', state);
    },
    onGet: function (path) {
      return Value(path, state);
    },
    onSet: function (path, value) {
      var key = path.pop();
      state = Value(path, state).set(key, value);
    },
    onUnset: function (path, key) {
      state = Value(path, state).unset(key);
    },
    onPush: function (path, value) {
      state = Value(path, state).push(value);
    },
    onSplice: function () {
      var args = [].slice.call(arguments);
      var value = Value(args.shift(), state);
      state = value.splice.apply(value, args);
    },
    onMerge: function (path, value) {
      state = Value(path, state).merge(value);
    },
    onConcat: function () {
      var args = [].slice.call(arguments);
      var value = Value(args.shift(), state);
      state = value.concat.apply(value, args);
    },
    onPop: function (path) {
      state = Value(path, state).pop();
    },
    onShift: function (path, value) {
      state = Value(path, state).shift(value);
    },
    onUnshift: function (path) {
      state = Value(path, state).unshift();
    }
  });

  controller.injectInto = function (AppComponent) {
    return React.createElement(React.createClass({
      childContextTypes: {
        controller: React.PropTypes.object.isRequired
      },
      getChildContext: function () {
        return {
          controller: controller
        }
      },
      render: function () {
        return React.createElement(AppComponent);
      }
    }));
  };

  return controller;

};

Factory.Mixin = {
  contextTypes: {
    controller: React.PropTypes.object
  },
  componentWillMount: function () {
    this.signals = this.context.controller.signals;
    this.recorder = this.context.controller.recorder;
    eventHub.on('change', this._update);
    this._update(this.context.controller.get([]));
  },
  componentWillUnmount: function () {
    eventHub.removeListener('change', this._update);
  },
  _update: function (state) {
    if (!this.getStatePaths) {
      return;
    }
    var statePaths = this.getStatePaths();
    var newState = Object.keys(statePaths).reduce(function (newState, key) {
      newState[key] = Value(statePaths[key], state);
      return newState;
    }, {});
    this.setState(newState);
  }
};

Factory.Decorator = function (paths) {
  return function (Component) {
    return React.createClass({
      mixins: [Factory.Mixin],
      getStatePaths: function () {
        return paths || {};
      },
      render: function () {
        return React.createElement(Component, this.state);
      }
    });
  };
};

Factory.HOC = function (Component, paths) {
  return React.createClass({
    mixins: [Factory.Mixin],
    getStatePaths: function () {
      return paths || {};
    },
    render: function () {
      var state = this.state;
      var props = Object.keys(state).reduce(function (props, key) {
        props[key] = state[key];
        return props;
      }, {});
      props.signals = this.signals;
      props.recorder = this.recorder;
      return React.createElement(Component, props);
    }
  });
};

module.exports = Factory;
