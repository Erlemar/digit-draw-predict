//for canvas drawing used code from here: https://github.com/zealerww/digits_recognition/blob/master/digits_recognition/static/draw.js
var drawing = false;

var context;
var clicks = 0;
var offset_left = 0;
var offset_top = 0;

function startup() {
  var el = document.body;
  el.addEventListener("touchstart", handleStart, false);
  el.addEventListener("touchend", handleEnd, false);
  el.addEventListener("touchcancel", handleCancel, false);
  el.addEventListener("touchleave", handleEnd, false);
  el.addEventListener("touchmove", handleMove, false);
}


//canvas functions
function start_canvas () {
    var canvas = document.getElementById("the_stage");
    context = canvas.getContext("2d");
    canvas.onmousedown = function (event) {mousedown(event)};
    canvas.onmousemove = function (event) {mousemove(event)};
    canvas.onmouseup = function (event) {mouseup(event)};
    canvas.onmouseout = function (event) {mouseup(event)};
    canvas.ontouchstart = function (event) {touchstart(event)};
    canvas.ontouchmove = function (event) {touchmove(event)};
    canvas.ontouchend = function (event) {touchend(event)};
    for (var o = canvas; o ; o = o.offsetParent) {
		offset_left += (o.offsetLeft - o.scrollLeft);
		offset_top  += (o.offsetTop - o.scrollTop);
    }
	
	var el =document.body;
	el.addEventListener("touchstart", handleStart, false);
	el.addEventListener("touchend", handleEnd, false);
	el.addEventListener("touchcancel", handleCancel, false);
	el.addEventListener("touchleave", handleEnd, false);
	el.addEventListener("touchmove", handleMove, false);
    draw();
}

function getPosition(evt) {
    evt = (evt) ?  evt : ((event) ? event : null);
    var left = 0;
    var top = 0;
    var canvas = document.getElementById("the_stage");

    if (evt.pageX) {
		left = evt.pageX;
		top  = evt.pageY;
    } else if (document.documentElement.scrollLeft) {
		left = evt.clientX + document.documentElement.scrollLeft;
		top  = evt.clientY + document.documentElement.scrollTop;
    } else  {
		left = evt.clientX + document.body.scrollLeft;
		top  = evt.clientY + document.body.scrollTop;
    }
    left -= offset_left;
    top -= offset_top;

    return {x : left, y : top}; 
}


function mousedown(event) {
    drawing = true;
    var location = getPosition(event);
    context.lineWidth = 4.0;
    context.strokeStyle = "#000000";
    context.beginPath();
    context.moveTo(location.x, location.y);
}


function mousemove(event) {
    if (!drawing) 
        return;
    var location = getPosition(event);
    context.lineTo(location.x, location.y);
    context.stroke();
}


function mouseup(event) {
    if (!drawing) 
        return;
    mousemove(event);
	context.closePath();
    drawing = false;
}


function draw() {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 200, 200);
}

