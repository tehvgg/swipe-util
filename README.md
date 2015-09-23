# swipe-util
Swipe event utility for mobile devices.

## Try it out
http://tehvgg.github.io/swipe-util/

## How to use it?
1. Include the script in your head.
  ```<script src="js/swipe.js"></script>```
2. Instantiate the class.
  ```var el = document.body;
    var swipe = new Swipe(el, { doPreventScroll: true });```
3. Apply your event listeners.
  ```el.addEventListener(swipe.up, handleSwipe);
		el.addEventListener(swipe.down, handleSwipe);
		el.addEventListener(swipe.left, handleSwipe);
		el.addEventListener(swipe.right, handleSwipe);```
