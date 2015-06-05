/**
 * @class gTouch
 * @description Handles touch device interaction, including immediate click triggers and swipe events.
 */
(function (scope) {

	function gTouch (scope, options) {
		this.init(scope, options);
	}

	var p = {};

	/// PROPERTIES ///
	p.scope = null;
	p.events = {};

	p.swipeSupport = null;
	p.clickSupport = null;

	/**
	 * The minimum distance a swipe can travel before it triggers a swipe event.
	 * @type {number}
	 */
	p.minimumDistance = 100;

	p.activeElement = null;

	p.cancelClickTrigger = false;
	p.cancelSwipeTrigger = false;
	p.swipeInProgress = false;
	/**
	 * Decides whether or not to prevent default scroll behaviour during a -move event.
	 * @type {boolean}
	 */
	p.preventScroll = false;
	p.continuePreventingScroll = true;
	/**
	 * An object of directions that have been listened to for swipe events.
	 * @type {Array}
	 */
	p.listenTo = {
		up: 0,
		down: 0,
		left: 0,
		right: 0
	};

	p.swipeStart_clientX = null;
	p.swipeStart_clientY = null;
	p.swipeEnd_clientX = null;
	p.swipeEnd_clientY = null;

	p.timeStart = null;
	p.timeEnd = null;

	/// EVENTS ///
	p.up = 'swipeup';
	p.down = 'swipedown';
	p.left = 'swipeleft';
	p.right = 'swiperight';

	/// UTIL ///
	p.init = function (scope, options) {
		if (typeof options === 'object') {
			this.swipeSupport = options.swipe;
			this.clickSupport = options.click;
		}

		this.detectEventSupport();

		// accept a scope, default to the body
		this.scope = scope || window.document.body;

		// apply event listeners
		this.scope.addEventListener(this.events.start, this._handleTouchStart.bind(this));
		this.scope.addEventListener(this.events.move, this._handleTouchMove.bind(this));
		this.scope.addEventListener(this.events.end, this._handleTouchEnd.bind(this));
	};

	p.destroy = function () {
		this.scope.removeEventListener(this.events.start, this._handleTouchStart.bind(this));
		this.scope.removeEventListener(this.events.move, this._handleTouchMove.bind(this));
		this.scope.removeEventListener(this.events.end, this._handleTouchEnd.bind(this));
	};

	p.detectEventSupport = function () {
		if ('ontouchstart' in window) {
			// Touch events
			this.events = {
				start: 'touchstart',
				move: 'touchmove',
				end: 'touchend'
			};
		} else if ('onmousedown' in window) {
			// Mouse events
			this.events = {
				start: 'mousedown',
				move: 'mousemove',
				end: 'mouseup'
			};
		} else {
			throw new Error('No touch/mouse events supported in your browser.');
		}
	};

	/**
	 * @method detectTouchDevice
	 * @description Use feature detection to detect a touch device.
	 * @returns {null|*}
	 */
	p.detectTouchDevice = function () {
		return (('ontouchstart' in window) // standard detection
			|| ('maxTouchPoints' in navigator) // unprefixed touch detection (IE11+)
			|| ('msMaxTouchPoints' in navigator)); // prefixed touch detection (IE10-)
	};

	/// EVENTS ///
	p.addListener = function (type, handler) {
		this.listenTo[type]++;
		this.scope.addEventListener(type, handler);
	};

	p.removeListener = function (type, handler) {
		this.listenTo[type]--;
		this.scope.removeEventListener(type, handler);
	};

	p._directionHasListener = function (direction) {
		return this.listenTo[direction] > 0;
	};

	/// CALC ///
	p._calculateSwipe = function () {
		var threshold = this.timeEnd - this.timeStart;

		var diffX = this.swipeStart_clientX - this.swipeEnd_clientX;
		var diffY = this.swipeStart_clientY - this.swipeEnd_clientY;

		var direction = this._findSwipeDirection(diffX, diffY, threshold);

		// only trigger swipe if a direction was calculated.
		direction !== "" && this._triggerSwipe(direction);
	};

	p._findSwipeDirection = function (diffX, diffY, threshold) {
		var minDist = this.minimumDistance;
		var absX = Math.abs(diffX);
		var absY = Math.abs(diffY);

		if (absX > absY && absX >= minDist) {
			// horizontal
			if (diffX >= threshold) {
				return 'left';
			} else if (absX >= threshold) {
				return 'right';
			}
		} else if (absY >= minDist) {
			// vertical
			if (diffY >= threshold) {
				return 'up';
			} else if (absY >= threshold) {
				return 'down';
			}
		}

		return "";
	};

	/// TRIGGER ///
	/**
	 * @method trigger
	 * @description Dispatches a duplicate of the original event on the original target.
	 * @param original
	 */
	p._triggerClick = function (original) {
		var newEvent;
		if ('ontouchstart' in window && !!window.TouchEvent) {
			newEvent = document.createEvent('TouchEvent');
			newEvent.initTouchEvent('touchend', true, true, window, 1, original.screenX, original.screenY, original.clientX, original.clientY, false, false, false, false, 0, null);
		} else {
			newEvent = document.createEvent('MouseEvent');
			newEvent.initMouseEvent('click', true, true, window, 1, original.screenX, original.screenY, original.clientX, original.clientY, false, false, false, false, 0, null);
		}
		original.target.dispatchEvent(newEvent);
	};

	/**
	 * @method triggerSwipe
	 * @param direction
	 */
	p._triggerSwipe = function (direction) {
		if (this.swipeInProgress && !this.cancelSwipeTrigger) {
			this.swipeInProgress = false;
			var swipeEvent = document.createEvent('Event');
			swipeEvent.initEvent('swipe' + direction, true, true);
			this.activeElement.dispatchEvent(swipeEvent);
		}
	};

	/// HANDLERS ///
	/**
	 * @method handleTouchStart
	 * @param event
	 */
	p._handleTouchStart = function (event) {
		this.activeElement = event.currentTarget;
		this.timeStart = new Date().getTime();
		if (this.clickSupport) {
			this.cancelClickTrigger = false;
		}
		if (this.swipeSupport) {
			this.cancelSwipeTrigger = true;
			// check for the TouchList before getting X/Y data
			var touches = !!event.touches;
			this.swipeStart_clientX = touches ? event.touches[0].clientX : event.clientX;
			this.swipeStart_clientY = touches ? event.touches[0].clientY : event.clientY;
		}
	};

	/**
	 * @method handleTouchMove
	 * @param event
	 */
	p._handleTouchMove = function (event) {
		if (this.clickSupport) {
			this.cancelClickTrigger = true;
		}
		if (this.swipeSupport) {
			if (this.preventScroll && this.continuePreventingScroll) {
				var touches = !!event.touches;
				var diffX = this.swipeStart_clientX - touches ? event.touches[0].clientX : event.clientX;
				var diffY = this.swipeStart_clientY - touches ? event.touches[0].clientY : event.clientY;

				var direction = this._findSwipeDirection(diffX, diffY, 0);

				(this._directionHasListener(direction)) ? event.preventDefault() : this.continuePreventingScroll = false;
			}
			this.swipeInProgress = true;
			this.cancelSwipeTrigger = false;
		}
	};

	/**
	 * @method handleTouchEnd
	 * @param event
	 * @returns {boolean}
	 */
	p._handleTouchEnd = function (event) {
		this.timeEnd = new Date().getTime();
		if (this.clickSupport && !this.cancelClickTrigger) {
			// single tap, trigger click
			event.preventDefault();
			this._triggerClick(event);
		}
		if (this.swipeSupport) {
			// cache swipe data
			// check for the TouchList before getting X/Y data
			var touches = !!event.touches;
			this.swipeEnd_clientX = touches ? event.changedTouches[0].clientX : event.clientX;
			this.swipeEnd_clientY = touches ? event.changedTouches[0].clientY : event.clientY;
			this._calculateSwipe();
			this.continuePreventingScroll = true;
		}
	};

	/// CREATE ///
	gTouch.prototype = Object.create(p);
	scope.gTouch = gTouch;

})(window);
