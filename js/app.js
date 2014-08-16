(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Panels = require('./views/Panels');
var panels = new Panels({
	id: 'panels',
	navId: 'panels-nav'
});

window.requestAnimationFrame(function () {
	document.body.classList.remove('is-intro');
});

var loadScript = require('./external/loadScript');
loadScript('twitter-wjs', '//platform.twitter.com/widgets.js', 500);

},{"./external/loadScript":4,"./views/Panels":7}],2:[function(require,module,exports){
'use strict';

var throttleEvent = require('../utils/throttleEvent');

function ScrollToEnd (el) {
	this.onScrolled = this.onScrolled.bind(this);
	this.onResized = this.onResized.bind(this);
	this.update(el);
	this.enable();
}

var proto = ScrollToEnd.prototype;

proto.update = function (el) {
	this.el = el;
	this.onResized();
};

proto.onScrolled = function (evt) {
	if (window.pageXOffset >= this.widthMinusWindow) {
		var reachedEnd = new CustomEvent('reachedend', {
			detail: {}
		});
		this.el.dispatchEvent(reachedEnd);
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

module.exports = ScrollToEnd;

},{"../utils/throttleEvent":6}],3:[function(require,module,exports){
'use strict';

module.exports = function loadPanels (url, callback) {

	var req = new XMLHttpRequest();

	req.onload = function () {

		if (req.readyState === 4) {
			if (req.status === 200) {

				var fragment = document.createDocumentFragment();
				fragment.appendChild(document.createElement('body'));
				var body = fragment.firstElementChild;
				body.innerHTML = this.responseText;

				var panels = fragment.querySelectorAll('#panels .panel');
				var nav = fragment.querySelectorAll('#panels-nav');

				callback.call(this, {
					nav: nav,
					panels: panels
				});
			}
		}
	};

	req.open('get', url, true);
	req.send();
};

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
'use strict';

var isMouseOut = require('../utils/isMouseOut');
var loadPanels = require('../components/loadPanels');

var PanelsNav = require('./components/PanelsNav');
var ScrollToEnd = require('../components/ScrollToEnd');

function Panels (options) {

	this.el = document.getElementById(options.id);
	this.nav = new PanelsNav({
		id: options.navId
	});
	this.panels = document.querySelectorAll('#' + options.id + ' .panel');
	this.panels = Array.prototype.slice.call(this.panels);
	this.totalPanels = this.panels.length;
	this.currentIndex = -1;

	this.onMouseOver = this.onMouseOver.bind(this);
	this.onMouseOut = this.onMouseOut.bind(this);
	this.onScrolledToEnd = this.onScrolledToEnd.bind(this);
	this.onPanelsLoaded = this.onPanelsLoaded.bind(this);

	if (document.body.classList.contains('is-intro')) {
		this.onIntroEnded = this.onIntroEnded.bind(this);
		// webkitTransitionEnd otransitionend msTransitionEnd transitionend
		this.panels[this.totalPanels - 1].addEventListener('webkitTransitionEnd', this.onIntroEnded, false);
	}
	else {
		this.enable();
	}
}

var proto = Panels.prototype;

proto.addPanels = function (index, append) {
	function callback (index) {
		return function () {
			this.onPanelMouseOver(index);
		};
	}
	index = index || 0;
	for (index; index < this.totalPanels; ++index) {
		this.panels[index].addEventListener('mouseover', callback(index).bind(this), false);
		if (append) {
			this.el.appendChild(this.panels[index]);
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

proto.onIntroEnded = function (evt) {
	// webkitTransitionEnd otransitionend msTransitionEnd transitionend
	this.panels[this.totalPanels - 1].removeEventListener('webkitTransitionEnd', this.onIntroEnded);
	this.enable();

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

proto.onPanelMouseOver = function (index) {
	if (this.currentIndex != index) {
		this.removeExpandClass();
		this.currentIndex = index;
		this.addExpandClass();
	}
};

proto.onMouseOver = function (evt) {
	this.el.removeEventListener('mouseover', this.onMouseOver);
	this.el.addEventListener('mouseout', this.onMouseOut, false);
	this.el.classList.add('is-hovered');
};

proto.onMouseOut = function (evt) {
	if (isMouseOut(evt)) {
		this.el.removeEventListener('mouseout', this.onMouseOut);
		this.el.addEventListener('mouseover', this.onMouseOver, false);
		this.el.classList.remove('is-hovered');

		if (this.currentIndex > -1) {
			this.removeExpandClass();
			this.currentIndex = -1;
		}
	}
};

proto.onPanelsLoaded = function (obj) {
	this.panels = this.panels.concat(Array.prototype.slice.call(obj.panels));

	var index = this.totalPanels;
	this.totalPanels = this.panels.length;
	this.addPanels(index, true);
};

proto.onScrolledToEnd = function (evt) {
	this.el.removeEventListener('reachedend', this.onScrolledToEnd);
	this.nav.isLoading(true);
	loadPanels(this.nav.getPath(), this.onPanelsLoaded);
};

proto.enable = function () {
	if (this.el) {
		this.el.addEventListener('mouseover', this.onMouseOver, false);
		this.el.addEventListener('reachedend', this.onScrolledToEnd, false);
		this.addPanels();
		if (this.scrollToEnd === undefined) {
			this.scrollToEnd = new ScrollToEnd(this.el);
		}
	}
};

proto.disable = function () {
	this.el.removeEventListener('mouseover', this.onMouseOver);
	this.el.removeEventListener('mouseout', this.onMouseOut);
};

module.exports = Panels;

},{"../components/ScrollToEnd":2,"../components/loadPanels":3,"../utils/isMouseOut":5,"./components/PanelsNav":8}],8:[function(require,module,exports){
'use strict';

function PanelsNav (options) {

	this.el = document.getElementById(options.id);
	this.hide();
}

var proto = PanelsNav.prototype;

proto.isLoading = function (loading) {
	if (loading) {
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

module.exports = PanelsNav;

},{}]},{},[1]);