//Used mozilla docs for this code https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
var ongoingTouches = new Array;
function handleStart(evt) { 

	var canvas = document.getElementById("the_stage");
	var context = canvas.getContext("2d");
	var touches = evt.changedTouches;
	var offset = findPos(canvas);  
    
   
	for (var i = 0; i < touches.length; i++) {
		if(touches[i].clientX-offset.x >0 && touches[i].clientX - offset.x < parseFloat(canvas.width) && touches[i].clientY - offset.y > 0 && touches[i].clientY - offset.y < parseFloat(canvas.height)){
			evt.preventDefault();
			ongoingTouches.push(copyTouch(touches[i]));
			context.beginPath();
			//context.arc(touches[i].clientX - offset.x, touches[i].clientY - offset.y, 4, 0, 2 * Math.PI, false); // a circle at the start
			context.fillStyle = "#000000";
			context.fill();
		}
	}
}
function handleMove(evt) {

	var canvas = document.getElementById("the_stage");
	var context = canvas.getContext("2d");
	var touches = evt.changedTouches;
	var offset = findPos(canvas);

	for (var i = 0; i < touches.length; i++) {
        if(touches[i].clientX-offset.x > 0 && touches[i].clientX-offset.x < parseFloat(canvas.width) && touches[i].clientY-offset.y > 0 && touches[i].clientY - offset.y < parseFloat(canvas.height)){
              evt.preventDefault();
			var idx = ongoingTouchIndexById(touches[i].identifier);
		
			if (idx >= 0) {
				context.beginPath();
				context.moveTo(ongoingTouches[idx].clientX - offset.x, ongoingTouches[idx].clientY - offset.y);

				context.lineTo(touches[i].clientX - offset.x, touches[i].clientY - offset.y);
				context.lineWidth = 4;
				context.strokeStyle = "#000000";
				context.stroke();

				ongoingTouches.splice(idx, 1, copyTouch(touches[i])); // swap in the new touch record
			} else {
			}
		}
    }
}
function handleEnd(evt) {

	var canvas = document.getElementById("the_stage");
	var context = canvas.getContext("2d");
	var touches = evt.changedTouches;
	var offset = findPos(canvas);
        
	for (var i = 0; i < touches.length; i++) {
		if(touches[i].clientX-offset.x > 0 && touches[i].clientX-offset.x < parseFloat(canvas.width) && touches[i].clientY-offset.y > 0 && touches[i].clientY-offset.y < parseFloat(canvas.height)){
			evt.preventDefault();
			var idx = ongoingTouchIndexById(touches[i].identifier);
				
			if (idx >= 0) {
				context.lineWidth = 4;
				context.fillStyle = "#000000";
				context.beginPath();
				context.moveTo(ongoingTouches[idx].clientX - offset.x, ongoingTouches[idx].clientY - offset.y);
				context.lineTo(touches[i].clientX - offset.x, touches[i].clientY - offset.y);
				//context.fillRect(touches[i].clientX - 4 -offset.x, touches[i].clientY - 4 - offset.y, 8, 8); // and a square at the end
				ongoingTouches.splice(i, 1); // remove it; we're done
				} else {
			}
		}
    }
}
function handleCancel(evt) {
	evt.preventDefault();
	var touches = evt.changedTouches;
  
	for (var i = 0; i < touches.length; i++) {
		ongoingTouches.splice(i, 1); // remove it; we're done
	}
}

function copyTouch(touch) {
	return {identifier: touch.identifier,clientX: touch.clientX,clientY: touch.clientY};
}
function ongoingTouchIndexById(idToFind) {
	for (var i = 0; i < ongoingTouches.length; i++) {
		var id = ongoingTouches[i].identifier;
    
		if (id == idToFind) {
			return i;
		}
	}
	return -1; // not found
}

function findPos (obj) {
    var curleft = 0,
        curtop = 0;

    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);

        return { x: curleft - document.body.scrollLeft, y: curtop - document.body.scrollTop };
    }
}


function clearCanvas() {
    context.clearRect (0, 0, 200, 200);
    draw();
    document.getElementById("rec_result").innerHTML = "";
}


function predict() {
    clicks += 1;
    document.getElementById("clicks").innerHTML = clicks;
	document.getElementById("rec_result").innerHTML = "Predicting...";

	var canvas = document.getElementById("the_stage");
	var dataURL = canvas.toDataURL('image/jpg');
	
	$.ajax({
		type: "POST",
		url: "/hook2",
		data:{
			imageBase64: dataURL
		}
	}).done(function(response) {
		console.log(response)
		if (response == "Can't predict, when nothing is drawn") {

			document.getElementById("rec_result").innerHTML = response;
		} else {
			//answers = response

			var response = JSON.parse(response)
			//answer, top_3, top_3_original, top_3_cnn, top_3_cnn_original
			document.getElementById("image1").style.display = "block";
			document.getElementById("image1").src = response['image'];

			document.getElementById("rec_result").innerHTML = response["answer"];
		}
	});
}

function submit_correct_digit()
{
	var digit = document.getElementById("digits");
	var correct_digit = digit.options[digit.selectedIndex].text
	document.getElementById("digit_form").style.display = "none";
	document.getElementById("answer_reaction").innerHTML = "Thank you! The models should work better now.";
	
	var trained = train_model(correct_digit);
	console.log(trained)

}

function train_model(digit) {
	var digit = digit;
	var canvas = document.getElementById("the_stage");
	var dataURL = canvas.toDataURL('image/jpg');
	document.getElementById("rec_result").innerHTML = 'Training...'
	$.ajax({
		type: "POST",
		url: "/hook3",
		data:{
			digit: digit,
			imageBase64: dataURL
		}
	}).done(function(response) {
	  console.log(response)
	  document.getElementById("rec_result").innerHTML = response
	});
}


onload = start_canvas;

// https://stackoverflow.com/questions/16057256/draw-on-a-canvas-via-mouse-and-touch
// https://bencentra.com/code/2014/12/05/html5-canvas-touch-events.html