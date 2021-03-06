import React, { Component } from 'react';

import { dateHelper } from '../../controller';
import { MODE_NONE, MODE_MOVE, MOVE_RESIZE_LEFT, MOVE_RESIZE_RIGHT } from '../../const';
import withContext from '../../utils/context';
import { Task, EditingTask, LinkPos } from '../../types/index';
import { UiConfig } from '../../controller/UiConfig';

import './TaskClip.less';

const prefix = `fc-schedule-taskClip`;

interface ITaskClipProps {
  task: Task;

  left: number;
  width: number;
  height: number;
  complementalLeft: number;
  dayWidth: number;

  config?: UiConfig;
  label: string;
  color: string;
  isSelected: boolean;
  disableLink?: boolean;

  onTaskChanging: (et: EditingTask) => void;
  onTaskPopoverRender?: (task: Task) => React.ReactNode;
  onChildDrag: (v: boolean) => void;
  onSelectTask: (task: Task, ref: HTMLDivElement | null) => void;
  onUpdateTask: (task: Task, { start, end }: { start: Date; end: Date }) => void;
  onStartCreateLink: (task: Task, pos: LinkPos) => void;
  onFinishCreateLink: (task: Task, pos: LinkPos) => void;
}

interface ITaskClipState {
  dragging: boolean;
  isHover: boolean;
  left: number;
  width: number;
  dateMode: number;
}

export class TaskClipComp extends Component<ITaskClipProps, ITaskClipState> {
  draggingPosition: number;
  $ref: HTMLDivElement | null;

  constructor(props) {
    super(props);
    this.calculateStyle = this.calculateStyle.bind(this);
    this.state = {
      dragging: false,
      isHover: false,
      left: this.props.left,
      width: this.props.width || 0,
      dateMode: MODE_NONE
    };
  }

  onCreateLinkMouseDown = (e, position) => {
    const { task, onStartCreateLink } = this.props;

    if (e.button === 0) {
      e.stopPropagation();
      onStartCreateLink(task, position);
    }
  };

  onCreateLinkMouseUp = (e, position) => {
    const { task } = this.props;

    e.stopPropagation();
    this.props.onFinishCreateLink(task, position);
  };

  onCreateLinkTouchStart = (e, position) => {
    const { task, onStartCreateLink } = this.props;

    e.stopPropagation();
    onStartCreateLink(task, position);
  };

  onCreateLinkTouchEnd = (e, position) => {
    const { task, onFinishCreateLink } = this.props;

    e.stopPropagation();
    onFinishCreateLink(task, position);
  };

  componentDidUpdate(props, state) {
    if (this.state.dragging && !state.dragging) {
      document.addEventListener('mousemove', this.doMouseMove);
      document.addEventListener('mouseup', this.doMouseUp);
      document.addEventListener('touchmove', this.doTouchMove);
      document.addEventListener('touchend', this.doTouchEnd);
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('mousemove', this.doMouseMove);
      document.removeEventListener('mouseup', this.doMouseUp);
      document.removeEventListener('touchmove', this.doTouchMove);
      document.removeEventListener('touchend', this.doTouchEnd);
    }
  }

  onMouseEnter = () => {
    this.setState({ isHover: true });
  };

  onMouseLeave = () => {
    this.setState({ isHover: false });
  };

  dragStart(x, dateMode) {
    this.props.onChildDrag(true);
    this.draggingPosition = x;
    this.setState({
      dragging: true,
      dateMode: dateMode,
      left: this.props.left,
      width: this.props.width
    });
  }

  dragProcess(x) {
    const { task, complementalLeft } = this.props;

    const delta = this.draggingPosition - x;
    let newLeft = this.state.left;
    let newWidth = this.state.width;

    switch (this.state.dateMode) {
      case MODE_MOVE:
        newLeft = this.state.left - delta;
        break;
      case MOVE_RESIZE_LEFT:
        newLeft = this.state.left - delta;
        newWidth = this.state.width + delta;
        break;
      case MOVE_RESIZE_RIGHT:
        newWidth = this.state.width - delta;
        break;
    }

    // the coordinates need to be global
    const changeObj = {
      task: task,
      position: {
        start: newLeft - complementalLeft,
        end: newLeft + newWidth - complementalLeft
      }
    };

    this.props.onTaskChanging(changeObj);
    this.setState({ left: newLeft, width: newWidth });
    this.draggingPosition = x;
  }

