var Bblck = (function (window) {

	var	doc = window.document,
		PRIVATE = {},
		PUBLIC = {},
		storage = {},
		ClassResponse = function () {};


	/* PRIVATE METHODS */

	PRIVATE.target = 'body';

	PRIVATE.unique_id = (new Date()).getTime();

	PRIVATE.panel_root = null;

	PRIVATE.StoragePath = {
		get: function (path) {
			var listPath = path.split('.'),
				listPathLen = listPath.length,
				store = PRIVATE.storage;
			for (var i = 0; i < listPathLen; i ++) {
				store = store[listPath[i]];
			}
			return store;
		},
		create: function (path) {
			var listPath = path.split('.'),
				listPathLen = listPath.length,
				store = PRIVATE.storage;
			for (var i = 0; i < listPathLen; i ++) {
				if ( !store[listPath[i]] ) {
					store[listPath[i]] = ( i === (listPathLen - 1) ) ? [] : {};
				}
				store = store[listPath[i]];
			}
			return store;
		},
		exist: function (path) {
			var listPath = path.split('.'),
				listPathLen = listPath.length,
				store = PRIVATE.storage;
			for (var i = 0; i < listPathLen; i ++) {
				if ( !store[listPath[i]] ) {
					return false;
				}
				store = store[listPath[i]];
			}
			return true;
		}
	};

	PRIVATE.Iterator = function (type, index) {
		this.prev = function () {
			var newIndex = index - 1;
			if (newIndex >= 0) {
				return new PRIVATE.Iterator(newIndex);
			}
			return null;
		};

		this.item = function () {
			return PRIVATE.storage[type][index];
		};

		this.next = function () {
			var newIndex = index + 1;
			if (newIndex <= (PRIVATE.storage[type].length - 1)) {
				return new PRIVATE.Iterator(newIndex);
			}
			return null;
		};
	};

	PRIVATE.StorageFactory = function (type) {

		this.save = function (obj) {
			var store = PRIVATE.storage;
			if ( !PRIVATE.StoragePath.exist(type) ) {
				store = PRIVATE.StoragePath.create(type);
			}
			store.push(obj);
			PRIVATE.storage = store;
			return obj;
		};

		this.delete = function (index) {
			if ( PRIVATE.StoragePath.exist(type) ) {
				try {
					var store = PRIVATE.StoragePath.get(type);
					store.splice(index, 1);
					PRIVATE.storage = store;
					return true;
				} catch (e) {
					return false;
				}
			}
			return false;
		};

		this.find = function (index) {
			if ( !PRIVATE.StoragePath.exist(type) ) {
				return null;
			}
			var store = PRIVATE.StoragePath.get(type);
			return store[index];
		};

		this.findLast = function () {
			if ( !PRIVATE.StoragePath.exist(type) ) {
				return null;
			}
			var store = PRIVATE.StoragePath.get(type),
				lastIndex = store.length - 1;
			if ( lastIndex >= 0 ) {
				return store[lastIndex];
			}
			return null;
		};

		this.findFirst = function () {
			if ( !PRIVATE.StoragePath.exist(type) ) {
				return null;
			}
			var store = PRIVATE.StoragePath.get(type);
			return store[0];
		};

		this.count = function () {
			if ( !PRIVATE.StoragePath.exist(type) ) {
				return 0;
			}
			var store = PRIVATE.StoragePath.get(type);
			return store.length;
		};
	};


	/* PUBLIC METHODS */

	PUBLIC.Button = function (description, options, panel) {
		var _options = {
				wrapper: null,
				wrapperClassName: '',
				variableName: '$description',
				htmlContent: null,
				className: '',
				actionKey: window.btoa(unescape(encodeURIComponent( description + (new Date()).getTime() ))),

				onAction: function () {},
				onReturn: function () {},
				onException: function () {}
			},
			_panel = panel || undefined,
			_currentPanel = null,
			self = this,
			ActionException = function (message) {
				this.message = message;
				this.name = "ActionException";
			};
		ActionException.prototype = Object.create(Error.prototype);
		ActionException.prototype.constructor = ActionException;

		if (options !== null && options !== undefined) {
			for (key in options) {
				_options[key] = options[key];
			}
		}

		self.createException = function (message) {
			var msg = message || 'An exception of button action';
			throw new ActionException(msg);
		};

		self.setCurrentPanel = function (panel) {
			_currentPanel = panel;
		};

		self.getCurrentPanel = function () {
			return _currentPanel;
		};

		self.getNextPanel = function () {
			return _panel;
		};

		self.setOption = function (optionName, value) {
			if ( _options.hasOwnProperty(optionName) ) {
				_options[optionName] = value;
			}
			return self;
		};

		self.getOption = function (optionName) {
			if ( _options.hasOwnProperty(optionName) ) {
				return _options[optionName];
			}
			return undefined;
		};

		self.create = function (trgt, history) {
			var btn = doc.createElement('button');
			btn.setAttribute('type', 'button');
			btn.setAttribute('class', self.getOption('className'));

			var content = description;
			if ( self.getOption('htmlContent') !== null ) {
				content = self.getOption('htmlContent').replace(
					self.getOption('variableName'),
					description
				);
			}
			btn.innerHTML = content;
			btn.addEventListener("click", function (event) {
				var obj = {
					getTarget: function () { return trgt; },
					getHistory: function () { return history; },
					createException: self.createException,
					getNextPanel: self.getNextPanel,
					getCurrentPanel: self.getCurrentPanel
				};
				try {
					self.getOption('onAction')(event, obj);
					history.save({
						button: self,
						date: (new Date()).toLocaleFormat()
					});
					if ( self.getNextPanel() !== undefined ) {
						self.getNextPanel().create(trgt, history);
					}
				} catch (error) {
					self.getOption('onException')(error, obj);
				}
			}, false);

			if ( self.getOption('wrapper') !== null ) {
				var wrapper = doc.createElement(self.getOption('wrapper'));
				wrapper.setAttribute('class', self.getOption('wrapperClassName'));
				wrapper.appendChild(btn);

				return wrapper;
			}

			return btn;
		};
	};

	PUBLIC.Panel = function (title, options, buttons) {
		var _options = {
				wrapper: null,
				wrapperClassName: '',
				className: '',
				panelKey: 'panel_' + (new Date()).getTime(),
				returnButton: {
					enabled: false,
					wrapper: null,
					wrapperClassName: '',
					variableName: '$description',
					htmlContent: null,
					className: '',
					actionKey: 'action_' + (new Date()).getTime(),
				}
			},
			self = this;

		if (options !== null && options !== undefined) {
			for (key in options) {
				_options[key] = options[key];
			}
		}

		self.setOption = function (optionName, value) {
			if ( _options.hasOwnProperty(optionName) ) {
				_options[optionName] = value;
			}
			return self;
		};

		self.getReturnButton = function () {
			var button = undefined;
			if ( _options.hasOwnProperty('returnButton') ) {
				var returnButtonOptions = _options['returnButton'];
				if (returnButtonOptions.enabled) {
					button = new PUBLIC.Button('Voltar', returnButtonOptions);
					button.setOption('onAction', function (event, obj) {
						var hstr = obj.getHistory(),
							lastIndex = hstr.count - 1,
							prev = lastIndex - 1,
							prevData = hstr.find(prev),
							prevButton = prevData.button;

						hstr.delete(lastIndex);
						prevButton.onReturn(obj);
						prevButton.getCurrentPanel().create(obj.getTarget(), hstr);
					});
				}
			}
			return button;
		};

		self.getOption = function (optionName) {
			if ( _options.hasOwnProperty(optionName) ) {
				return _options[optionName];
			}
			return undefined;
		};

		self.create = function (trgt, history) {
			var target = document.querySelector(trgt),
				panel = doc.createElement('div'),
				button = null;
			panel.setAttribute('class', self.getOption('className'));

			if (title !== null && title !== undefined && title !== '') {
				var h1 = doc.createElement('h1');
				h1.innerHTML = title;
				panel.appendChild(h1);
			}

			for (var i = 0, len = buttons.length; i < len; i ++) {
				buttons[i].setCurrentPanel(self);
				button = buttons[i].create(trgt, history);
				panel.appendChild(button);
			}

			if (buttons.length > 0) {
				if (self.getReturnButton() !== undefined) {
					button = self.getReturnButton().create(trgt, history);
					panel.appendChild(button);
				}
			}

			target.innerHTML = '';
			if ( self.getOption('wrapper') !== null ) {
				var wrapper = doc.createElement(self.getOption('wrapper'));
				wrapper.setAttribute('class', self.getOption('wrapperClassName'));
				wrapper.appendChild(panel);
				target.appendChild(wrapper);
			} else {
				target.appendChild(panel);
			}
		};
	};

	PUBLIC.setPanelRoot = function (panel) {
		PRIVATE.panel_root = panel;
	};

	PUBLIC.getPanelRoot = function () {
		return PRIVATE.panel_root;
	};

	PUBLIC.setTarget = function (target) {
		PRIVATE.target = target;
	};

	PUBLIC.getTarget = function () {
		return PRIVATE.target;
	};

	PUBLIC.empty = function () {
		var target = doc.querySelector(PUBLIC.getTarget());
		target.innerHTML = '';
	};

	PUBLIC.render = function () {
		var history = new PRIVATE.StorageFactory('action_history'),
			panel = PUBLIC.getPanelRoot();

		panel.create(PUBLIC.getTarget(), history);
	};

	PUBLIC.createButtonsFromJSON = function (data) {
		var buttons = [],
			button = null,
			panel = null;
		for (var i = 0, len = data.length; i < len; i ++) {
			button = data[i];
			if (button.panel && button.panel !== null && button.panel !== false) {
				panel = PUBLIC.createPanelFromJSON(button.panel);
			}
			buttons.push(new PUBLIC.Button( (button.description || 'Button'), (button.options || {}), panel ));
			panel = null;
		}
		return buttons;
	};

	PUBLIC.createPanelFromJSON = function (data) {
		var buttons = [];
		if (data.buttons && data.buttons.length > 0) {
			buttons = PUBLIC.createButtonsFromJSON(data.buttons);
		}
		return new PUBLIC.Panel( (data.title || null), (data.options || {}), buttons );
	};

	PUBLIC.renderFromJSON = function (data) {
		var panelRoot = PUBLIC.createPanelFromJSON(data);
		PUBLIC.setPanelRoot(panelRoot);
		PUBLIC.render();
	};

	/* CLASS RESPONSE CREATION */

	for (method in PUBLIC) {
		ClassResponse.prototype[method] = PUBLIC[method];
	}

	return ClassResponse;

})(window);