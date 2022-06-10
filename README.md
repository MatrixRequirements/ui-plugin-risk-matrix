# matrix-ui-plugin-boilerplate plugin

![Plugin Build](https://github.com/MatrixRequirements/matrix-ui-plugin-boilerplate/actions/workflows/main.yml/badge.svg)

Matrix UI Plugins are implementations of the IPlugin interface.
They can be registered in the plugin manager at startup and will be queried
in different situations, for example to add new UI Controls or entries to 
the tree or pages in the adminConfig.

This  example registers a new Dashboard, a control, an action in the action menu, a config page on the project level and a config page at the serverSetting level. You can use this project as template for other plugin. 

It can be compiled using the standard
Typescript build process into a single JS file and loaded into Matrix.


## Installation
To simplify installation without requiring disk access to a Matrix instance
you can use a special developer setup and a GitHub action to build the code.

* Use this project as template
* Go to the CI action and start the workflow "rename the project from template" 
* Modify the code and check it into GitHub
* Make sure the build succeeds (look under Actions)
* Login into the [developer instance](https://developer.matrixreq.net)
* Create a new UI entry in the 
  [PLUGINS project](https://developer.matrixreq.net/PLUGINS/F-UI-2)
* Press the Deploy button
* Reload the browser

This should install the script on the server and load it into the browser. The
naming reflects the repository name, for example `https://developer.matrixreq.net/static/js/GitHub-MatrixRequirements_boiler-plate.js`

## APIs
Matrix has a very large set of APIs which you can explore in the interface definitions
in the lib directory. To simplify the start there are some wrappers around common 
calls in the src/api directory. The intention is to make these a smaller but better
documented set of often used APIs. Let us know if you're missing something!
