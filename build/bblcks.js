var Bblck = (function (window) {

	var	doc = window.document,
		sessionStorage = window.sessionStorage,
		PRIVATE = {},
		PUBLIC = {},
		STORAGE = {},
		mainStorageFactoryType = 'bblock_action_history',
		ClassResponse = function () {};


	/* PRIVATE METHODS */

	PRIVATE.addEvent = function (elem, event, fn) {
		function listenHandler(e) {
			var ret = fn.apply(this, arguments);
			if (ret === false) {
				e.stopPropagation();
				e.preventDefault();
			}
			return ret;
		}

		function attachHandler() {
			var ret = fn.call(elem, window.event);
			if (ret === false) {
				window.event.returnValue = false;
				window.event.cancelBubble = true;
			}
			return ret;
		}

		if (elem.addEventListener) {
			elem.addEventListener(event, listenHandler, false);
		} else {
			elem.attachEvent("on" + event, listenHandler);
		}
	};

	PRIVATE.Ajax = (function(window){
		var xhr = null,
			AJAX_METHODS = {},
			AJAX_CONSTRUCT = {},
			ClassAjax = function () {},
			notEmpty = function(variable, type) {
				if (type !== null && type !== undefined && type !== "") {
					if (variable !== null && variable !== undefined && typeof variable === type) {
						return true;
					} else {
						return false;
					}
				} else {
					if (variable !== null && variable !== undefined && variable !== "") {
						return true;
					} else {
						return false;
					}
				}
			};

		AJAX_CONSTRUCT.XHR = function () {
			if (typeof XMLHttpRequest !== undefined) {
				return new XMLHttpRequest();
			} else {
				var versions = [
				"MSXML2.XmlHttp.5.0",
				"MSXML2.XmlHttp.4.0",
				"MSXML2.XmlHttp.3.0",
				"MSXML2.XmlHttp.2.0",
				"Microsoft.XmlHttp"
				];

				for(var i = 0; i < versions.length; i++) {
					try {
						return new ActiveXObject(versions[i]);
					}
					catch(e){
						throw "Not ActiveXObject";
					}
				}
			}
		};

		AJAX_METHODS.asyncRequest = function(url, callback) {
			if (notEmpty(url)) {
				xhr = new AJAX_CONSTRUCT.XHR();
				xhr.onreadystatechange = function() {
					if (notEmpty(callback, "function")) {
						callback(xhr);
					}
				};
				xhr.open('GET', url, true);
				xhr.send('');
			} else {
				throw "invalid URL on Ajax.asyncRequest method";
			}
		};

		AJAX_METHODS.async = function(url, callback) {
			if (notEmpty(url)) {
				xhr = new AJAX_CONSTRUCT.XHR();
				xhr.onreadystatechange = function() {
					if (xhr.readyState < 4) {
						return;
					}

					if (xhr.status !== 200) {
						return;
					}

					if (xhr.readyState === 4) {
						if (notEmpty(callback, "function")) {
							callback(xhr);
						}
					}
				};
				xhr.open('GET', url, true);
				xhr.send('');
			} else {
				throw "invalid URL on Ajax.async method";
			}
		};

		AJAX_METHODS.sync = function(url) {
			if (notEmpty(url)) {
				xhr = new AJAX_CONSTRUCT.XHR();
				xhr.open('GET', url, false);
				xhr.send('');
				return xhr;
			} else {
				throw "invalid URL - Ajax.sync method";
			}
		};

		AJAX_METHODS.json = function(url, callback) {
			if (notEmpty(callback, "function")) {
				AJAX_METHODS.async(url, function(resp){
					var data = JSON.parse(resp.responseText);
					callback(data);
				});
			} else {
				return JSON.parse(AJAX_METHODS.sync(url).responseText);
			}
		};

		AJAX_METHODS.post = function(form, url, callback) {
			if (notEmpty(form, "object") && notEmpty(url)) {
				xhr = new AJAX_CONSTRUCT.XHR();
				xhr.onreadystatechange = function() {
					if (xhr.readyState < 4) {
						return;
					}
					if (xhr.status !== 200) {
						return;
					}
					if (xhr.readyState === 4) {
						if (notEmpty(callback, "function")) {
							var data = JSON.parse(xhr.responseText);
							callback(data, xhr);
						}
					}
				};

				xhr.open('POST', url, true);
				//xhr.setRequestHeader('Content-Type', 'multipart/form-data');
				if (window.FormData) {
					var formData = new FormData();
					for (var i = 0; i < form.elements.length; i ++) {
						var field = form.elements[i];
						if (field.name !== "") {
							formData.append(field.name, field.value);
						}
					}
					xhr.send(formData);
				}
			} else {
				throw "invalid URL or form node object - Ajax.post method";
			}
		};

		AJAX_METHODS.postData = function(url, callback, postData) {
			if (notEmpty(url)) {
				xhr = new AJAX_CONSTRUCT.XHR();
				xhr.onreadystatechange = function() {
					if (xhr.readyState < 4) {
						return;
					}
					if (xhr.status !== 200) {
						return;
					}
					if (xhr.readyState === 4) {
						if (notEmpty(callback, "function")) {
							var data = JSON.parse(xhr.responseText);
							callback(data, xhr);
						}
					}
				};

				xhr.open('POST', url, true);
				//xhr.setRequestHeader('Content-Type', 'multipart/form-data');
				if (window.FormData) {
					var formData = new FormData(),
						value = null;
					if ( notEmpty(postData) ) {
						for (var key in postData) {
							value = postData[key];
							if (key !== "") {
								formData.append(key, value);
							}
						}
					}
					xhr.send(formData);
				}
			} else {
				throw "invalid URL or form node object - Ajax.post method";
			}
		};

		for (var method in AJAX_METHODS) {
			ClassAjax.prototype[method] = AJAX_METHODS[method];
		}

		return ClassAjax;
	})(window);

	PRIVATE.target = 'body';

	PRIVATE.unique_id = (new Date()).getTime();

	PRIVATE.panel_root = null;

	PRIVATE.Iterator = function (type, index) {
		this.prev = function () {
			var newIndex = index - 1;
			if (newIndex >= 0) {
				return new PRIVATE.Iterator(newIndex);
			}
			return null;
		};

		this.item = function () {
			var store = JSON.parse(sessionStorage.getItem(type));
			if ( store === null ) {
				return store;
			}
			return store[index];
		};

		this.next = function () {
			var newIndex = index + 1;
			if (newIndex <= (storage[type].length - 1)) {
				return new PRIVATE.Iterator(newIndex);
			}
			return null;
		};
	};

	PRIVATE.StorageFactory = function (type) {

		sessionStorage.removeItem(type);

		this.save = function (obj) {
			var store = JSON.parse(sessionStorage.getItem(type));
			if ( store === null ) {
				store = [];
			}
			store.push(obj);
			sessionStorage.setItem(type, JSON.stringify(store));
			return obj;
		};

		this.delete = function (index) {
			var store = JSON.parse(sessionStorage.getItem(type));
			if ( store !== null ) {
				try {
					store.splice(index, 1);
					sessionStorage.setItem(type, JSON.stringify(store));
					return true;
				} catch (e) {
					return false;
				}
			}
			return false;
		};

		this.find = function (index) {
			var store = JSON.parse(sessionStorage.getItem(type));
			if ( store === null ) {
				return store;
			}
			return store[index];
		};

		this.findAll = function () {
			var store = JSON.parse(sessionStorage.getItem(type));
			return store;
		};

		this.findLast = function () {
			var store = JSON.parse(sessionStorage.getItem(type));
			if ( store === null ) {
				return store;
			}

			var lastIndex = store.length - 1;
			if ( lastIndex >= 0 ) {
				return store[lastIndex];
			}
			return null;
		};

		this.findFirst = function () {
			var store = JSON.parse(sessionStorage.getItem(type));
			if ( store === null ) {
				return store;
			}
			return store[0];
		};

		this.count = function () {
			var store = JSON.parse(sessionStorage.getItem(type));
			if ( store === null ) {
				return store;
			}
			return store.length;
		};
	};


	/* PUBLIC METHODS */

	PUBLIC.Button = function (description, options, panel) {
		var _options = {
				wrapper: null,
				wrapperClassName: '',
				ajaxAction: false,
				ajaxSource: '',
				ajaxResponseType: 'JSON',
				ajaxRequestType: 'GET',
				ajaxPostData: null,
				variableName: '$description',
				htmlContent: null,
				className: '',
				actionKey: window.btoa(unescape(encodeURIComponent( description + (new Date()).getTime() ))),

				onAction: function () {},
				afterAction: function () {},
				onReturn: function () {},
				onException: function () {},
				beforeAjaxRequest: function () {}
			},
			_panel = panel || undefined,
			_currentPanel = null,
			firstExec = true,
			self = this,
			ActionException = function (message) {
				this.message = message;
				this.name = "ActionException";
			};
		ActionException.prototype = Object.create(Error.prototype);
		ActionException.prototype.constructor = ActionException;

		if (options !== null && options !== undefined) {
			for (var key in options) {
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

		self.setNextPanel = function (panel) {
			_panel = panel;
		};

		self.getNextPanel = function () {
			return _panel;
		};

		self.setAsFirstExecution = function (boolean) {
			firstExec = boolean;
		};

		self.isFirstExecution = function () {
			return firstExec;
		};

		self.clearNextPanel = function () {
			_panel = undefined;
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
			var cb = function (event) {
				var obj = {
					getTarget: function () { return trgt; },
					getHistory: function () { return history; },
					createException: self.createException,
					getNextPanel: self.getNextPanel,
					setNextPanel: self.setNextPanel,
					clearNextPanel: self.clearNextPanel,
					getActionKey: self.getOption('actionKey'),
					getCurrentPanel: self.getCurrentPanel,
					setAsFirstExecution: self.setAsFirstExecution,
					isFirstExecution: self.isFirstExecution
				};
				try {
					if ( self.getOption('ajaxAction') ) {
						var ajax = new PRIVATE.Ajax(),
							responseType = 'async',
							ajaxLoad = ajax.async;

						obj.setAjaxSource = function (value) { self.setOption('ajaxSource', value); };
						obj.setAjaxPostData = function (value) { self.setOption('ajaxPostData', value); };
						obj.setAjaxResponseType = function (value) { self.setOption('ajaxResponseType', value); };
						obj.setAjaxRequestType = function (value) { self.setOption('ajaxRequestType', value); };
						obj.getAjaxSource = function (value) { return self.getOption('ajaxSource'); };
						obj.getAjaxPostData = function (value) { return self.getOption('ajaxPostData'); };
						obj.getAjaxResponseType = function (value) { return self.getOption('ajaxResponseType'); };
						obj.getAjaxRequestType = function (value) { return self.getOption('ajaxRequestType'); };

						self.getOption('beforeAjaxRequest')(event, obj);

						delete obj.setAjaxSource;
						delete obj.setAjaxPostData;
						delete obj.setAjaxResponseType;
						delete obj.setAjaxRequestType;
						delete obj.getAjaxSource;
						delete obj.getAjaxPostData;
						delete obj.getAjaxResponseType;
						delete obj.getAjaxRequestType;

						if (self.getOption('ajaxResponseType').toLowerCase() === 'json') {
							ajaxLoad = ajax.json;
						}
						if (self.getOption('ajaxRequestType').toLowerCase() === 'post') {
							ajaxLoad = ajax.postData;
						}
						ajaxLoad(self.getOption('ajaxSource'), function (data) {
							try {
								self.getOption('onAction')(event, obj, data);
								if ( self.getNextPanel() !== undefined ) {
									history.save({
										key: self.getOption('actionKey'),
										date: (new Date()).toLocaleString()
									});
									STORAGE[self.getOption('actionKey')] = self;
									self.getNextPanel().create(trgt, history);
								}
								self.getOption('afterAction')(event, obj, data);
							} catch (error) {
								self.getOption('onException')(event, obj, error);
								return true;
							}
						}, self.getOption('ajaxPostData'));
					} else {
						self.getOption('onAction')(event, obj);
						if ( self.getNextPanel() !== undefined ) {
							history.save({
								key: self.getOption('actionKey'),
								date: (new Date()).toLocaleString()
							});
							STORAGE[self.getOption('actionKey')] = self;
							self.getNextPanel().create(trgt, history);
						}
						self.getOption('afterAction')(event, obj);
					}
				} catch (error) {
					self.getOption('onException')(event, obj, error);
					return true;
				}
			};
			PRIVATE.addEvent(btn, 'click', function (event) {
				if ( self.isFirstExecution() ) {
					cb(event);
				}
			});

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
					if ( !returnButtonOptions.onAction ) {
						button.setOption('onAction', function (event, obj) {
							var hstr = obj.getHistory(),
							prevIndex = hstr.count() - 1,
							prevStorage = hstr.find(prevIndex),
							prevButton = STORAGE[prevStorage.key];
							hstr.delete(prevIndex);
							prevButton.getOption('onReturn')(event, obj);
							prevButton.getCurrentPanel().create(obj.getTarget(), hstr);
						});
					}
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

			if (self.getReturnButton() !== undefined) {
				button = self.getReturnButton().create(trgt, history);
				panel.appendChild(button);
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
		var history = new PRIVATE.StorageFactory(mainStorageFactoryType),
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
