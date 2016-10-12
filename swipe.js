/**
 * Triggers swipe events based on user touch interaction.
 * @class Swipe
 */
export class Swipe {

	/**
	 * Set our options, scope, and listeners. Also detect support.
	 * @constructor
	 * @param scope
	 * @param [sensitivity=75]
	 * @param [preventScroll=true]
	 */
	constructor (scope, sensitivity = 75, preventScroll = true) {
		try { this.detectEventSupport(); }
		catch (err) { console.warn(err); return; }
		/**
		 * The element within which to handle touches.
		 * @property scope
		 * @type {HTMLElement}
		 */
		this.scope = scope;
		/**
		 * Decides whether or not to prevent default scroll behaviour during a touchmove event.
		 * @property preventScroll
		 * @type {boolean}
		 */
		this.preventScroll = preventScroll;
		/**
		 * How sensitive the util is to triggering a swipe. The higher the number the greater the sense.
		 * @property sensitivity
		 * @type {number}
		 */
		this._sensitivity = sensitivity;
		/**
		 * The element being interacted with.
		 * @property activeElement
		 * @type {HTMLElement}
		 */
		this._activeElement = null;
		/**
		 * Whether or not to cancel the swipe event trigger
		 * @property cancelSwipe
		 * @type {boolean}
		 */
		this._cancelSwipe = false;
		/**
		 * Whether or not a swipe event is in progress.
		 * @property swipeInProgress
		 * @type {boolean}
		 */
		this._swipeInProgress = false;
		/**
		 * Whether or not to detect scroll prevention.
		 * @property detectScrollPrevention
		 * @type {boolean}
		 */
		this._detectScrollPrevention = false;
		/**
		 * Whether or not to continue preventing the scroll.
		 * @property continuePreventingScroll
		 * @type {boolean}
		 */
		this._continuePreventingScroll = false;
		/**
		 * An object of directions that have been listened to for swipe events.
		 * @property listenTo
		 * @type {Object}
		 */
		this._listenTo = {
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
		this._swipeStart_clientX = null;
		/**
		 * The screen location on the Y axis of when the touch was started.
		 * @property swipeStart_clientY
		 * @type {number}
		 */
		this._swipeStart_clientY = null;
		/**
		 * The screen location on the X axis of when the touch was ended.
		 * @property swipeEnd_clientX
		 * @type {number}
		 */
		this._swipeEnd_clientX = null;
		/**
		 * The screen location on the Y axis of when the touch was ended.
		 * @property swipeEnd_clientY
		 * @type {number}
		 */
		this._swipeEnd_clientY = null;
		/**
		 * Universal time at the beginning of the swipe.
		 * @property timeState
		 * @type {number}
		 */
		this._timeStart = null;
		/**
		 * Universal time at the end of the swipe.
		 * @property timeEnd
		 * @type {number}
		 */
		this._timeEnd = null;
	}

	/**
	 * [sensitivity description]
	 * @param  {[type]} sens [description]
	 * @return {[type]}      [description]
	 */
	set sensitivity (sens) {
		this._sensitivity = Math.min(100, Math.max(1, sens));
	}

	get sensitivity () {
		return this._sensitivity;
	}

	/**
	 * Detect TouchEvent support, throwing an error if there is none.
	 * TODO: PointerEvents. Maybe mozilla pointer.js ?
	 * An error is thrown if touch isn't supported because this util shouldn't be initialized unless
	 */
	detectEventSupport () {
		if (!('ontouchstart' in window
			 || 'maxTouchPoints' in window.navigator > 1
			 || 'msMaxTouchPoints' in window.navigator > 1))
		{
			throw new Error('TouchEvent not supported.');
		}
	}

	/**
	 * Remove all event listeners.
	 * @method destroy
	 */
	destroy () {
		this.scope.removeEventListener('touchstart', this._handleTouchStart.bind(this));
		this.scope.removeEventListener('touchmove', this._handleTouchMove.bind(this));
		this.scope.removeEventListener('touchend', this._handleTouchEnd.bind(this));
	}

	/**
	 * Adds a swipe listener to the scope, caching the direction in the listenTo object.
	 * @method addListener
	 * @param type
	 * @param handler
	 */
	addListener (type, handler) {
		this._listenTo[type]++;
		this.scope.addEventListener(type, handler);
	}

	/**
	 * Removes an applied listener if it exists.
	 * @method removeListener
	 * @param type
	 * @param handler
	 */
	removeListener (type, handler) {
		// only remove listeners if they actually exist
		this._listenTo[type] > 0 && this._listenTo[type]--;
		this.scope.removeEventListener(type, handler);
	}

	/**
	 * Checks if the passed swipe direction is being listened to.
	 * @method _directionHasListener
	 * @param direction
	 * @returns {boolean}
	 * @private
	 */
	_directionHasListener (direction) {
		return this._listenTo[direction] > 0;
	}

	/**
	 * Decides whether or not to trigger a swipe.
	 * @method _calculateSwipe
	 * @private
	 */
	_calculateSwipe () {
		let threshold = this.timeEnd - this.timeStart;
		let diffX = this.swipeStart_clientX - this.swipeEnd_clientX;
		let diffY = this.swipeStart_clientY - this.swipeEnd_clientY;
		let direction = this._findSwipeDirection(diffX, diffY, threshold);
		// only trigger swipe if a direction was calculated.
		direction && this._triggerSwipe(direction);
	}

	/**
	 * Calculates which direction the swipe was in.
	 * @method _findSwipeDirection
	 * @param diffX
	 * @param diffY
	 * @param threshold
	 * @returns {string|boolean}
	 * @private
	 */
	_findSwipeDirection (diffX, diffY, threshold) {
		let absX = Math.abs(diffX);
		let absY = Math.abs(diffY);
		threshold -= this._sensitivity;
		if (absX > absY) {
			// horizontal
			if (diffX >= threshold) { return 'left'; }
			else if (absX >= threshold) { return 'right'; }
		} else {
			// vertical
			if (diffY >= threshold) { return 'up'; }
			else if (absY >= threshold) { return 'down'; }
		}
		return false;
	}

	/**
	 * Triggers a swipe event in the direction calculated.
	 * @method _triggerSwipe
	 * @param direction
	 * @private
	 */
	_triggerSwipe (direction) {
		if (this._swipeInProgress && !this._cancelSwipe) {
			this._swipeInProgress = false;
			let event = document.createEvent('Event');
			event.initEvent(direction, true, true);
			this._activeElement.dispatchEvent(event);
		}
	}

	/**
	 * Handles the touch start event.
	 * @method _handleTouchStart
	 * @param event
	 * @private
	 */
	_handleTouchStart (event) {
		this._activeElement = event.currentTarget;
		this._timeStart = Date.now();
		this._cancelSwipe = true;
		// check for the TouchList before getting X/Y data
		let touches = !!event.touches;
		this._swipeStart_clientX = touches ? event.touches[0].clientX : event.clientX;
		this._swipeStart_clientY = touches ? event.touches[0].clientY : event.clientY;
	}

	/**
	 * Handles the touch move event (a swipe).
	 * @method _handleTouchMove
	 * @param event
	 * @private
	 */
	_handleTouchMove (event) {
		if (this._detectScrollPrevention) {
			let touches = !!event.touches;
			let diffX = this.swipeStart_clientX - (touches ? event.touches[0].clientX : event.clientX);
			let diffY = this.swipeStart_clientY - (touches ? event.touches[0].clientY : event.clientY);
			let direction = this._findSwipeDirection(diffX, diffY, 0);
			this._continuePreventingScroll = this._directionHasListener(direction);
			this._detectScrollPrevention = false;
		}
		if (this.preventScroll && this._continuePreventingScroll) { event.preventDefault(); }

		this._swipeInProgress = true;
		this._cancelSwipe = false;
	}

	/**
	 * Handles the touch end event
	 * @method _handleTouchEnd
	 * @param event
	 * @private
	 */
	_handleTouchEnd (event) {
		this._timeEnd = Date.now();
		let touches = !!event.touches;
		this._swipeEnd_clientX = touches ? event.changedTouches[0].clientX : event.clientX;
		this._swipeEnd_clientY = touches ? event.changedTouches[0].clientY : event.clientY;
		this._calculateSwipe();
		this._detectScrollPrevention = true;
		this._continuePreventingScroll = false;
	}

}
