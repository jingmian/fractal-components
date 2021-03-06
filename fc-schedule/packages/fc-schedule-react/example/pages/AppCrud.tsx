import React, { Component } from 'react';

import { GanttTimeLine } from '../../src';
import './App.css';
import { getRandomColor } from './Generator';

export class AppCrud extends Component<any, any> {
  constructor(props) {
    super(props);
    let d1 = new Date();
    let d2 = new Date();
    d2.setDate(d2.getDate() + 5);
    let d3 = new Date();
    d3.setDate(d3.getDate() + 8);
    let d4 = new Date();
    d4.setDate(d4.getDate() + 20);

    let data = [
      {
        id: 1,
        start: d1,
        end: d2,
        name: 'Demo Task 1'
      },
      {
        id: 2,
        start: d3,
        end: d4,
        name: 'Demo Task 2',
        color: 'orange'
      }
    ];

    this.state = { data: data, links: [], selectedTask: null };
  }
  genID() {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (
      S4() +
      S4() +
      '-' +
      S4() +
      '-4' +
      S4().substr(0, 3) +
      '-' +
      S4() +
      '-' +
      S4() +
      S4() +
      S4()
    ).toLowerCase();
  }

  getRandomDate() {
    let result = new Date();
    result.setDate(result.getDate() + Math.random() * 10);
    return result;
  }
  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  createLink(start, end) {
    return {
      id: this.genID(),
      start: start.task.id,
      end: end.task.id
    };
  }
  onUpdateTask = (item, props) => {
    item.start = props.start ? props.start : item.start;
    item.end = props.end ? props.end : item.end;
    item.name = props.name ? props.name : item.name;
    this.setState({ data: [...this.state.data] });
  };
  onCreateLink = item => {
    let newLink = this.createLink(item.start, item.end);
    this.setState({ links: [...this.state.links, newLink], selectedTask: newLink });
  };
  onSelectTask = item => {
    console.log(`Select Item ${item}`);
    this.setState({ selectedTask: item });
  };

  addTask = () => {
    let newTask = {
      id: this.state.data.length + 1,
      start: new Date(),
      end: this.getRandomDate(),
      name: 'New Task',
      color: getRandomColor()
    };
    this.setState({ data: [newTask, ...this.state.data] });
  };

  delete = () => {
    console.log('On delete');
    if (this.state.selectedTask) {
      let index = this.state.links.indexOf(this.state.selectedTask);
      if (index > -1) {
        this.state.links.splice(index, 1);
        this.setState({ links: [...this.state.links] });
      }
      index = this.state.data.indexOf(this.state.selectedTask);
      if (index > -1) {
        this.state.data.splice(index, 1);
        this.setState({ data: [...this.state.data] });
      }
    }
  };

  render() {
    return (
      <div className="app-container">
        <div className="nav-container">
          <div className="dateMode-container-title">Crud Demo</div>
          <div className="operation-button-container">
            <div className="dateMode-button" onClick={this.addTask}>
              <svg height={30} width={30} viewBox="0 0 48 48">
                <path
                  fill="silver"
                  d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm10 22h-8v8h-4v-8h-8v-4h8v-8h4v8h8v4z"
                />
              </svg>
            </div>
            <div className="dateMode-button" onClick={this.delete}>
              <svg height={30} width={30} viewBox="0 0 48 48">
                <path
                  fill="silver"
                  d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm10 22H14v-4h20v4z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="time-line-container">
          <GanttTimeLine
            taskGroups={this.state.data}
            links={this.state.links}
            onUpdateTask={this.onUpdateTask}
            onCreateLink={this.onCreateLink}
            onSelectTask={this.onSelectTask}
            selectedTask={this.state.selectedTask}
          />
        </div>
      </div>
    );
  }
}
