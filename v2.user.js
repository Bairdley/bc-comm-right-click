// ==UserScript==
// @name        BC - Recent Activity Links - Open in new tab
// @author      Brad Mitchell
// @homepage    https://github.com/bairdley
// @version     0.1
// @namespace   https://forum.bigcommerce.com
// @description Allows users to open Recent Activity links in a new tab
// @match       https://forum.bigcommerce.com/*
// @grant       none
// @installURL  https://github.com/Bairdley/bc-community-right-click/raw/master/bc-community-new-tab.user.js
// @updateURL   https://github.com/Bairdley/bc-community-right-click/raw/master/bc-community-new-tab.user.js
// @downloadURL https://github.com/Bairdley/bc-community-right-click/raw/master/bc-community-new-tab.user.js
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// ==/UserScript==


(function () {
    var staticLinks = [],
        url = 'https://spreadsheets.google.com/feeds/list/1Fk_RrRaB_-dn_L4pxhHY1usSXlUsq0xelDUpyMSh8IQ/1/public/basic?alt=json';

    $.ajax({
        url: url,
        success: function(data) {
            for (var i = 0; i < data.feed.entry.length; i += 1) {
                staticLinks.push([data.feed.entry[i].title.$t, (data.feed.entry[i].content.$t)]);
            }
            staticLinks.forEach(function(v) {
                v[1] = v[1].substring(v[1].indexOf(':') + 2);
            });
        }
    });

    var keys = {
        pressed: false,
        codes: {
            ctrl: 17,
            cmdL: 91,
            cmdR: 93,
            cmdFF: 224
        },
        down: function(e) {
            for (i in keys.codes) {
                if (e === keys.codes[i]) {
                    keys.pressed = true;
                }
            }
        },
        up: function() {
            keys.pressed = false;
        }
    };

    $(document).keydown(function (e) {
        keys.down(e.which);
    }).keyup(function (e) {
        keys.up();
    });

    var mouse = {
        button: function(e) {
            return e.which === 1 ? 'left' : 'right';
        }
    };

    var link = {
        current: {
            el: '',
            type: '',
            url: '',
            dataAura: ''
        },
        static: {
            define: function(el) {
                var linkText = $(el).text();
                for (var i = 0; i < staticLinks.length; i ++) {
                    if (staticLinks[i][0] === linkText) {
                        link.current = {
                            el: $(el).find('a'),
                            type: 'static',
                            url: staticLinks[i][1],
                            dataAura: $(el).find('a').attr('data-aura-rendered-by')
                        };
                    }
                }
            }
        },
        dynamic: {
            define: function(el) {
                var urlBegin,
                    dataSource;
                if ($(el).find('a').andSelf().hasClass('compactFeedElement')) {
                    urlBegin = '/s/question/';
                    dataSource = 'data-id';
                } else if ($(el).find('a').andSelf().hasClass('userLink')) {
                    urlBegin = '/s/profile/';
                    dataSource = 'data-id';
                } else if ($(el).find('a').andSelf().hasClass('forceChatterCompoundFieldsGroupName')) {
                    urlBegin = '/s/group/';
                    dataSource = 'data-recordid';
                }
                $(el).parent().children().andSelf().attr('data-aura-rendered-by', '');
                link.current = {
                    el: $(el).find('a'),
                    type: 'dynamic',
                    url: urlBegin + $(el).attr(dataSource),
                    dataAura: $(el).find('a').attr('data-aura-rendered-by')
                };
            }
        },
        action: {
            setHref: function() {
                $(link.current.el).attr('href', link.current.url);
            },
            voidHref: function() {
                window.open(link.current.url);
            },
            removeDataAura: function() {
                $(link.current.el).attr('data-aura-rendered-by', '');
                $(link.current.el).attr(' placeholder', link.current.dataAura);
            },
            restoreDataAura: function() {
                $(link.current.el).attr('data-aura-rendered-by', link.current.dataAura);
            },
            newTab: function() {
                window.open(link.current.url);
            }
        }
    };

    function addListeners(el) {
        $(el).on({
            mousedown: function(e) {
                if (mouse.button(e) === 'left' && !(keys.pressed)) {
                    link.action.restoreDataAura();
                } else if (mouse.button(e) === 'right') {
                    link.action.setHref();
                }
            },
            mouseup: function(e) {
                if (mouse.button(e) === 'left' && keys.pressed) {
                    e.stopImmediatePropagation();
                    link.action.newTab();
                }else if ($(link.current.el).attr('data-aura-rendered-by') !== '') {
                    var delay = link.current.url === 10;
                    setTimeout(function() {
                        link.action.removeDataAura();
                    }, delay);
                }
            },
            mouseleave: function() {
                $(link.current.el).attr('data-aura-rendered-by', link.current.dataAura);
                $(link.current.el).attr('href', 'javascript:void(0)');
            }
        });
    }

    $(document).mouseover(function() {
        $('li').on({
            mouseenter: function(e) {
                e.stopImmediatePropagation();
                link.static.define($(this));
                link.action.removeDataAura();
                addListeners($(this));
            }
        });
        $('.compactFeedElement, .cuf-entityLinkId, .forceChatterCompoundFieldsGroupName').on({
            mouseenter: function(e) {
                e.stopImmediatePropagation();
                link.dynamic.define($(this));
                link.action.removeDataAura();
                addListeners($(this));
            }
        });
    });
})();

