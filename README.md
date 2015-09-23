# swipe-util
Swipe event utility for mobile devices.

## Try it out
http://tehvgg.github.io/swipe-util/

## How to use it?
### Include the script in your head.
```javascript
<script src="js/swipe.js"></script>
```
### Instantiate the class.
```javascript
var el = document.body;
var swipe = new Swipe(el, { doPreventScroll: true });
```
### Apply your event listeners.
```javascript
el.addEventListener(swipe.up, handleSwipe);
el.addEventListener(swipe.down, handleSwipe);
el.addEventListener(swipe.left, handleSwipe);
el.addEventListener(swipe.right, handleSwipe);
```
