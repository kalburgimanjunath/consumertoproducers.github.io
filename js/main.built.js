/* BUILT FILE DO NOT EDIT */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Analytics = require('./components/Analytics');
var Header = require('./views/Header');
var Lab = require('./views/Lab');
var Panels = require('./views/Panels');
var Posts = require('./views/Posts');
var Router = require('./components/Router');

function App (analytics) {
	this.onNavigate = this.onNavigate.bind(this);
	this.onIntroComplete = this.onIntroComplete.bind(this);
	this.onViewHidden = this.onViewHidden.bind(this);
	this.onViewLoaded = this.onViewLoaded.bind(this);

	this.init(analytics);
}

var proto = App.prototype;

proto.init = function (analytics) {
	this.analytics = new Analytics('UA-54501731-1', 'minimalmonkey.github.io', 200);

	this.header = new Header();
	this.panels = new Panels();
	this.posts = new Posts();
	this.lab = new Lab();

	this.router = new Router([
		this.panels.el
	]);

	var headerLinks = this.header.getPageLinks();
	var i = headerLinks.length;
	while (i--) {
		this.router.add(headerLinks[i], this.onNavigate, this.header, 'header');
	}
	this.router.add('/', this.onNavigate, this.panels, 'panels');
	this.router.add('/lab/', this.onNavigate, this.lab, 'lab');
	this.router.add('*post', this.onNavigate, this.posts, 'post');

	this.router.match(location.pathname);

	this.view.on('onintrocomplete', this.onIntroComplete);

	window.requestAnimationFrame(function () {
		document.body.classList.add('is-introtransition');
		document.body.classList.remove('is-intro');
	});
};

proto.onNavigate = function (view, state, match, params) {
	if (state === 'header') {
		this.header.open(match, this.state !== 'header' ? this.router.lastURL : false);
	}
	else if (this.state === 'header') {
		this.header.close();
	}
	else if (this.state === state) {
		this.view.update(params);
	}
	else if (this.state) {
		document.body.classList.add('is-muted');
		view.load(params);
		this.view.on('onhidden', this.onViewHidden);
		this.view.hide(state);
	}
	this.setView(view, state);
	this.analytics.update(location.pathname);
};

proto.setView = function (view, state) {
	if (this.state === state) {
		return;
	}
	this.view = view;
	if (this.state) {
		this.lastState = this.state;
		document.body.classList.remove('is-' + this.state);
	}
	this.state = state;
	document.body.classList.add('is-' + this.state);
};

proto.onIntroComplete = function () {
	document.body.classList.remove('is-introtransition');
};

proto.showView = function () {
	this.view.on('onshowed', this.onViewShowed);
	this.view.show(this.lastState, this.router.lastURL);
};

proto.onViewShowed = function (evt) {
	evt.target.off('onshowed', this.onViewShowed);

	var classes = document.body.classList;
	var i = classes.length;
	while (i--) {
		if (classes[i].indexOf('is-transition-') === 0) {
			document.body.classList.remove(classes[i]);
		}
	}
	document.body.classList.remove('is-muted');
};

proto.onViewHidden = function (evt) {
	evt.target.off('onhidden', this.onViewHidden);
	if (this.view.hasPage(location.pathname)) {
		this.showView();
	}
	else {
		this.view.on('onloaded', this.onViewLoaded);
	}
};

proto.onViewLoaded = function (evt) {
	if (evt.url === location.pathname) {
		this.view.off('onloaded', this.onViewLoaded);
		this.showView();
	}
};