  dragEnd() {
    const { complementalLeft, dayWidth, task, onChildDrag } = this.props;

    onChildDrag(false);
    const newStartDate = dateHelper.pixelToDate(this.state.left, complementalLeft, dayWidth);
    const newEndDate = dateHelper.pixelToDate(
      this.state.left + this.state.width,
      this.props.complementalLeft,
      this.props.dayWidth
    );

    this.props.onUpdateTask(task, { start: newStartDate, end: newEndDate });
    this.setState({ dragging: false, dateMode: MODE_NONE });
  }

  doMouseDown = (e, dateMode) => {
    if (!this.props.onUpdateTask) return;
    if (e.button === 0) {
      e.stopPropagation();
      this.dragStart(e.clientX, dateMode);
    }
  };

  doMouseMove = e => {
    if (this.state.dragging) {
      e.stopPropagation();
      this.dragProcess(e.clientX);
    }
  };
  doMouseUp = () => {
    this.dragEnd();
  };

  doTouchStart = (e, dateMode) => {
    if (!this.props.onUpdateTask) return;
    console.log('start');
    e.stopPropagation();
    this.dragStart(e.touches[0].clientX, dateMode);
  };

  doTouchMove = e => {
    if (this.state.dragging) {
      console.log('move');
      e.stopPropagation();
      this.dragProcess(e.changedTouches[0].clientX);
    }
  };

  doTouchEnd = e => {
    console.log('end');
    this.dragEnd();
  };

  calculateStyle() {
    const { config } = this.props;

    if (!config) {
      return;
    }

    const configStyle = this.props.isSelected
      ? config.values.dataViewPort.task.selectedStyle
      : config.values.dataViewPort.task.style;

    const backgroundColor = this.props.color ? this.props.color : configStyle.backgroundColor;

    const finalHeight = this.props.height > 25 ? 16 : this.props.height - 5;
    const top = (this.props.height - finalHeight) / 2;

    // 这里根据是否拖拽有不同的样式设置
    if (this.state.dragging) {
      return {
        ...configStyle,
        backgroundColor,
        left: this.state.left,
        width: this.state.width,
        height: finalHeight,
        top,
        cursor: 'pointer'
      };
    } else {
      return {
        ...configStyle,
        backgroundColor,
        left: this.props.left,
        width: this.props.width,
        height: finalHeight,
        top,
        cursor: 'pointer'
      };
    }
  }

  render() {
    const { config, disableLink, task, onTaskPopoverRender } = this.props;

    if (!config) {
      return;
    }

    const { isHover } = this.state;

    const style = this.calculateStyle();

    return (
      <div
        className={`${prefix}-container`}
        ref={ref => (this.$ref = ref)}
        style={style}
        onClick={() => {
          this.props.onSelectTask(task, this.$ref);
        }}
        onMouseEnter={this.onMouseEnter}
        onMouseDown={e => this.doMouseDown(e, MODE_MOVE)}
        onMouseLeave={this.onMouseLeave}
        onTouchStart={e => this.doTouchStart(e, MODE_MOVE)}
      >
        {isHover && onTaskPopoverRender && (
          <div className={`${prefix}-popover`}>
            <div className={`${prefix}-popover-arrow`}></div>
            <div className={`${prefix}-popover-content`}>{onTaskPopoverRender(task)}</div>
          </div>
        )}
        {!disableLink && (
          <div
            className="timeLine-main-data-task-side"
            style={{ top: 0, left: -4, height: style.height }}
            onMouseDown={e => this.doMouseDown(e, MOVE_RESIZE_LEFT)}
            onTouchStart={e => this.doTouchStart(e, MOVE_RESIZE_LEFT)}
          >
            <div
              className="timeLine-main-data-task-side-linker"
              onMouseUp={e => this.onCreateLinkMouseUp(e, 'LINK_POS_LEFT')}
              onTouchEnd={e => this.onCreateLinkTouchEnd(e, 'LINK_POS_LEFT')}
            />
          </div>
        )}

        <div style={{ overflow: 'hidden' }}>
          {config.values.dataViewPort.task.showLabel ? task.name : ''}
        </div>

        {!disableLink && (
          <div
            className="timeLine-main-data-task-side"
            style={{ top: 0, left: style.width - 3, height: style.height }}
            onMouseDown={e => this.doMouseDown(e, MOVE_RESIZE_RIGHT)}
            onTouchStart={e => this.doTouchStart(e, MOVE_RESIZE_RIGHT)}
          >
            <div
              className="timeLine-main-data-task-side-linker"
              onMouseDown={e => this.onCreateLinkMouseDown(e, 'LINK_POS_RIGHT')}
              onTouchStart={e => this.onCreateLinkTouchStart(e, 'LINK_POS_RIGHT')}
            />
          </div>
        )}
      </div>
    );
  }
}

export const TaskClip = withContext<ITaskClipProps>(TaskClipComp);
