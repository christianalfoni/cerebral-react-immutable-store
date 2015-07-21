import React from 'react';
import Controller from 'controller';

const Decorator = Controller.Decorator;

const controller = Controller({
  list: ['foo']
});

controller.signal('test', function AddBar (args, state) {
  state.push('list', 'bar');
});

class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Hello world!</h1>
        <button onClick={() => this.props.signals.test()}>Add to list</button>
        <List/>
      </div>
    );
  }
}

App = Controller.HOC(App);

class List extends React.Component {
  render() {
    return <ul>{this.props.list.map((item, i) => <li key={i}>{item}</li>)}</ul>;
  }
}

List = Controller.HOC(List, {
  list: ['list']
});

React.render(controller.injectInto(App), document.body);
