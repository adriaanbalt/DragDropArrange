
/*
 * @author Adriaan Balt Louis Scholvinck | www.BALT.us | www.linkedin.com/in/adriaans | adriaan@BALT.us
 *
 * @description DragDropArrange
 *              includes both HTML5 solution and native JavaScript solution as a fallback
 *              users Modernizr for browser API check
 *              touch controls work with native JavaScript solution
 *				responsive
 */

(function(BALT){

	// namespace closure
	if ( !BALT )
	{
		BALT = {};
	};

	imageFilenames = ["strawberry.jpg", "flower-1.jpg", "flower-2.jpg", "flower-3.jpg", "lightbulbs.jpg", "frog.jpg", "squirrel.jpg", "spider.jpg", "bush.jpg"]

	// DragDropArrange
	BALT.DragDropArrange = function()
	{
		var root = this, 		// makes functions public
			items = [],		// an array of all possible draggable elements
			container = null,	// reference to the containing element
			itemsLoaded = 0,	// number of items loaded thus far
			itemsTotal;		// number of items to load

	// PUBLIC

		root.init = function()
		{
			// store where the grid puzzle will exist
			container = document.getElementById('container');

			var image = null;
			itemsTotal = imageFilenames.length;
			// iterate across all images
			for ( var i = 0; i < itemsTotal; i++ )
			{
				image = new Image();
				// add image source
				image.src = 'images/' + imageFilenames[i];
				// load image
				image.onload = imageLoadHandler;
				// check if cached
				if (image.complete)
				{
					imageLoadHandler( image );
				}
			}

			// not particularly necessary, but potentially useful
			return root;
		};

	// PRIVATE

		// when the image is loaded, then we begin the app
		var imageLoadHandler = function ( e )
		{
			// from the event or not
			var image = e.srcElement ? e.srcElement : e;
			// convert img to canvas
			var elem = image; //BALT.Helpers.imageToCanvas( image ); // <= use canvas for bitmap but this wont work with HTML5 DragDrop
			elem.setAttribute( 'id', itemsLoaded );
			// use the draggable class to confirm which objects are draggable and which aren't (like <body>)
			elem.setAttribute( 'class', 'item draggable');
			// save in array
			items.push( elem );
			// tabulate total number of images loaded
			itemsLoaded++;
			// check if complete
			if ( itemsLoaded == itemsTotal )
			{
				loadComplete();
			}
		};

		var loadComplete = function()
		{
			// maps the array based on the order of the filenames array
			items = BALT.Helpers.mapArray( items, imageFilenames, [] );

			// add elements to the DOM in the correct order
			for ( var i = 0; i < items.length; i++ ) {
				container.appendChild( items[i] );
			}

			// reference object to pass as option parameters to sub-classes
			var obj = {
				container : container,
				items : items
			};

			// reveal the page now that the image has loaded
			document.body.style.display = 'block';

			// determine drag solution
			if (Modernizr.draganddrop && !( 'ontouchstart' in window ) )
			{
				// Browser supports HTML5 DnD.
				app = new BALT.DragDropArrangeHtml5( obj );
			}
			else
			{
				// Fallback to a native JavaScript solution
				app = new BALT.DragDropArrangeFallback( obj );
			}

			app.init();

		};
	};

	// ReOrderPhotos
	BALT.DragDropArrangeHtml5 = function(o)
	{
		var settings = {				// default settings
			},
			root = this, 			// makes functions public
			dragElement = null;		// element to be dragged

		BALT.Helpers.extend( settings, o );	// wrap default settings with those passed from main class

	// PUBLIC

		root.init = function()
		{
			// browser drag support
			var i = settings.items.length;
			while ( i-- )
			{
				// make each element draggable
				settings.items[i].setAttribute( 'draggable', 'true' );
				settings.items[i].addEventListener('dragstart', onDragStart, false);
				settings.items[i].addEventListener('dragenter', onDragEnter, false)
				settings.items[i].addEventListener('dragover', onDragOver, false);
				settings.items[i].addEventListener('dragleave', onDragLeave, false);
				settings.items[i].addEventListener('drop', onDragDrop, false);
				settings.items[i].addEventListener('dragend', onDragEnd, false);
			}

			// not particularly necessary, but potentially useful
			return root;
		};

		var onDragStart = function(e)
		{
			dragElement = this;
		};

		var onDragOver = function(e)
		{
			if (e.preventDefault) {
				e.preventDefault(); // Necessary. Allows us to drop.
			}
			return false;
		};

		// over item elements receive the over style
		var onDragEnter = function(e)
		{
			//this.classList.add('over'); // not supported http://caniuse.com/classlist
			this.setAttribute('class', 'item draggable over');
		};

		// no longer over an item element(s) then remove the over style
		var onDragLeave = function(e)
		{
			//this.classList.remove('over'); // not supported http://caniuse.com/classlist
			this.setAttribute('class', 'item draggable');
		};

		var onDragDrop = function(e)
		{
			// restrict the original events
			e.preventDefault();

			// makes sure normal image dragging will not work
			if (e.stopPropagation)
			{
				e.stopPropagation();
			}
			if (dragElement != this)
			{

// TODO
// use CSS3 transitions for style
// on transition complete then insert into DOM

				// insert element to DOM
				if ( BALT.Helpers.getElemIndex(dragElement) > BALT.Helpers.getElemIndex(this) )
				{
					settings.container.insertBefore( dragElement, this );
				}
				else
				{
					settings.container.insertBefore( dragElement, this.nextSibling );
				}
			}
			return false;
		};

		// dragging complete
		var onDragEnd = function(e)
		{

			var i = settings.items.length;
			// iterate across all item elements
			while ( i-- )
			{
				// remove style on all items
				//settings.items[i].classList.remove('over'); // not supported http://caniuse.com/classlist
				settings.items[i].setAttribute('class', 'item draggable');
			}
		};
	};


	// Fallback solution using native javascript
	BALT.DragDropArrangeFallback = function(o)
	{
		var settings = {				// default settings
			},
			root = this, 			// makes functions public
			container,			// DOM reference to container
			raf,				// requestAnimationFrame
			dragElement = null,		// the cloned original element that is actually dragged
			overElement = null,		// the element currently hovered over
			originalElement = null,	// the element to be dragged
			offsetPt = {},			// x,y coordinate from the top left of the dragElement
			mousePt = {},			// x,y coordinate of the mouse on the screen
			draggingPt = {};		// x,y coordinate to place dragElement during mousedown/touchmove

		BALT.Helpers.extend( settings, o );	// wrap default settings with those passed from main class
		container = settings.container;	// removes a lot of excess characters "settings" from all the points I reference the container

	// PUBLIC

		root.init = function()
		{
			// initialize RAF polyfill for smooth animation - from Paul Irish
			var lastTime = 0;
			var vendors = ['ms', 'moz', 'webkit', 'o'];
			for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
				window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
				window.cancelAnimationFrame =
				window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
			}
			if (!window.requestAnimationFrame)
				window.requestAnimationFrame = function(callback, element) {
					var currTime = new Date().getTime();
					var timeToCall = Math.max(0, 16 - (currTime - lastTime));
					var id = window.setTimeout(function() { callback(currTime + timeToCall); },
					  timeToCall);
					lastTime = currTime + timeToCall;
					return id;
				};
			if (!window.cancelAnimationFrame)
				window.cancelAnimationFrame = function(id) {
					clearTimeout(id);
				};

			// containiner in the DOM that holds all items

			if ( 'ontouchstart' in window )
			{
				// touch drag support
				document.addEventListener("touchstart", onTouchStart, false);
				document.addEventListener("touchmove", onTouchMove, false);
				document.addEventListener("touchend", onTouchEnd, false);
			}
			else
			{
				// browser drag support
				document.onmousedown = onMouseDown;
				document.onmouseup = onMouseUp;
			}

			// not particularly necessary, but potentially useful
			return root;
		};

	// PRIVATE

		// an item to see if the mouse is overlapping an item
		var constraints = function( dragItem, item, ind )
		{
			// the x,y positon of the item
			var itemPt  ={ 'x': ( item.offsetLeft + container.offsetLeft ), 'y': ( item.offsetTop + container.offsetTop ) };
			// if the mouse if over the item on the X axis
			var xConstraint = itemPt.x <= mousePt.x && mousePt.x <= itemPt.x+ item.clientWidth;
			// if the mouse if over the item on the Y axis
			var yConstraint = itemPt.y <= mousePt.y && mousePt.y <= itemPt.y+ item.clientHeight;
			// return whether or not it is over and make sure it isnt the same item that is being dragged
			// otherwise big Error: DOM Exception #8
			return xConstraint && yConstraint && ( item != dragItem );
		};

		// inserts an element into a specific location relative to another element
		var insertElementDOM = function( elemToInsert, elemToMove )
		{
			if ( BALT.Helpers.getElemIndex(elemToInsert) > BALT.Helpers.getElemIndex(elemToMove) )
			{
				// if insertElement is after the moveElement in the DOM list, then insert it before the moveElement
				container.insertBefore( elemToInsert, elemToMove );
			}
			else
			{
				// if the insertElement is before the moveElement, then insert it after the moveElement
				container.insertBefore( elemToInsert, elemToMove.nextSibling );
			}
			// reset the insert element to the top left relative position
			elemToInsert.style.top ='0px';
			elemToInsert.style.left ='0px';
		};

		// positions dragElement and checks if it is over another element
		// improves performance while looping through all elements
		var animationLoop = function()
		{
			// trigger the RAF
			raf = requestAnimationFrame( animationLoop );

			// if we are dragging an element
			if ( dragElement != null )
			{
				var i = settings.items.length;
				// loop across all elements that can be dragged
				while ( i-- )
				{
					// check if the dragElement is over any of the other elements
					if ( constraints( dragElement, settings.items[i] ) )
					{
						// it is, so set the over Element
						overElement = settings.items[i];
						// add the style to the over element
						//overElement.classList.add('over'); // not supported http://caniuse.com/classlist
						overElement.setAttribute('class', 'item draggable over');
					}
					else if ( overElement != settings.items[i] )
					{
						// if the overElement is none of the other items, then remove the other items over style
						//settings.items[i].classList.remove('over'); // not supported http://caniuse.com/classlist
						settings.items[i].setAttribute('class', 'item draggable');
					}
					else
					{
						// if we are not over an item and the overElement is none of the items, then clear the overElement since there isn't one
						overElement = null;
					}
				}

				// update x,y position of dragging element
				dragElement.style.left = draggingPt.x + 'px';
				dragElement.style.top = draggingPt.y + 'px';
			}
		};

		// when the mouse button is clicked anywhere in the document
		var onMouseDown = function(e)
		{
			// reference to element clicked
			var target = e.target;

			// check if item can be dragged
			if ( target.className.indexOf('draggable') != '-1' )
			{
				// use original if you dont want the floater
				originalElement = target;

				// create the clone
				dragElement = target.cloneNode(true);
				//dragElement.classList.add('clone'); // not supported http://caniuse.com/classlist
				dragElement.setAttribute('class','item draggable clone');
				container.appendChild( dragElement );

				// x,y position relative to the top left corner of the element clicked
				// used by mousemove()
				offsetPt.x = e.offsetX;
				offsetPt.y = e.offsetY;

				// start position of the clone
				// no idea why the '-6' if any ideas how to make it dynamic, I'm all ears
				draggingPt.x = originalElement.offsetLeft - 6;
				draggingPt.y = originalElement.offsetTop - 6;

				// curiously, this algorithm also works:
				// draggingPt.x = e.x - container.offsetLeft - offsetPt.x - 6;
				// draggingPt.y = e.y - container.offsetTop - offsetPt.y - 6;

				// update style position for drag effect
				dragElement.style.left = draggingPt.x + 'px';
				dragElement.style.top = draggingPt.y + 'px';

				// begin the intensive looping
				animationLoop();

				// trigger the mouse move
				document.onmousemove = onMouseMove;

				// stop text selection
				document.body.focus();

				// stop text selection in IE
				document.onselectstart = function () { return false; };

				// stop IE from trying to drag the image
				target.ondragstart = function() { return false; };

				// prevent text selection (except IE)
				return false;
			}
		};

		// when the mouse is moved while held down
		var onMouseMove = function(e)
		{
			if (dragElement != null)
			{
				e.preventDefault();

				// makes sure we have an event
				if (e == null)
				{
					var e = window.event;
				}

				// x,y position of mouse on screen
				mousePt.x = e.clientX;
				mousePt.y = e.clientY;

				// dragging x,y position used by the animationLoop()
				// no idea why the '-6' if any ideas how to make it dynamic, I'm all ears
				draggingPt.x = mousePt.x - container.offsetLeft - offsetPt.x - 6;
				draggingPt.y = mousePt.y - container.offsetTop - offsetPt.y - 6;
			}
		};

		// when the mouse button is released
		var onMouseUp = function(e)
		{
			// make sure there is an element that is currently dragging
			if (dragElement != null)
			{
				e.preventDefault();

				// remove the clone as soon as the mouse button is released
				container.removeChild( dragElement );

				// stop the RAF when you don't need it
				cancelAnimationFrame( raf );

				// clear mouse events
				document.onmousemove = null;
				document.onselectstart = null;
				//dragElement.ondragstart = null;

				// make sure there is an original element that was clicked
				if ( overElement !=null )
				{
					// use the original element because
					// 	1) the dragElement is now gone
					// 	2) we must make sure we don't insert the originalElement next to the originalElement (constraint() handles that check for us)
					// check if the mouse is still over an element
					if ( constraints( originalElement, overElement ) )
					{
						// remove the over style on overElement
						//overElement.classList.remove('over'); // not supported http://caniuse.com/classlist
						overElement.setAttribute('class', 'item draggable');
						// move the originalElement next to the overElement
						insertElementDOM( originalElement, overElement );
					}
					else
					{
						// we are not over an element so remove the style
						//overElement.classList.remove('over'); // not supported http://caniuse.com/classlist
						overElement.setAttribute('class', 'item draggable');
						// position the originalElement to the top left of it;s relative position
						originalElement.style.top = '0px';
						originalElement.style.left = '0px';
					}
				}
				else
				{
					// there is no over element, so
					// position the originalElement to the top left of it;s relative position
					originalElement.style.top = '0px';
					originalElement.style.left = '0px';
				}

				// reset
				dragElement = null;
				overElement = null;
				originalElement = null;
				mousePt = {};
			}
		};

		// touch - when the finger first taps on the surface
		var onTouchStart = function(e)
		{
			e.preventDefault();

			// reference to element clicked
			var target = event.targetTouches[0].target;

			// check if item can be dragged
			if ( target.className.indexOf('draggable') != '-1' )
			{
				// use original if you dont want the floater
				originalElement = target;

				// create the clone
				dragElement = target.cloneNode(true);

				//dragElement.classList.add('clone'); // not supported http://caniuse.com/classlist
				dragElement.setAttribute('class','item draggable clone');
				container.appendChild( dragElement );

				// x,y position relative to the top left corner of the element clicked
				// used by mousemove()
				offsetPt.x = e.targetTouches[0].clientX;
				offsetPt.y = e.targetTouches[0].clientY;

				// start position of dragElement on screen
				// no idea why the '-5' if any ideas how to make it dynamic, I'm all ears
				draggingPt.x = originalElement.offsetLeft - 5;
				draggingPt.y = originalElement.offsetTop - 5;

				// update style position for drag effect
				dragElement.style.left = draggingPt.x + 'px';
				dragElement.style.top = draggingPt.y + 'px';

				// begin the intensive looping
				animationLoop();
			}
		};

		// touch - when the finger is dragging across the surface
		var onTouchMove = function(e)
		{
			// prevent page from slide when dragging
			e.preventDefault();

			if (dragElement != null)
			{
				// makes sure we have an event
				if (e == null)
				{
					var e = window.event;
				}

				// x,y position of mouse on screen
				mousePt.x = e.touches[0].clientX;
				mousePt.y = e.touches[0].clientY;

				// dragging x,y position used by the animationLoop()
				// no idea why the '-5' if any ideas how to make it dynamic, I'm all ears
				draggingPt.x = mousePt.x -  offsetPt.x + originalElement.offsetLeft - 5;
				draggingPt.y = mousePt.y  - offsetPt.y + originalElement.offsetTop - 5;
			}
		};

		// touch - when the finger is removed from the surface
		var onTouchEnd = function(e)
		{
			// make sure there is an element that is currently dragging
			if (dragElement != null)
			{
				// remove the clone as soon as the mouse button is released
				container.removeChild( dragElement );

				// stop the RAF when you don't need it
				cancelAnimationFrame( raf );

				// clear mouse events
				document.onmousemove = null;
				document.onselectstart = null;
				//dragElement.ondragstart = null;

				// make sure there is an original element that was clicked
				if ( overElement !=null )
				{
					// use the original element because
					// 	1) the dragElement is now gone
					// 	2) we must make sure we don't insert the originalElement next to the originalElement (constraint() handles that check for us)
					// check if the mouse is still over an element
					if ( constraints( originalElement, overElement ) )
					{
						// remove the over style on overElement
						//overElement.classList.remove('over'); // not supported http://caniuse.com/classlist
						overElement.setAttribute('class', 'item draggable');
						// move the originalElement next to the overElement
						insertElementDOM( originalElement, overElement );
					}
					else
					{
						// we are not over an element so remove the style
						//overElement.classList.remove('over'); // not supported http://caniuse.com/classlist
						overElement.setAttribute('class', 'item draggable');
						// position the originalElement to the top left of it;s relative position
						originalElement.style.top = '0px';
						originalElement.style.left = '0px';
					}
				}
				else
				{
					// there is no over element, so
					// position the originalElement to the top left of it;s relative position
					originalElement.style.top = '0px';
					originalElement.style.left = '0px';
				}

				// reset
				dragElement = null;
				overElement = null;
				originalElement = null;
				mousePt = {};
			}
		};

	};

	// Helper functions
	BALT.Helpers = function()
	{
		var root = this; // makes functions public

		// randomizes any array
		root.randomizeArray = function( array )
		{
			array.sort( function() { return Math.round(Math.random())-0.5 });
			return array;
		};

		// cast to a number
		root.castNumber = function(value)
		{
			var n = parseInt(value);
			return n == null || isNaN(n) ? 0 : n;
		};

		// swaps items in a given array
		root.swapArrayIndex = function ( array, index1, index2)
		{
			var t = array[index1];
			array[index1] = array[index2];
			array[index2] = t;
			return array;
		};

		// adds properties from one object to the other and returns the combined object
		root.extend = function( obj, newObj )
		{
			for (var prop in newObj)
			{
				if (newObj.hasOwnProperty(prop))
				{
					obj[prop] = newObj[prop];
				}
			}
			return obj;
		};

		// retreives the index of an element in the DOM
		root.getElemIndex = function( elem )
		{
			var i = -1;
			while (elem)
			{
				if ( "previousSibling" in elem )
				{
					elem = elem.previousSibling;
					i = i + 1;
				}
				else
				{
					i = -1;
					break;
				}
			}
			return i;
		};

		// helper to dynamically create and return a canvas element
		root.imageToCanvas = function( image )
		{
			var c = document.createElement('canvas');
			c.width = image.width;
			c.height = image.height;
			var ctx = c.getContext("2d");
			ctx.drawImage( image, 0, 0, image.width, image.height );
			return c;
		};

		// maps an array to given indices
		// recursive
		// @param array = array to organize
		// @param map = the order that the array should be in
		// @param output = new ordered array, copy of the original array
		root.mapArray = function ( array, map, output )
		{
			// loop through the array until the element has been found
			for ( var i = 0; i < array.length; i++ )
			{
				// if the filename is in the path, we found the element
				if ( array[i].src.indexOf( map[0] ) != -1 )
				{
					// save in the output array
					output.push( array[i] );
					break;
				}
			}
			// removes the first element now that it has been found
			map.shift();
			// recrusive
			if( map.length ) return root.mapArray( array, map, output );
			// if there isn't anymore items to map, return the final ordered array
			return output;
		};

	};

	BALT.Helpers = new BALT.Helpers();

	// create the DragDropArrange main class
	(new BALT.DragDropArrange()).init();

})();
