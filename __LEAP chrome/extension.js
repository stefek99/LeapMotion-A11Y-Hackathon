$(function() {
  oPointer = {
    $p : $("#pointer"),
    top : 0,
    left : 0
  }
  aRecentMovements = new RecentMovements();
  bSnapped = false;

  var controller = new Leap.Controller({enableGestures: true});
  controller.loop(function(frame) {
    if (frame.hands.length > 0) {
      MovePointer(aRecentMovements, frame.hands[0].direction.x, frame.hands[0].direction.y);
    }
  });

  $pointer = $("<div id='pointer'>");

  $("body").prepend($pointer);
});

RecentMovements = function() {
  var pMe = this;
  var maxLen = 30;
  this.storage = new Array(maxLen);
  this.index = 0;

  // StorePoint checks recent addition and returns whether we have name
  this.StorePoint = function(nPoint) {
    pMe.storage[pMe.index++ % maxLen] = nPoint

    pMe._PrintRecent();

    var buffer = ""

    var prevValue = pMe.storage[(pMe.index - 30) % maxLen];
    for (var i = pMe.index - 29; i < pMe.index - 15; i++) {
      var current = pMe.storage[i%maxLen];
      if (current < prevValue) {
        buffer += "Y";
      } else {
        buffer += "N"
      }
      prevValue = current;
    }

    for (var i = pMe.index - 14; i < pMe.index; i++) {
      var current = pMe.storage[i%maxLen];
      if (current > prevValue) {
        buffer += "Y";
      } else {
        buffer += "N"
      }
      prevValue = current;
    }

    //console.log(buffer);


    var InitialLen = buffer.length;
    var newBuffer = buffer.replace(/N/g,"");
    if (InitialLen - newBuffer.length < 3) { // approximation
      console.log("CLICK!!!");
      return {gesture: "click"};
    }

    return {gesture: false};
  }



      this._PrintRecent = function() {
        var buffer2 = "";
        var prev = pMe.index - maxLen;
        for (var i = pMe.index - maxLen; i < pMe.index; i++) {
          var current = pMe.storage[i%maxLen];
          buffer2 += current > prev ? "+" : "-";
          prev = current;
        }
        //console.log(buffer2);
      }

}

function MovePointer(aRecentMovements, x, y) {

  if (bSnapped) { // slowing down a little bit, so it actually snaps
    x /= 3;
    y /= 3;
  }

  oPointer.left += 10 * x;
  oPointer.top -= 10 * y;
  oPointer.left = oPointer.left < 0 ? 0 : oPointer.left;
  oPointer.top = oPointer.top < 0 ? 0 : oPointer.top;
  oPointer.left = oPointer.left > window.innerWidth - 50 ? window.innerWidth - 50 : oPointer.left;
  oPointer.top = oPointer.top > window.innerHeight - 50 ? window.innerHeight - 50 : oPointer.top;

  if (bSnapped == false) {
    $pointer.css({"left": oPointer.left, "top" : oPointer.top});
  } else {

    // we are snapped, if move by treshold greater than 50 pixels then release
    if (Math.abs(oPointer.left - oSnappedPos.x) > 100 || Math.abs(oPointer.top - oSnappedPos.y) > 100 ) {
      bSnapped = false;
      bAfterEscape = true;
      $pointer.removeClass("hover");

      $pointer.css({"left": oSnappedPos.x, "top" : oSnappedPos.y});
    }

    //CLICK Business
    var gesture = aRecentMovements.StorePoint(oPointer.top);


    if (gesture.gesture == "click") {


      chrome.tabs.executeScript(null,{code:"alert('hello!');"}) 

      console.log("performing click on snapped element")

      $snapped.click();
    }

  }
  
  // Checking if element we are currently on
  $el = $(document.elementFromPoint(oPointer.left - 1, oPointer.top - 1));

  // when snapping for the first time we do some business here
  selectorFocusable = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]';
  if ($el.is(selectorFocusable)) {
    if (bSnapped == false && bAfterEscape == false) {
      $snapped = $el; // storing for future to trigger click
      var elWidth = $el.width();
      var elHeight = $el.height();
      var elOffset = $el.offset();
      oPointer.top = elOffset.top + elHeight/2;
      oPointer.left = elOffset.left + elWidth/2;
      $pointer.css({"left": oPointer.left, "top" : oPointer.top });
      oSnappedPos = {"x": oPointer.left - 1, "y": oPointer.top - 1}
      $pointer.addClass("hover");
      bSnapped = true;
    }
  } else {
    bAfterEscape = false;
  }
}