module.exports = App;

},{"./components/Analytics":2,"./components/Router":4,"./views/Header":19,"./views/Lab":20,"./views/Panels":21,"./views/Posts":23}],2:[function(require,module,exports){
'use strict';

var loadScript = require('../utils/loadScript');

function Analytics (id, domain, delay) {
	if (id && domain) {
		window._gaq = window._gaq || [];
		window._gaq.push(
			['_setAccount', id],
			['_setDomainName', domain],
			['_setAllowLinker', true],
			['_trackPageview']
		);
		var url = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		loadScript('analytics-wjs', url, delay);
	}
}

var proto = Analytics.prototype;

proto.update = function (url) {
	if (url.length && url.substr(0, 1) === '/') {
		url = url.substr(1);
	}
	try {
		if (window._gaq) {
			window._gaq.push(['_trackPageview', url]);
		}
	} catch(error) {
		console.warn('Error sending Google Analytics script.');
	}
};

module.exports = Analytics;

},{"../utils/loadScript":12}],3:[function(require,module,exports){
'use strict';

function EventEmitter() {}

var proto = EventEmitter.prototype;

proto._getEvents = function () {
	return this._events || (this._events = {});
};

proto._getListeners = function (evt) {
	var events = this._getEvents();
	return events[evt] || (events[evt] = []);
};

proto._setListeners = function (evt, listeners) {
	var events = this._getEvents();
	events[evt] = listeners;
};

proto.on = function (evt, listener) {
	if (typeof listener !== 'function') {
		// throw error ?
		return;
	}
	var listeners = this._getListeners(evt);
	var index = listeners.indexOf(listener);
	if (index < 0) {
		listeners.push(listener);
	}
};

proto.off = function (evt, listener) {
	var listeners = this._getListeners(evt);
	var index = listeners.indexOf(listener);
	if (index > -1) {
		this._setListeners(evt, listeners.slice(0, index).concat(listeners.slice(index + 1)));
	}
};

proto.trigger = function (evt, obj) {
	obj = obj || {};
	obj.target = obj.target || this;
	var listeners = this._getListeners(evt);
	var i, len = listeners.length;
	for (i = 0; i < len; i++) {
		listeners[i].call(this, obj);
	}
};

module.exports = EventEmitter;

},{}],4:[function(require,module,exports){
'use strict';

var addEventListenerList = require('../utils/addEventListenerList');
var routeToRegExp = require('./routeToRegExp');

function Router (observeList) {
	this.lastURL = this.currentURL = location.pathname;

	this.onClicked = this.onClicked.bind(this);
	addEventListenerList(document.querySelectorAll('[data-router]'), 'click', this.onClicked);

	if (observeList && observeList.length) {
		this.observer = new MutationObserver(this.onAddedElements.bind(this));
		var config = {
			attributes: false,
			characterData: false,
			childList: true
		};
		var i = observeList.length;
		while (i--) {
			this.observer.observe(observeList[i], config);
		}
	}

	window.addEventListener('popstate', function(evt) {
		this.navigate(location.pathname, true);
	}.bind(this));

	this.routes = {};
}

var proto = Router.prototype;

proto.onAddedElements = function (mutations) {
	mutations.forEach(function (mutation) {
		var i = mutation.addedNodes.length;
		while (i--) {
			if (mutation.addedNodes[i].dataset.router !== undefined) {
				mutation.addedNodes[i].addEventListener('click', this.onClicked);
			}
			else {
				// TODO: get any children nodes with data-router
			}
		}
	}.bind(this));
};

proto.onClicked = function (evt) {
	evt.preventDefault();
	this.navigate(evt.currentTarget.pathname);
};

proto.navigate = function (route, silent) {
	if (route === this.currentURL) {
		return;
	}

	if (!silent) {
		history.pushState(null, null, route);
	}

	this.lastURL = this.currentURL;
	this.currentURL = route;

	this.match(route);
};

proto.getRoutes = function (route) {
	if (this.routes[route] === undefined) {
		this.routes[route] = {
			pattern: route,
			listeners: []
		};
	}
	return this.routes[route];
};

proto.add = function (route, callback) {
	route = routeToRegExp(route);
	var routes = this.getRoutes(route);
	routes.listeners.push({
		callback: callback,
		args: Array.prototype.slice.call(arguments).splice(2)
	});
};

proto.remove = function (route, callback) {
	//
};

proto.match = function (route) {
	var exec;
	for (var key in this.routes) {
		exec = this.routes[key].pattern.exec(route);
		if (exec && exec.length) {
			exec = exec.splice(0, 2);
			var listener;
			var i = this.routes[key].listeners.length;
			while (i--) {
				listener = this.routes[key].listeners[i];
				listener.callback.apply(this, listener.args.concat(exec));
			}
			break;
		}
	}
};

proto.enable = function () {
	//
};

proto.disable = function () {
	//
};

module.exports = Router;

},{"../utils/addEventListenerList":9,"./routeToRegExp":7}],5:[function(require,module,exports){
'use strict';

var throttleEvent = require('../utils/throttleEvent');

function ScrollEvents (el) {
	this.onScrolled = this.onScrolled.bind(this);
	this.onResized = this.onResized.bind(this);
	this.update(el);
	this.enable();
	this.points = [];
}

var proto = ScrollEvents.prototype;

proto.scrollToPoint = function (index) {
	if (this.points[index]) {
		var tx = this.points[index];
		var animateScroll = function () {
			var px = window.pageXOffset;
			var lx = window.pageXOffset;
			var vx = (tx - px) * 0.175;
			px += vx;
			window.scrollTo(px, window.pageYOffset);
			if (~~px != lx) {
				window.requestAnimationFrame(animateScroll);
			}
		};
		animateScroll();
	}
};

proto.update = function (el) {
	this.el = el;
	this.onResized();
};

proto.addPoint = function (p) {
	if (this.points.indexOf(p) < 0) {
		this.points.push(p);
	}
};

proto.removePoint = function (p) {
	var index = this.points.indexOf(p);
	if (index > -1) {
		this.points.splice(index);
	}
};

proto.clearPoints = function () {
	this.points = [];
};

proto.onScrolled = function (evt) {

	var scrollLeft = window.pageXOffset;
	if (scrollLeft >= this.widthMinusWindow) {
		var reachedEnd = new CustomEvent('reachedend', {
			detail: {}
		});
		this.el.dispatchEvent(reachedEnd);
	}

	if (this.points.length) {
		var i = this.points.length;
		while (i--) {
			if (scrollLeft >= this.points[i]) {
				var reachedPoint = new CustomEvent('reachedpoint', {
					detail: {
						point: this.points[i]
					}
				});
				this.el.dispatchEvent(reachedPoint);
			}
		}
	}
};

proto.onResized = function (evt) {
	this.widthMinusWindow = this.el.offsetWidth - window.innerWidth;
};

proto.enable = function () {
	this.throttledScroll = throttleEvent(this.onScrolled, 50);
	window.addEventListener('scroll', this.throttledScroll, false);

	this.throttledResize = throttleEvent(this.onResized, 50);
	window.addEventListener('resize', this.throttledResize, false);
	this.onResized();
};

proto.disable = function () {
	window.removeEventListener('scroll', this.throttledScroll);
	window.removeEventListener('resize', this.throttledResize);
};

module.exports = ScrollEvents;

},{"../utils/throttleEvent":14}],6:[function(require,module,exports){
'use strict';

module.exports = function loadPage (url, callback) {

	var selectors = Array.prototype.slice.call(arguments).splice(2);
	var req = new XMLHttpRequest();

	req.onload = function () {

		if (req.readyState === 4) {
			if (req.status === 200) {

				var fragment = document.createDocumentFragment();
				fragment.appendChild(document.createElement('body'));
				var body = fragment.querySelector('body');
				body.innerHTML = this.responseText;

				var elements = [];
				var i = selectors.length;

				while (i--) {
					elements[i] = fragment.querySelectorAll(selectors[i]);
				}

				callback.apply(this, elements.length ? [url].concat(elements) : [url, this.responseText]);
				// temp - simulate slow / random load time
				// setTimeout(function () {
				// 	callback.apply(this, elements.length ? [url].concat(elements) : [url, this.responseText]);
				// }.bind(this), 200 + (Math.random() * 500));
			}
		}
	};

	req.open('get', url, true);
	req.send();
};

},{}],7:[function(require,module,exports){
'use strict';

var optionalParam = /\((.*?)\)/g;
var namedParam    = /(\(\?)?:\w+/g;
var splatParam    = /\*\w+/g;
var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

/* From Backbone.js */
module.exports = function routeToRegExp (route) {

	if (route.exec) {
		return route;
	}

	route = route.replace(escapeRegExp, '\\$&')
				.replace(optionalParam, '(?:$1)?')
				.replace(namedParam, function(match, optional) {
					return optional ? match : '([^/?]+)';
				})
				.replace(splatParam, '([^?]*?)');

	return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
};

},{}],8:[function(require,module,exports){
'use strict';

var loadScript = require('./utils/loadScript');

var Analytics = require('./components/Analytics');
var App = require('./App');

var init = function () {
	var externalsDelay;

	if (document.documentElement.classList) { // TODO: maybe change to see if MutationObserver exists & screw IE10?
		new App();
		externalsDelay = 1200;
	}
	else {
		new Analytics('UA-54501731-1', 'minimalmonkey.github.io');
		externalsDelay = 0;
	}

	// loadScript('twitter-wjs', '//platform.twitter.com/widgets.js', externalsDelay);
};

init();

},{"./App":1,"./components/Analytics":2,"./utils/loadScript":12}],9:[function(require,module,exports){
'use strict';

module.exports = function addEventListenerList (list, type, listener, useCapture) {
	var i = list.length;
	while (i--) {
		list[i].addEventListener(type, listener, useCapture);
	}
};

},{}],10:[function(require,module,exports){
'use strict';

module.exports = function createPageItem (id, type) {
	var el = document.createElement(type || 'div');
	el.id = id;
	el.className = Array.prototype.slice.call(arguments).splice(2).concat(id).join(' ');
	document.getElementById('pagecontent').appendChild(el);
	return el;
};

},{}],11:[function(require,module,exports){
'use strict';

/**
 * @name isMouseOut
 * Loops through event target parent elements to see if mouse
 * has left or just event bubbling from child element.
 *
 * @kind function
 *
 * @param {MouseEvent} evt
 *        The DOM MouseEvent trigged by `mouseout`.
 *
 * @returns {Boolean} Returns true if mouse has left parent.
 */
module.exports = function isMouseOut (evt) {

	var target = evt.currentTarget ? evt.currentTarget: evt.srcElement;
	var child = evt.relatedTarget ? evt.relatedTarget : evt.toElement;

	if (child) {
		while (child.parentElement) {
			if (target === child) {
				return false;
			}
			child = child.parentElement;
		}
	}

	return true;
};

},{}],12:[function(require,module,exports){
'use strict';

/**
 * @name loadScript
 * Loads an external scripts onto the page.
 *
 * @kind function
 *
 * @param {String} id
 *        A string to use as the id of the script tag.
 *
 * @param {String} src
 *        The url of the script to be loaded.
 *
 * @param {Number} [delay=0]
 *        Amount of time (ms) to delay before loading the script.
 *
 * @param {Element} [dest=document]
 *        The element in which to create the script tag.
 *
 * @returns {Number} Returns a value which can be used to cancel the timer.
 */
module.exports = function loadScript (id, src, delay, dest) {

	delay = delay || 0;
	dest = dest || document;

	return setTimeout(function() {
		try {
			var js, fjs = dest.getElementsByTagName('script')[0];
			if(!dest.getElementById(id)) {
				js = dest.createElement('script');
				js.async = true;
				js.id = id;
				js.src = src;
				fjs.parentNode.insertBefore(js, fjs);
			}
		}
		catch(error) {
			// error
		}
	}, delay);
};

},{}],13:[function(require,module,exports){
'use strict';

module.exports = function setColor (element, color) {
	if (element.dataset.color) {
		element.classList.remove('color-' + element.dataset.color);
	}
	if (color) {
		element.dataset.color = color;
		element.classList.add('color-' + color);
	}
};

},{}],14:[function(require,module,exports){
'use strict';

/**
 * @name throttleEvent
 * Throttles an event.
 *
 * @kind function
 *
 * @param {String} evt
 *        Event name.
 *
 * @returns {Function} Returns object.
 */
module.exports = function throttleEvent (callback, delay) {
	var timeout = null;
	return function (evt) {
		if (timeout === null) {
			timeout = setTimeout(function () {
				callback.call();
				timeout = null;
			}, delay);
		}
	};
};

},{}],15:[function(require,module,exports){
'use strict';

var transitionEnd;

/* From Modernizr */
module.exports = function transitionEndEvent () {

	if (transitionEnd) {
		return transitionEnd;
	}

	var t;
	var el = document.createElement('fakeelement');
	var transitions = {
		'transition':'transitionend',
		'OTransition':'oTransitionEnd',
		'MozTransition':'transitionend',
		'WebkitTransition':'webkitTransitionEnd'
	};

	for (t in transitions) {
		if ( el.style[t] !== undefined ) {
			transitionEnd = transitions[t];
			return transitionEnd;
		}
	}
};

},{}],16:[function(require,module,exports){
'use strict';

module.exports = function waitAnimationFrames (callback, howMany) {
	var args = Array.prototype.slice.call(arguments).splice(2);
	var count = 0;
	var checkCount = function () {
		++count;
		if (count === howMany) {
			callback.apply(this, args);
		}
		else {
			waitForNext();
		}
	};
	var waitForNext = function () {
		window.requestAnimationFrame(checkCount);
	};
	waitForNext();
};

},{}],17:[function(require,module,exports){
'use strict';

var loadPage = require('../components/loadPage');
var transitionEndEvent = require('../utils/transitionEndEvent')();

var EventEmitter = require('../components/EventEmitter');

function BaseView() {}

var proto = BaseView.prototype = new EventEmitter();

proto.loadSelectors = [];
proto.pages = {};

proto.deeplinked = function () {
	var elements = [];
	var i = this.loadSelectors.length;
	while (i--) {
		elements[i] = document.querySelectorAll(this.loadSelectors[i]);
	}
	this.pages[location.pathname] = elements;
};

proto.update = function (url) {};

proto.show = function (fromState, lastUrl) {};

proto.hide = function (nextState) {};

proto.load = function (url) {
	if (url && this.pages[url] === undefined) {
		this.pages[url] = 'loading';
		loadPage.apply(this, [url, this.onLoaded.bind(this)].concat(this.loadSelectors));
	}
};

proto.hasPage = function (url) {
	return this.pages[url] && this.pages[url] !== 'loading';
};

proto.listenToTransitionEnd = function (el, callback) {
	var context = this;
	var onTransitionEnded = function (evt) {
		el.removeEventListener(transitionEndEvent, onTransitionEnded);
		callback.call(context);
	};
	el.addEventListener(transitionEndEvent, onTransitionEnded, false);
};

proto.onShowed = function () {
	this.trigger('onshowed');
	this.enable();
};

proto.onHidden = function () {
	this.trigger('onhidden');
	this.disable();
};

proto.onIntroComplete = function (evt) {
	this.trigger('onintrocomplete');
	this.enable();
};

proto.onLoaded = function () {
	var args = Array.prototype.slice.call(arguments, 0);
	var url = args.shift();
	this.pages[url] = args;
	this.trigger('onloaded', {
		url: url,
		args: args
	});
};

proto.enable = function () {};

proto.disable = function () {};

module.exports = BaseView;

},{"../components/EventEmitter":3,"../components/loadPage":6,"../utils/transitionEndEvent":15}],18:[function(require,module,exports){
'use strict';

var loadScript = require('../utils/loadScript');

function Comments () {
	this.onClicked = this.onClicked.bind(this);
}

var proto = Comments.prototype;

proto.refresh = function () {
	if (this.el) {
		this.el.removeEventListener('click', this.onClicked);
	}
	this.el = document.getElementById('postcommentslink');
	this.el.addEventListener('click', this.onClicked, false);
};

proto.load = function () {
	this.el.removeEventListener('click', this.onClicked);
	this.el.classList.add('is-hidden');
	var parent = this.el.parentNode;
	var container = document.createElement('div');
	container.id = 'disqus_thread';
	container.classList.add('postcomments');
	parent.appendChild(container);

	if (this.scriptLoaded) {
		window.DISQUS.reset({
			reload: true,
			config: function () {
				this.page.url = document.URL;
			}
		});
	}
	else {
		this.scriptLoaded = true;
		loadScript('disqus-wjs', '//minimalmonkey.disqus.com/embed.js');
	}
};

proto.onClicked = function () {
	this.load();
};

module.exports = Comments;

},{"../utils/loadScript":12}],19:[function(require,module,exports){
'use strict';

var transitionEndEvent = require('../utils/transitionEndEvent')();

var BaseView = require('./BaseView');

function Header () {
	this.el = document.getElementById('siteheader');
	this.pageContent = document.getElementById('pagecontent');
	this.closeButton = document.getElementById('siteheader-close');

	this.pages = {};
	var pages = document.querySelectorAll('.siteheader-page');
	var url;
	var i = pages.length;
	while (i--) {
		url = pages[i].id.split('-')[0];
		this.pages['/' + url + '/'] = {
			nav: document.querySelector('.sitenav a[href*="' + url + '"]'),
			page: pages[i]
		};
	}

	this.listenToTransitionEnd(this.el, this.onIntroComplete.bind(this));
}

var proto = Header.prototype = new BaseView();

proto.open = function (key, lastURL) {
	this.el.classList.remove('is-collapsed');
	this.pageContent.classList.add('is-disabled');
	this.hideCurrent();
	this.pages[key].nav.classList.add('is-selected');
	this.pages[key].page.classList.add('is-visible');

	if (lastURL) {
		this.closeButton.href = lastURL;
	}
};

proto.close = function () {
	this.el.classList.add('is-collapsed');
	this.pageContent.classList.remove('is-disabled');
	this.hideCurrent();
};

proto.hideCurrent = function () {
	var currentNav = document.querySelector('.sitenavlink.is-selected');
	if (currentNav) {
		currentNav.classList.remove('is-selected');
	}

	var currentPage = document.querySelector('.siteheader-page.is-visible');
	if (currentPage) {
		currentPage.classList.remove('is-visible');
	}
};

proto.getPageLinks = function () {
	var links = document.querySelectorAll('.sitenavlink[data-router]');
	var pathnames = [];
	var i = links.length;
	while (i--) {
		pathnames[i] = links[i].pathname;
	}
	return pathnames;
};

module.exports = Header;

},{"../utils/transitionEndEvent":15,"./BaseView":17}],20:[function(require,module,exports){
'use strict';

var BaseView = require('./BaseView');

function Labs () {
	if (document.body.classList.contains('is-lab', 'is-intro')) {
		// doesn't have an intro at the moment so listen to siteheader instead
		this.listenToTransitionEnd(document.getElementById('siteheader'), this.onIntroComplete.bind(this));
	}
}

var proto = Labs.prototype = new BaseView();

proto.hasPage = function (url) {
	// override and always return true until real labs page exists
	return true;
};

proto.hide = function (nextState) {
	switch (nextState) {
		case 'panels' :
			// TODO: add delay then remove whatever view we have here
			document.body.classList.add('is-transition-panelsbelow');
			document.body.classList.remove('is-darktheme');
			window.requestAnimationFrame(this.onHidden.bind(this));
			break;

		default :
			// TODO: add default
	}
};

proto.show = function (fromState, lastUrl) {
	document.body.classList.add('is-darktheme');
};

module.exports = Labs;

},{"./BaseView":17}],21:[function(require,module,exports){
'use strict';

var createPageItem = require('../utils/createPageItem');
var isMouseOut = require('../utils/isMouseOut');
var loadPage = require('../components/loadPage');
var setColor = require('../utils/setColor');
var transitionEndEvent = require('../utils/transitionEndEvent')();
var waitAnimationFrames = require('../utils/waitAnimationFrames');

var BaseView = require('./BaseView');
var PanelsNav = require('./PanelsNav');
var ScrollEvents = require('../components/ScrollEvents');

function Panels () {
	this.el = document.getElementById('panels') || createPageItem('panels', 'div', 'pagecontent-item', 'is-hidden');
	this.nav = new PanelsNav();
	this.panels = document.querySelectorAll('#panels .panel');
	this.panels = Array.prototype.slice.call(this.panels);
	this.panelsUrlMap = {};
	this.totalPanels = this.panels.length;
	this.currentIndex = -1;

	this.loadSelectors = [
		'#panels .panel',
		'#panels-nav'
	];

	this.onMouseOver = this.onMouseOver.bind(this);
	this.onMouseOut = this.onMouseOut.bind(this);
	this.onScrolledToEnd = this.onScrolledToEnd.bind(this);
	this.onScrolledToPoint = this.onScrolledToPoint.bind(this);
	this.onNavClicked = this.onNavClicked.bind(this);
	this.onHiddenToPost = this.onHiddenToPost.bind(this);

	this.on('onloaded', this.onPanelsLoaded.bind(this));

	if (document.body.classList.contains('is-panels', 'is-intro')) {
		this.listenToTransitionEnd(this.panels[this.totalPanels - 1], this.onIntroComplete.bind(this));
		this.deeplinked();
	}
	else if (document.body.classList.contains('is-lab')) {
		this.hideBelow();
	}
}

var proto = Panels.prototype = new BaseView();

proto.show = function (fromState, lastUrl) {
	switch (fromState) {
		case 'post' :
			this.showFromPost(lastUrl);
			break;

		case 'lab' :
			this.showFromBelow();
			break;

		default :
			// TODO: add default
	}
};

proto.showFromPost = function (url) {
	this.el.classList.remove('is-hidden');
	this.transitionFromPost(url);
	// this.enable();
};

proto.showFromBelow = function () {
	this.el.classList.remove('is-hidden');
	this.listenToTransitionEnd(this.getLastShownPanel(), this.onShowed);
	// this.enable();
	waitAnimationFrames(function () {
		this.el.classList.remove('is-hidebelow');
	}.bind(this), 2);
};

proto.hideBelow = function () {
	setColor(document.body);
	document.body.classList.add('is-transition-panelsbelow'); // TODO: should probably remove this when transition is done no? Maybe in app
	this.el.classList.add('is-hidebelow');
};

proto.hide = function (nextState) {
	switch (nextState) {
		case 'post' :
			this.transitionToPost();
			this.on('onhidden', this.onHiddenToPost);
			break;

		case 'lab' :
			this.hideBelow();
			window.requestAnimationFrame(this.onHidden.bind(this));
			break;

		default :
			this.disable();
			this.el.classList.add('is-hidden');
			this.onScrolledToPoint();
	}
};

proto.load = function (url) {
	BaseView.prototype.load.call(this, url || '/');
};

proto.onHiddenToPost = function (evt) {
	this.off('onhidden', this.onHiddenToPost);
	this.hide();
	this.resetTransition();
};

proto.addPanels = function (index, append) {
	function callback (index) {
		return function () {
			this.onPanelMouseOver(index);
		};
	}
	// TODO: add `is-shrunk-right` to the first added element if append is `true` and we're hovering
	var panel;
	var i = index || 0;
	for (i; i < this.totalPanels; ++i) {
		panel = this.panels[i];
		panel.addEventListener('mouseover', callback(i).bind(this), false);
		this.panelsUrlMap[panel.pathname] = {
			index: i,
			panel: panel
		};
		if (append) {
			this.el.appendChild(panel);
		}
	}
};

proto.addExpandClass = function () {
	this.panels[this.currentIndex].classList.add('is-expanded');

	if (this.currentIndex > 0) {
		this.panels[this.currentIndex - 1].classList.add('is-shrunk-left');
	}

	if (this.currentIndex < this.totalPanels - 1) {
		this.panels[this.currentIndex + 1].classList.add('is-shrunk-right');
	}
};

proto.removeExpandClass = function () {
	if (this.currentIndex > -1) {
		this.panels[this.currentIndex].classList.remove('is-expanded');

		if (this.currentIndex > 0) {
			this.panels[this.currentIndex - 1].classList.remove('is-shrunk-left');
		}

		if (this.currentIndex < this.totalPanels - 1) {
			this.panels[this.currentIndex + 1].classList.remove('is-shrunk-right');
		}
	}
};

proto.onPanelMouseOver = function (index) {
	if (this.currentIndex != index) {
		this.removeExpandClass();
		this.currentIndex = index;
		this.addExpandClass();
	}
};

proto.onMouseOver = function (evt) {
	this.el.removeEventListener('mouseover', this.onMouseOver);
	this.el.addEventListener('mouseout', this.onMouseOut, true);
	this.el.classList.add('is-hovered');
};

proto.onMouseOut = function (evt) {
	if (evt === undefined || isMouseOut(evt)) {
		this.el.removeEventListener('mouseout', this.onMouseOut);
		this.el.addEventListener('mouseover', this.onMouseOver, false);
		this.el.classList.remove('is-hovered');

		if (this.currentIndex > -1) {
			this.removeExpandClass();
			this.currentIndex = -1;
		}
	}
};

proto.onPanelsLoaded = function (evt) {
	// TODO: clean up this method - e.g. why the return ??
	var panels = evt.args[0];
	var nav = evt.args[1];

	this.nav.setLoading(false);
	this.panels = this.panels.concat(Array.prototype.slice.call(panels));
	var index = this.totalPanels;
	this.totalPanels = this.panels.length;
	this.addPanels(index, true);

	if (this.scrollEvents === undefined) {
		// not enabled yet
		if (nav[0]) {
			this.nav.setPath(nav[0].href);
		}
		return;
	}

	this.scrollEvents.addPoint(this.scrollEvents.widthMinusWindow + this.panels[0].offsetWidth);
	this.el.addEventListener('reachedpoint', this.onScrolledToPoint, false);
	this.nav.el.addEventListener('click', this.onNavClicked, false);

	if (nav[0]) {
		this.nav.setPath(nav[0].href);
		this.scrollEvents.update(this.el);
		this.el.addEventListener('reachedend', this.onScrolledToEnd, false);
	}
	else {
		this.allPanelsLoaded = true;
	}
};

proto.onScrolledToEnd = function (evt) {
	this.el.removeEventListener('reachedend', this.onScrolledToEnd);
	this.nav.setLoading(true);
	// TODO: make this just load()
	console.log('scrolled to end.... TODO');
	// loadPage(this.nav.getPath(), this.onPanelsLoaded, '#panels .panel', '#panels-nav');
};

proto.onScrolledToPoint = function (evt) {
	this.el.removeEventListener('reachedpoint', this.onScrolledToPoint);
	this.scrollEvents.clearPoints();
	this.nav.hide();
	if (this.allPanelsLoaded) {
		this.scrollEvents.disable();
	}
};

proto.onNavClicked = function (evt) {
	evt.preventDefault();
	if (!this.nav.getLoading()) {
		this.scrollEvents.scrollToPoint(0);
		this.onScrolledToPoint();
		this.nav.el.removeEventListener('click', this.onNavClicked);
	}
};

proto.getCurrentColor = function (url) {
	var panel = this.currentIndex ? this.panels[this.currentIndex] : this.panelsUrlMap[url].panel;
	return panel.dataset.color;
};

proto.getLastShownPanel = function () {
	var panel = this.panels[0];
	var winWidth = window.innerWidth;
	var scrollLeft = window.pageXOffset;
	for (var i = 0; i < this.totalPanels; i++) {
		if (this.panels[i].offsetLeft - scrollLeft > winWidth && i > 0) {
			panel = this.panels[i - 1];
			i = this.totalPanels;
		}
	}
	return panel;
};

proto.transitionToPost = function () {
	var color = this.getCurrentColor(location.pathname);
	document.body.classList.add('is-transition-topostfrompanels');
	setColor(document.body, color);

	this.transformed = this.nudgeSiblingPanels(this.currentIndex, 25); // 25 is half the expand width - maybe make this dynamic?
	var listenTo = this.transformed[0];
	this.listenToTransitionEnd(listenTo, this.onHidden);
};

proto.transitionFromPost = function (url) {
	var panelObj = this.panelsUrlMap[url];
	var midPoint = window.innerWidth * 0.5;
	var left = panelObj.panel.offsetLeft + (this.panels[0].offsetWidth * 0.5);
	var scrollLeft = Math.round(left - midPoint);
	window.scrollTo(scrollLeft, 0);

	this.transformed = this.nudgeSiblingPanels(panelObj.index);
	var listenTo = this.transformed[0];

	panelObj.panel.classList.add('is-transition-panel');

	waitAnimationFrames(function () {
		document.body.classList.remove('is-transition-topanelsfrompost');
		panelObj.panel.classList.remove('is-transition-panel');
		this.resetTransition();
		this.listenToTransitionEnd(listenTo, this.onShowed);
	}.bind(this), 2);
};

proto.nudgeSiblingPanels = function (index, expandWidth) {
	expandWidth = expandWidth || 0;
	var nudgedPanels = [];
	var panelWidth = this.panels[0].offsetWidth;
	var winWidth = window.innerWidth;
	var scrollLeft = window.pageXOffset;
	var slideAmount = winWidth - ((this.panels[index].offsetLeft - scrollLeft) + panelWidth + expandWidth);
	var style = '-webkit-transform: translateX(' + slideAmount + 'px); transform: translateX(' + slideAmount + 'px)';
	var i = index;

	while (++i && i < this.totalPanels) {
		if (this.panels[i].offsetLeft - scrollLeft < winWidth) {
			nudgedPanels.push(this.panels[i]);
			this.panels[i].style.cssText = style;
		}
		else {
			i = Infinity;
		}
	}

	slideAmount = this.panels[index].offsetLeft - scrollLeft - expandWidth;
	style = '-webkit-transform: translateX(-' + slideAmount + 'px); transform: translateX(-' + slideAmount + 'px)';
	scrollLeft -= panelWidth;
	i = index;

	while (i--) {
		if (this.panels[i].offsetLeft - scrollLeft) {
			nudgedPanels.push(this.panels[i]);
			this.panels[i].style.cssText = style;
		}
		else {
			i = -1;
		}
	}

	return nudgedPanels;
};

proto.resetTransition = function () {
	var i = this.transformed.length;
	while (i--) {
		this.transformed[i].style.cssText = '';
	}
	this.transformed = undefined;
	this.onMouseOut();
};

proto.enable = function () {
	this.el.addEventListener('mouseover', this.onMouseOver, false);
	this.el.addEventListener('reachedend', this.onScrolledToEnd, false);
	this.addPanels();
	if (this.scrollEvents === undefined) {
		this.scrollEvents = new ScrollEvents(this.el);
	}
	else {
		this.scrollEvents.update(this.el);
	}

	var onMouseMove = function (evt) {
		document.removeEventListener('mousemove', onMouseMove);
		var index = this.panels.indexOf(evt.target);
		if (index > -1) {
			this.onMouseOver();
			this.onPanelMouseOver(index);
		}
	}.bind(this);
	document.addEventListener('mousemove', onMouseMove, false);
};

proto.disable = function () {
	this.el.removeEventListener('mouseover', this.onMouseOver);
	this.el.removeEventListener('mouseout', this.onMouseOut);
};

module.exports = Panels;

},{"../components/ScrollEvents":5,"../components/loadPage":6,"../utils/createPageItem":10,"../utils/isMouseOut":11,"../utils/setColor":13,"../utils/transitionEndEvent":15,"../utils/waitAnimationFrames":16,"./BaseView":17,"./PanelsNav":22}],22:[function(require,module,exports){
'use strict';

var createPageItem = require('../utils/createPageItem');

function PanelsNav () {
	this.el = document.getElementById('panels-nav') || createPageItem('panels-nav', 'a', 'is-hidden');
}

var proto = PanelsNav.prototype;

proto.getLoading = function () {
	return this.loading;
};

proto.setLoading = function (loading) {
	this.loading = loading;
	if (this.loading) {
		this.el.classList.add('is-loading');
		this.show();
	}
	else {
		this.el.classList.remove('is-loading');
	}
};

proto.show = function () {
	this.el.classList.remove('is-hidden');
};

proto.hide = function () {
	this.el.classList.add('is-hidden');
};

proto.getPath = function () {
	return this.el.href;
};

proto.setPath = function (path) {
	this.el.href = path;
};

module.exports = PanelsNav;

},{"../utils/createPageItem":10}],23:[function(require,module,exports){
'use strict';

var createPageItem = require('../utils/createPageItem');
var loadPage = require('../components/loadPage');
var setColor = require('../utils/setColor');
var transitionEndEvent = require('../utils/transitionEndEvent')();
var waitAnimationFrames = require('../utils/waitAnimationFrames');

var BaseView = require('./BaseView');
var Comments = require('./Comments');

function Posts (options) {
	this.el = document.getElementById('post') || createPageItem('post', 'div', 'pagecontent-item', 'is-hidden');
	this.nextNav = document.querySelector('.post-nav-next');
	this.previousNav = document.querySelector('.post-nav-previous');
	this.closeNav = document.querySelector('.post-nav-close');

	this.loadSelectors = [
		'.post',
		'.post-nav-next',
		'.post-nav-previous'
	];

	this.onHideTransitionEnd = this.onHideTransitionEnd.bind(this);
	this.onSlideOffTransitionEnd = this.onSlideOffTransitionEnd.bind(this);
	this.onSlideOnTransitionEnd = this.onSlideOnTransitionEnd.bind(this);

	this.posts = {};
	this.comments = new Comments();

	this.on('onloaded', this.onPostLoaded.bind(this));
	this.on('onshowed', this.onShow.bind(this)); // maybe store and remove?

	if (document.body.classList.contains('is-post', 'is-intro')) {
		this.listenToTransitionEnd(this.el, this.onIntroComplete.bind(this));
		this.deeplinked();

		this.onPostLoaded({
			url: location.pathname,
			args: this.pages[location.pathname]
		});

		this.loadSiblingPosts();
	}
}

var proto = Posts.prototype = new BaseView();

proto.onPostLoaded = function(evt) {
	var url = evt.url;
	var post = evt.args[0][0];
	var navNext = evt.args[1][0];
	var navPrevious = evt.args[2][0];
	var currentPost = this.posts[url] = {
		post: post,
		html: post.innerHTML,
		color: post.dataset.color,
		next: navNext.classList.contains('is-hidden') ? false : navNext.pathname,
		previous: navPrevious.classList.contains('is-hidden') ? false : navPrevious.pathname
	};

	if (url === this.nextNav.pathname) {
		setColor(this.nextNav, currentPost.color);
	}
	else if (url === this.previousNav.pathname) {
		setColor(this.previousNav, currentPost.color);
	}
};

proto.show = function(fromState, lastUrl) {
	switch (fromState) {
		case 'panels' :
			this.showPost(location.pathname);
			break;

		default :
			// TODO: add default
	}
};

proto.hide = function (nextState) {
	switch (nextState) {
		case 'panels' :
			document.body.classList.add('is-transition-topanelsfrompost');
			this.hidePost();
			// this.on('onhidden', this.onHiddenToPanels);
			break;

		default :
			// TODO: add default
	}
};

proto.hidePost = function () {
	this.listenToTransitionEnd(this.el, this.onHidden);
	this.el.classList.add('is-hidden');
	this.nextNav.classList.add('is-hidden');
	this.previousNav.classList.add('is-hidden');
	this.closeNav.classList.add('is-hidden');
};

proto.update = function (url) {
	this.slide(url);
};


// maybe just put all this in update ??
proto.slide = function (url) {
	this.slideOff(url);

	if (this.posts[url]) {
		// post is already loaded
		setColor(document.body, this.posts[url].color);
		this.setNavHref(this.posts[url]);
	}
	else {
		// need to load post
		var callback = function (evt) {
			if (evt.url === url) {
				this.off('onloaded', callback);
				setColor(document.body, this.posts[url].color);
				this.setNavHref(this.posts[url]);
			}
		};
		this.on('onloaded', callback);
		this.load(url);
	}
};

proto.slideOff = function (url) {
	this.closeNav.classList.add('is-hidden');
	var slideDirection = (!this.nextNav.classList.contains('is-hidden') && url === this.nextNav.pathname) ? 'right' : 'left';
	document.body.classList.add('is-slideoff', 'is-slideoff-' + slideDirection);
	this.el.removeEventListener(transitionEndEvent, this.onSlideOnTransitionEnd);
	this.el.addEventListener(transitionEndEvent, this.onSlideOffTransitionEnd, false);
};

proto.slideOn = function () {
	this.el.innerHTML = this.posts[location.pathname].html;

	window.scrollTo(0, 0);

	var remove;
	if (document.body.classList.contains('is-slideoff-right')) {
		document.body.classList.remove('is-slideoff-right');
		document.body.classList.add('is-slideoff-left', 'is-notransitions');
		remove = 'is-slideoff-left';
	}
	else {
		document.body.classList.remove('is-slideoff-left');
		document.body.classList.add('is-slideoff-right', 'is-notransitions');
		remove = 'is-slideoff-right';
	}

	waitAnimationFrames(function () {
		document.body.classList.remove('is-slideoff', remove, 'is-notransitions');
		this.el.addEventListener(transitionEndEvent, this.onSlideOnTransitionEnd, false);
		this.comments.refresh();
	}.bind(this), 2);
};

proto.loadSiblingPosts = function () {
	var currentUrl = location.pathname;
	var nextUrl = this.nextNav.pathname;
	var previousUrl = this.previousNav.pathname;

	if (nextUrl !== currentUrl && !this.nextNav.classList.contains('is-hidden')) {
		if (this.hasPage(nextUrl)) {
			setColor(this.nextNav, this.posts[nextUrl].color);
		}
		else {
			this.load(nextUrl);
		}
	}

	if (previousUrl !== currentUrl && !this.previousNav.classList.contains('is-hidden')) {
		if (this.hasPage(previousUrl)) {
			setColor(this.previousNav, this.posts[previousUrl].color);
		}
		else {
			this.load(previousUrl);
		}
	}
};

proto.setNavHref = function (post) {
	if (post.next) {
		this.nextNav.href = post.next;
		this.nextNav.classList.remove('is-hidden');
	}
	else {
		this.nextNav.classList.add('is-hidden');
	}

	if (post.previous) {
		this.previousNav.href = post.previous;
		this.previousNav.classList.remove('is-hidden');
	}
	else {
		this.previousNav.classList.add('is-hidden');
	}

	this.loadSiblingPosts();
};

proto.showPost = function (url) {
	var currentPost = this.posts[url];
	this.el.innerHTML = currentPost.html;
	this.el.classList.remove('is-hidden');
	this.listenToTransitionEnd(this.el, this.onShowed);
	this.setNavHref(currentPost);
};

proto.onShow = function () {
	this.closeNav.classList.remove('is-hidden');
};

proto.onHideTransitionEnd = function () {
	this.el.removeEventListener(transitionEndEvent, this.onHideTransitionEnd);
	this.watcher.complete();
};

proto.onSlideOffTransitionEnd = function () {
	this.el.removeEventListener(transitionEndEvent, this.onSlideOffTransitionEnd);
	if (this.posts[location.pathname]) {
		this.slideOn();
	}
	else {
		var callback = function (evt) {
			if (evt.url === location.pathname) {
				this.off('onloaded', callback);
				this.slideOn();
			}
		};
		this.on('onloaded', callback);
	}
};

proto.onSlideOnTransitionEnd = function () {
	this.el.removeEventListener(transitionEndEvent, this.onSlideOnTransitionEnd);
	this.closeNav.classList.remove('is-hidden');
};

proto.onIntroEnded = function (evt) {
	this.el.removeEventListener(transitionEndEvent, this.onIntroEnded);
	this.introWatcher.complete();
	this.comments.refresh();
};

module.exports = Posts;

},{"../components/loadPage":6,"../utils/createPageItem":10,"../utils/setColor":13,"../utils/transitionEndEvent":15,"../utils/waitAnimationFrames":16,"./BaseView":17,"./Comments":18}]},{},[8]);
