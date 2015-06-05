(function () {

	var specialBox = document.querySelector("#special");
	var regularBox = document.querySelector('#regular');

	var startTime = 0;

	var click = new Touch(specialBox);

	function handleTouchStart (evt) {
		startTime = new Date().getTime();
	}

	function handleClick (evt) {
		var target = evt.currentTarget;
		var info = target.childNodes[1];
		var newTime = new Date().getTime();
		info.innerHTML = (newTime - startTime) + 'ms';
	}

	specialBox.addEventListener('touchstart', handleTouchStart);
	regularBox.addEventListener('touchstart', handleTouchStart);

	specialBox.addEventListener('click', handleClick);
	regularBox.addEventListener('click', handleClick);

})();