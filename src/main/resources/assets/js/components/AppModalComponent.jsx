/** @jsx React.DOM */

var React = require("react/addons");
var AppVersionListComponent = require("../components/AppVersionListComponent");
var ModalComponent = require("../components/ModalComponent");
var StackedViewComponent = require("../components/StackedViewComponent");
var TabPaneComponent = require("../components/TabPaneComponent");
var TaskDetailComponent = require("../components/TaskDetailComponent");
var TaskViewComponent = require("../components/TaskViewComponent");
var TogglableTabsComponent = require("../components/TogglableTabsComponent");

var tabs = [
  {id: "tasks", text: "Tasks"},
  {id: "configuration", text: "Configuration"}
];

var AppModalComponent = React.createClass({
  displayName: "AppModalComponent",

  propTypes: {
    activeTask: React.PropTypes.object,
    appVersionsFetchState: React.PropTypes.number.isRequired,
    model: React.PropTypes.object.isRequired,
    destroyApp: React.PropTypes.func.isRequired,
    fetchTasks: React.PropTypes.func.isRequired,
    fetchAppVersions: React.PropTypes.func.isRequired,
    onDestroy: React.PropTypes.func.isRequired,
    onShowTaskDetails: React.PropTypes.func.isRequired,
    onShowTaskList: React.PropTypes.func.isRequired,
    onTasksKilled: React.PropTypes.func.isRequired,
    restartApp: React.PropTypes.func.isRequired,
    rollBackApp: React.PropTypes.func.isRequired,
    scaleApp: React.PropTypes.func.isRequired,
    suspendApp: React.PropTypes.func.isRequired,
    tasksFetchState: React.PropTypes.number.isRequired
  },

  getInitialState: function () {
    return {
      activeViewIndex: 0,
      activeTabId: tabs[0].id,
      selectedTasks: {}
    };
  },

  destroy: function () {
    this.refs.modalComponent.destroy();
  },

  handleDestroyApp: function () {
    this.props.destroyApp();
    this.destroy();
  },

  handleRestartApp: function () {
    this.props.restartApp();
  },

  onTabClick: function (id) {
    this.setState({
      activeTabId: id
    });
  },

  toggleAllTasks: function () {
    var newSelectedTasks = {};
    var modelTasks = this.props.model.tasks;

    // Note: not an **exact** check for all tasks being selected but a good
    // enough proxy.
    var allTasksSelected = Object.keys(this.state.selectedTasks).length ===
      modelTasks.length;

    if (!allTasksSelected) {
      modelTasks.forEach(function (task) {
        newSelectedTasks[task.id] = true;
      });
    }

    this.setState({selectedTasks: newSelectedTasks});
  },

  toggleTask: function (task, value) {
    var selectedTasks = this.state.selectedTasks;

    // If `toggleTask` is used as a callback for an event handler, the second
    // parameter will be an event object. Use it to set the value only if it
    // is a Boolean.
    var localValue = (typeof value === Boolean) ?
      value :
      !selectedTasks[task.id];

    if (localValue === true) {
      selectedTasks[task.id] = true;
    } else {
      delete selectedTasks[task.id];
    }

    this.setState({selectedTasks: selectedTasks});
  },

  showTaskDetails: function (task) {
    this.props.onShowTaskDetails(task, function () {
      this.setState({
        activeViewIndex: 1
      });
    }.bind(this));
  },

  showTaskList: function () {
    this.props.onShowTaskList();
    this.setState({
      activeViewIndex: 0
    });
  },

  scaleApp: function () {
    var model = this.props.model;
    var instancesString = prompt("Scale to how many instances?",
      model.get("instances"));

    // Clicking "Cancel" in a prompt returns either null or an empty String.
    // perform the action only if a value is submitted.
    if (instancesString != null && instancesString !== "") {
      var instances = parseInt(instancesString, 10);
      this.props.scaleApp(instances);
    }
  },

  render: function () {
    var model = this.props.model;

    var statusClassSet = React.addons.classSet({
      "text-warning": model.isDeploying()
    });

    var hasHealth = model.get("healthChecks") != null &&
      model.get("healthChecks").length > 0;

    /* jshint trailing:false, quotmark:false, newcap:false */
    /* jscs:disable disallowTrailingWhitespace, validateQuoteMarks, maximumLineLength */
    return (
      <ModalComponent ref="modalComponent" onDestroy={this.props.onDestroy}
        size="lg">
        <div className="modal-header">
           <button type="button" className="close"
              aria-hidden="true" onClick={this.props.onDestroy}>&times;</button>
          <span className="h3 modal-title">{model.get("id")}</span>
          <ul className="list-inline list-inline-subtext">
            <li>
              <span className={statusClassSet}>{model.getStatus()}</span>
            </li>
          </ul>
          <div className="header-btn">
            <button className="btn btn-sm btn-default"
                onClick={this.props.suspendApp}
                disabled={model.get("instances") < 1}>
              Suspend
            </button>
            <button className="btn btn-sm btn-default" onClick={this.scaleApp}>
              Scale
            </button>
            <button className="btn btn-sm btn-danger pull-right" onClick={this.handleDestroyApp}>
              Destroy App
            </button>
            <button className="btn btn-sm btn-default pull-right" onClick={this.handleRestartApp}>
              Restart App
            </button>
          </div>
        </div>
        <TogglableTabsComponent className="modal-body modal-body-no-top"
            activeTabId={this.state.activeTabId}
            onTabClick={this.onTabClick}
            tabs={tabs} >
          <TabPaneComponent id="tasks">
            <StackedViewComponent
              activeViewIndex={this.state.activeViewIndex}>
              <TaskViewComponent
                collection={model.tasks}
                fetchState={this.props.tasksFetchState}
                fetchTasks={this.props.fetchTasks}
                formatTaskHealthMessage={model.formatTaskHealthMessage}
                hasHealth={hasHealth}
                onTasksKilled={this.props.onTasksKilled}
                onTaskDetailSelect={this.showTaskDetails} />
              <TaskDetailComponent
                fetchState={this.props.tasksFetchState}
                taskHealthMessage={model.formatTaskHealthMessage(this.props.activeTask)}
                hasHealth={hasHealth}
                onShowTaskList={this.showTaskList}
                task={this.props.activeTask} />
            </StackedViewComponent>
          </TabPaneComponent>
          <TabPaneComponent
            id="configuration"
            onActivate={this.props.fetchAppVersions} >
            <AppVersionListComponent
              app={model}
              fetchAppVersions={this.props.fetchAppVersions}
              fetchState={this.props.appVersionsFetchState}
              onRollback={this.props.rollBackApp} />
          </TabPaneComponent>
        </TogglableTabsComponent>
      </ModalComponent>
    );
  }
});

module.exports = AppModalComponent;
