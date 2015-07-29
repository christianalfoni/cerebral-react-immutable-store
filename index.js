var cerebral = require('cerebral');
var React = require('react');
var Store = require('immutable-store');
var EventEmitter = require('events').EventEmitter;

var Value = cerebral.Value;

var Factory = function (state, defaultArgs) {

  var eventEmitter = new EventEmitter();
  var initialState = Store(state);

  state = initialState;

  var controller = cerebral.Controller({
    defaultArgs: defaultArgs,
    onReset: function () {
      state = initialState;
    },
    onSeek: function (seek, isPlaying, currentRecording) {
      state = state.import(currentRecording.initialState);
      eventEmitter.emit('change', state);
    },
    onUpdate: function () {
      eventEmitter.emit('change', state);
    },
    onRemember: function () {
      eventEmitter.emit('remember', state);
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

  controller.eventEmitter = eventEmitter;

  return controller;

};

Factory.Mixin = {
  contextTypes: {
    controller: React.PropTypes.object
  },
  componentWillMount: function () {
    this.signals = this.context.controller.signals;
    this.recorder = this.context.controller.recorder;
    this.context.controller.eventEmitter.on('change', this._update);
    this.context.controller.eventEmitter.on('remember', this._update);
    this._update(this.context.controller.get([]));
  },
  componentWillUnmount: function () {
    this._isUmounting = true;
    this.context.controller.eventEmitter.removeListener('change', this._update);
    this.context.controller.eventEmitter.removeListener('remember', this._update);
  },
  _update: function (state) {
    if (this._isUmounting || !this.getStatePaths) {
      return;
    }
    var statePaths = this.getStatePaths();
    var newState = Object.keys(statePaths).reduce(function (newState, key) {
      newState[key] = Value(statePaths[key], state);
      return newState;
    }, {});
    this.setState(newState);
  },
  _getControllerProps : function(){
    var state = this.state;
    var props = Object.keys(state).reduce(function (props, key) {
      props[key] = state[key];
      return props;
    }, {});
    props.signals = this.signals;
    props.recorder = this.recorder;
    return props;
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
        var props = this._getControllerProps.apply(this);
        return React.createElement(Component, props);
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
      var props = this._getControllerProps.apply(this);
      return React.createElement(Component, props);
    }
  });
};

module.exports = Factory;
