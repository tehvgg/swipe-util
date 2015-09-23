/**
 * Triggers swipe events based on user touch interaction.
 * @class Swipe
 */
(function (scope) {

	function Swipe (scope, options) {
		this.init(scope, options);
	}
	var p = Swipe.prototype;

	/**
	 * The element within which to handle touches.
	 * @property scope
	 * @type {HTMLElement}
	 */
	p.scope = null;
	/**
	 * Stores cached string values of the touch events.
	 * @property events
	 * @type {object}
	 */
	p.events = null;
	/**
	 * How sensitive the util is to triggering a swipe. The higher the number the greater the sense.
	 * Allows a number between 1-100.
	 * @property sensitivity
	 * @type {number}
	 */
	p.sensitivity = 75;
	/**
	 * The element being interacted with.
	 * @property activeElement
	 * @type {HTMLElement}
	 */
	p.activeElement = null;
	/**
	 * Whether or not to cancel the swipe event trigger
	 * @property cancelSwipe
	 * @type {boolean}
	 */
	p.cancelSwipe = false;
	/**
	 * Whether or not a swipe event is in progress.
	 * @property swipeInProgress
	 * @type {boolean}
	 */
	p.swipeInProgress = false;
	/**
	 * Decides whether or not to prevent default scroll behaviour during a touchmove event.
	 * @property doPreventScroll
	 * @type {boolean}
	 */
	p.doPreventScroll = false;
	/**
	 * Whether or not to detect scroll prevention.
	 * @property detectScrollPrevention
	 * @type {boolean}
	 */
	p.detectScrollPrevention = false;
	/**
	 * Whether or not to continue preventing the scroll.
	 * @property continuePreventingScroll
	 * @type {boolean}
	 */
	p.continuePreventingScroll = false;
	/**
	 * An object of directions that have been listened to for swipe events.
	 * @property listenTo
	 * @type {Object}
	 */
	p.listenTo = {
		up: 0,
		down: 0,
		left: 0,
		right: 0
	};
	/**
	 * The screen location on the X axis of when the touch was started.
	 * @property swipeStart_clientX
	 * @type {number}
	 */
	p.swipeStart_clientX = null;
	/**
	 * The screen location on the Y axis of when the touch was started.
	 * @property swipeStart_clientY
	 * @type {number}
	 */
	p.swipeStart_clientY = null;
	/**
	 * The screen location on the X axis of when the touch was ended.
	 * @property swipeEnd_clientX
	 * @type {number}
	 */
	p.swipeEnd_clientX = null;
	/**
	 * The screen location on the Y axis of when the touch was ended.
	 * @property swipeEnd_clientY
	 * @type {number}
	 */
	p.swipeEnd_clientY = null;
	/**
	 * Universal time at the beginning of the swipe.
	 * @property timeState
	 * @type {number}
	 */
	p.timeStart = null;
	/**
	 * Universal time at the end of the swipe.
	 * @property timeEnd
	 * @type {number}
	 */
	p.timeEnd = null;
	/**
	 * A string used for easy event listener application.
	 * @property up
	 * @type {string}
	 */
	p.up = 'up';
	/**
	 * A string used for easy event listener application.
	 * @property down
	 * @type {string}
	 */
	p.down = 'down';
	/**
	 * A string used for easy event listener application.
	 * @property left
	 * @type {string}
	 */
	p.left = 'left';
	/**
	 * A string used for easy event listener application.
	 * @property right
	 * @type {string}
	 */
	p.right = 'right';

	/**
	 * Set our options, scope, and listeners. Also detect support.
	 * @method init
	 * @param scope
	 * @param options
	 */
	p.init = function (scope, options) {
		if (!options) {
			this.doPreventScroll = this.detectScrollPrevention = options.doPreventScroll;
		}

		try {
			this.detectEventSupport();

			// accept a scope, default to the body
			this.scope = scope || window.document.body;

			// apply event listeners
			this.scope.addEventListener(this.events.start, this._handleTouchStart.bind(this));
			this.scope.addEventListener(this.events.move, this._handleTouchMove.bind(this));
			this.scope.addEventListener(this.events.end, this._handleTouchEnd.bind(this));
		} catch (err) {
			console.warn(err);
		}
	};

	/**
	 * Remove all event listeners.
	 * @method destroy
	 */
	p.destroy = function () {
		this.scope.removeEventListener(this.events.start, this._handleTouchStart.bind(this));
		this.scope.removeEventListener(this.events.move, this._handleTouchMove.bind(this));
		this.scope.removeEventListener(this.events.end, this._handleTouchEnd.bind(this));
	};

	/**
	 * Detect TouchEvent support, throwing an error if there is none.
	 * TODO: PointerEvents. Maybe mozilla pointer.js ?
	 * An error is thrown if touch isn't supported because this util shouldn't be initialized unless
	 */
	p.detectEventSupport = function () {
		if ('ontouchstart' in window || 'maxTouchPoints' in window.navigator > 1 || 'msMaxTouchPoints' in window.navigator > 1) {
			this.events = {
				start: 'touchstart',
				move: 'touchmove',
				end: 'touchend'
			};
		} else {
			throw new Error('TouchEvent not supported.');
		}
	};

	/**
	 * Adds a swipe listener to the scope, caching the direction in the listenTo object.
	 * @method addListener
	 * @param type
	 * @param handler
	 */
	p.addListener = function (type, handler) {
		this.listenTo[type]++;
		this.scope.addEventListener(type, handler);
	};

	/**
	 * Removes an applied listener if it exists.
	 * @method removeListener
	 * @param type
	 * @param handler
	 */
	p.removeListener = function (type, handler) {
		// only remove listeners if they actually exist
		this.listenTo[type] > 0 && this.listenTo[type]--;
		this.scope.removeEventListener(type, handler);
	};

	/**
	 * Checks if the passed swipe direction is being listened to.
	 * @method directionHasListener
	 * @param direction
	 * @returns {boolean}
	 * @private
	 */
	p._directionHasListener = function (direction) {
		return this.listenTo[direction] > 0;
	};

	/**
	 * Decides whether or not to trigger a swipe.
	 * @method calculateSwipe
	 * @private
	 */
	p._calculateSwipe = function () {
		var threshold = this.timeEnd - this.timeStart;

		var diffX = this.swipeStart_clientX - this.swipeEnd_clientX;
		var diffY = this.swipeStart_clientY - this.swipeEnd_clientY;

		var direction = this._findSwipeDirection(diffX, diffY, threshold);

		// only trigger swipe if a direction was calculated.
		direction && this._triggerSwipe(direction);
	};

	/**
	 * Calculates which direction the swipe was in.
	 * @method findSwipeDirection
	 * @param diffX
	 * @param diffY
	 * @param threshold
	 * @returns {string|boolean}
	 * @private
	 */
	p._findSwipeDirection = function (diffX, diffY, threshold) {
		var absX = Math.abs(diffX);
		var absY = Math.abs(diffY);

		threshold -= this.sensitivity;

		if (absX > absY) {
			// horizontal
			if (diffX >= threshold) {
				return 'left';
			} else if (absX >= threshold) {
				return 'right';
			}
		} else {
			// vertical
			if (diffY >= threshold) {
				return 'up';
			} else if (absY >= threshold) {
				return 'down';
			}
		}

		return false;
	};

	/**
	 * Triggers a swipe event in the direction calculated.
	 * @method triggerSwipe
	 * @param direction
	 * @private
	 */
	p._triggerSwipe = function (direction) {
		if (this.swipeInProgress && !this.cancelSwipe) {
			this.swipeInProgress = false;
			var swipeEvent = document.createEvent('Event');
			swipeEvent.initEvent(direction, true, true);
			this.activeElement.dispatchEvent(swipeEvent);
		}
	};

	/**
	 * Handles the touch start event.
	 * @method handleTouchStart
	 * @param event
	 * @private
	 */
	p._handleTouchStart = function (event) {
		this.activeElement = event.currentTarget;
		this.timeStart = new Date().getTime();
		this.cancelSwipe = true;
		// check for the TouchList before getting X/Y data
		var touches = !!event.touches;
		this.swipeStart_clientX = touches ? event.touches[0].clientX : event.clientX;
		this.swipeStart_clientY = touches ? event.touches[0].clientY : event.clientY;
	};

	/**
	 * Handles the touch move event (a swipe).
	 * @method handleTouchMove
	 * @param event
	 * @private
	 */
	p._handleTouchMove = function (event) {
		if (this.detectScrollPrevention) {
			var touches = !!event.touches;
			var diffX = this.swipeStart_clientX - (touches ? event.touches[0].clientX : event.clientX);
			var diffY = this.swipeStart_clientY - (touches ? event.touches[0].clientY : event.clientY);
			var direction = this._findSwipeDirection(diffX, diffY, 0, 0);
			this.continuePreventingScroll = this._directionHasListener(direction);
			this.detectScrollPrevention = false;
		}
		if (this.doPreventScroll && this.continuePreventingScroll) { event.preventDefault(); }

		this.swipeInProgress = true;
		this.cancelSwipe = false;
	};

	/**
	 * Handles the touch end event
	 * @method handleTouchEnd
	 * @param event
	 * @private
	 */
	p._handleTouchEnd = function (event) {
		this.timeEnd = new Date().getTime();
		// cache swipe data
		// check for the TouchList before getting X/Y data
		var touches = !!event.touches;
		this.swipeEnd_clientX = touches ? event.changedTouches[0].clientX : event.clientX;
		this.swipeEnd_clientY = touches ? event.changedTouches[0].clientY : event.clientY;
		this._calculateSwipe();
		this.detectScrollPrevention = true;
		this.continuePreventingScroll = false;
	};

	scope.Swipe = Swipe;

})(window);
