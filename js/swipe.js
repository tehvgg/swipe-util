(function () {

	var swipeElement = document.body;
	var info = document.querySelector('.info');
	var curDir = '';
	var count = 1;

	var swipe = new gTouch(swipeElement);
	swipe.preventScroll = true;

	function handleSwipe (evt) {
		var text = info.innerHTML;

		if (evt.type === curDir) {
			count++;
			if (count === 2) {
				text += (' x' + count);
			} else {
				text = (text.substring(0, text.length - (count - 1).toString().length) + count);
			}
		} else {
			count = 1;
			text = curDir = evt.type;
		}

		info.innerHTML = text;
	}

	swipeElement.addEventListener(swipe.up, handleSwipe);
	swipeElement.addEventListener(swipe.down, handleSwipe);
	swipeElement.addEventListener(swipe.left, handleSwipe);
	swipeElement.addEventListener(swipe.right, handleSwipe);

})();