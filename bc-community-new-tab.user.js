// ==UserScript==
// @name        BC - Recent Activity Links - Open in new tab
// @author      Brad Mitchell
// @homepage    https://github.com/bairdley
// @version     0.1
// @namespace   https://forum.bigcommerce.com
// @description Allows users to open Recent Activity links in a new tab
// @match       https://forum.bigcommerce.com/*
// @grant       none
// @installURL  https://github.com/Bairdley/bc-comm-right-click/blob/master/bc-comm-new-tab.user.js
// @updateURL   https://github.com/Bairdley/bc-comm-right-click/blob/master/bc-comm-new-tab.user.js
// @downloadURL https://github.com/Bairdley/bc-comm-right-click/blob/master/bc-comm-new-tab.user.js
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// ==/UserScript==
(function () {
  var OS,
  urlExt = '/s/question/',
  dataID,
  newTabCount = 0,
  keyCodes,
  keyed = false,
  currentKey;
  (function () {
    if (navigator.appVersion.indexOf('Win') != - 1) {
      OS = 'win';
      keyCodes = {
        ctrl: 17
      };
    } else {
      OS = 'mac';
      keyCodes = {
        ctrl: 17,
        cmdL: 91,
        cmdR: 93,
        cmdFF: 224
      };
    }
  }());
  $(document).keydown(function (e) {
    for (var i in keyCodes) {
      if (e.which === keyCodes[i]) {
        currentKey = keyCodes[i];
        keyed = true;
      }
    }
  });
  $(document).keyup(function (e) {
    if (e.which === currentKey) {
      keyed = false;
    }
  });
  $('.compactFeedElement').live('mouseover', function () {
    $(this).mousedown(function (e) {
      var el = $(this).find('a').andSelf();
      if ($(this).attr('data-id')) {
        dataID = $(this).attr('data-id');
        if (e.which !== 1 && keyed === false) {
          clicks.right(el);
        } else if (OS === 'win') {
          if (keyed === true && currentKey === keyCodes.ctrl) {
            clicks.win.ctrlClick(el);
          }
        } else if (OS === 'mac') {
          var cmd;
          switch (true) {
            case currentKey === keyCodes.cmdFF:
              clicks.mac.cmdClick(el);
              break;
            case currentKey === keyCodes.cmdL:
              clicks.mac.cmdClick(el);
              break;
            case currentKey === keyCodes.cmdR:
              clicks.mac.cmdClick(el);
              break;
            case currentKey === keyCodes.ctrl:
              setHref.url(el);
              break;
          }
        }
      }
    }).mouseleave(function () {
      setHref.void ($(this).find('a').andSelf());
    });
  });
  function newTab() {
    window.open(urlExt + dataID);
    var int = setInterval(function () {
      if (newTabCount > 0) {
        newTabCount = 0;
        window.clearInterval(int);
      }
    }, 500);
  }
  var setHref = {
    url: function (el) {
      $(el).attr('href', urlExt + dataID);
    },
    void : function (el) {
      $(el).attr('href', 'javascript:void(0)');
      keyed = false;
    }
  };
  var clicks = {
    mac: {
      cmdClick: function (el) {
        while (newTabCount < 1) {
          newTab();
          newTabCount += 1;
        }
      }
    },
    win: {
      ctrlClick: function (el) {
        while (newTabCount < 1) {
          newTab();
          newTabCount += 1;
        }
      }
    },
    right: function (el) {
      setHref.url(el);
    }
  };
}) ();
