steal(
	'mad/controller/appController.js',
	// the main workspaces of the application
	'app/controller/settingsWorkspaceController.js',
	'app/controller/component/passwordWorkspaceMenuController.js',
	'app/controller/passwordWorkspaceController.js',
	'app/controller/peopleWorkspaceController.js',
	'app/controller/component/peopleWorkspaceMenuController.js',
	'app/controller/component/settingsWorkspaceMenuController.js',
	// common components of the application
	'app/controller/component/appNavigationLeftController.js',
	'app/controller/component/appNavigationRightController.js',
	'app/controller/component/appFilterController.js',
	'app/controller/component/profileDropdownController.js',
	'app/controller/component/notificationController.js',
	'app/controller/component/loadingBarController.js',
	// the ressources workspace models
	'app/model/category.js',
	'app/model/favorite.js',
	'app/model/resource.js',
	'app/model/filter.js',
	// the application template
	'app/view/template/app.ejs'
).then(function () {

	/*
	 * @class passbolt.controller.AppController
	 * @inherits mad.controller.AppController
	 * @parent index
	 *
	 * The passbolt application controller.
	 */
	mad.controller.AppController.extend('passbolt.controller.AppController', /** @static */ {
		'defaults': {
			// List of available workspaces.
			'workspaces':[
				'password',
				'people',
				'settings'
			]
		}

	}, /** @prototype */ {

		/**
		 * After start hook.
		 * Initialise component of the application
		 * @return {void}
		 */
		'afterStart': function() {
			var self = this;
			this.workspace = null;

			// Instantiate the app navigation left controller
			var navLeftCtl = new passbolt.controller.component.AppNavigationLeftController($('#js_app_navigation_left'));
			navLeftCtl.start();

			// Instantiate the app navigation right controller
			var navRightCtl = new passbolt.controller.component.AppNavigationRightController($('#js_app_navigation_right'));
			navRightCtl.start();

			// Instantiate the filter controller
			var filterCtl = new passbolt.controller.component.AppFilterController($('#js_app_filter'), {});
			filterCtl.start();

			// Get logged in user.
			passbolt.model.User.findOne({
				'id': mad.Config.read('user.id')
			}).then(function(user) {
				// Set current user.
				passbolt.model.User.setCurrent(user);
				// Instantiate the profile controller.
				self.profileDropDownCtl = new passbolt.controller.component.ProfileDropdownController($('#js_app_profile_dropdown'), {
					'user': user
				});
				self.profileDropDownCtl.start();
			});

			// Instantiate the notification controller
			var notifCtl = new passbolt.controller.component.NotificationController($('#js_app_notificator'), {});

			// Instantiate the laoding bar controller
			var loadingBarCtl = new passbolt.controller.component.LoadingBarController($('#js_app_loading_bar'), {
				'state': 'ready'
			});
			loadingBarCtl.start();
		},

		/* ************************************************************** */
		/* LISTEN TO THE APP EVENTS */
		/* ************************************************************** */

		/**
		 * Observe when the user wants to switch to another workspace
		 * @param {HTMLElement} el The element the event occured on
		 * @param {HTMLEvent} ev The event which occured
		 * @param {string} workspace The target workspace
		 * @param {array} options Workspace's options
		 * @return {void}
		 */
		'{mad.bus} workspace_selected': function (el, event, workspace, options) {
			options = typeof options != "undefined" ? options : {};

			// If workspace requested is same as current workspace, do nothing.
			// (it is already loaded).
			if (workspace == this.workspace) {
				return;
			}

			// Destroy the existing workspace and all its components.
			$('#js_app_panel_main').empty();

			// Set class on top container.
			$('#container')
				.removeClass(this.options.workspaces.join(" "))
				.addClass(workspace);

			// Initialize the target workspace.
			var workspaceId = 'js_passbolt_' + workspace + '_workspace_controller',
				workspaceClass = passbolt.controller[can.capitalize(workspace) + 'WorkspaceController'],
				workspaceOptions = {
					'id': workspaceId,
					'label': workspace
				};

			// Extend default workspace options with the ones given in params.
			$.extend(workspaceOptions, options);

			var component = mad.helper.ComponentHelper.create(
				$('#js_app_panel_main'),
				'last',
				workspaceClass,
				workspaceOptions
			);
			component.start();

			// Remember current workspace.
			this.workspace = workspace;
		},

		/**
		 * Observe when the user requests a dialog to be opened.
		 * @param {HTMLElement} el The element the event occured on
		 * @param {HTMLEvent} ev The event which occured
		 * @param {string} label The label of the dialog
		 * @param {array} options (optional) Options to give to the dialog controller
		 * @return {void}
		 */
		'{mad.bus} request_dialog': function (el, ev, options) {
			var options = options || {};
			new mad.controller.component.DialogController(null, options).start();
		},

		/**
		 * Observe when the application processus have been all completed.
		 * @param {HTMLElement} el The element the event occured on
		 * @param {HTMLEvent} ev The event which occured
		 * @return {void}
		 */
		'{mad.bus} passbolt_application_loading_completed': function (el, ev, options) {
			if(!$('html').hasClass('loaded')) {
				$('html')
					.removeClass('loading')
					.addClass('loaded');
			}
		},

		/**
		 * Observe when the user wants to close the latest dialog.
		 * @param {HTMLElement} el The element the event occured on
		 * @param {HTMLEvent} ev The event which occured
		 * @return {void}
		 */
		'{mad.bus} passbolt_application_loading': function (el, ev, options) {
			if (!$('html').hasClass('loading')) {
				$('html')
					.removeClass('loaded')
					.addClass('loading');
			}
		},

		/**
		 * Observe when the user wants to close the latest dialog.
		 * @param {HTMLElement} el The element the event occured on
		 * @param {HTMLEvent} ev The event which occured
		 * @return {void}
		 */
		'{mad.bus} request_dialog_close_latest': function (el, ev, options) {
			mad.controller.component.DialogController.closeLatest();
		},

		/* ************************************************************** */
		/* LISTEN TO THE STATE CHANGES */
		/* ************************************************************** */

		/**
		 * Listen to the change relative to the state Loading
		 * @param {boolean} go Enter or leave the state
		 * @return {void}
		 */
		'stateLoading': function (go) {
			// If the view has already been instanciated.
			// Notify it that the component is now loading.
			if (this.view) {
				this.view.loading(go);
			}
		},

		/**
		 * The application is ready.
		 * @param {boolean} go Enter or leave the state
		 * @return {void}
		 */
		'stateReady': function (go) {
			// Select the password workspace
			mad.bus.trigger('workspace_selected', 'password');
			// When the application is ready, remove the launching screen.
			$('html').removeClass('launching');
		}

	});
});