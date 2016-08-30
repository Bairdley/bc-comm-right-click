// ==UserScript==
// @name        BC - Recent Activity Links - Open in new tab
// @author      Brad Mitchell
// @homepage    https://github.com/bairdley
// @version     0.2.0
// @namespace   https://forum.bigcommerce.com
// @description Allows users to open Recent Activity links in a new tab
// @match       https://forum.bigcommerce.com/*
// @grant       none
// @installURL  https://github.com/Bairdley/bc-community-right-click/raw/master/bc-community-new-tab.user.js
// @updateURL   https://github.com/Bairdley/bc-community-right-click/raw/master/bc-community-new-tab.user.js
// @downloadURL https://github.com/Bairdley/bc-community-right-click/raw/master/bc-community-new-tab.user.js
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// ==/UserScript==

(function() {
    var staticLinks = [],
        url = 'https://spreadsheets.google.com/feeds/list/1Fk_RrRaB_-dn_L4pxhHY1usSXlUsq0xelDUpyMSh8IQ/1/public/basic?alt=json';
    
    //Build array of static links, which are managed via spreadsheet
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
    
    //define key event
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
   
   //capture key event
    $(document).keydown(function(e) {
        keys.down(e.which);
    }).keyup(function(e) {
        keys.up();
    });
    
    //define mouse event
    var mouse = {
        button: function(e) {
            return e.which === 1 ? 'left' : 'right';
        }
    };
    
    //defines the link that user is currently interacting with
    var link = {
        current: {
            el: '',
            type: '',
            url: '',
            dataAura: ''
        },
        static: {
            define: function(el) {
                //if user is interacting with a list item, check text against the static links in the spreadsheet
                var linkText = $(el).text();
                for (var i = 0; i < staticLinks.length; i++) {
                    if (staticLinks[i][0] === linkText) {
                        //if link is found in the spreadsheet, set current link
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
                //all links begin with /s/
                var urlBegin = '/s/',
                    //datasource refers to the id that is appended to the ends of dynamic URLs
                    dataSource;
                //three types of dataSource: 
                if ($(el).find('a').andSelf().hasClass('compactFeedElement')) {
                    //feed links always include /question/<data-id> 
                    urlBegin += 'question/';
                    dataSource = 'data-id';
                } else if ($(el).find('a').andSelf().hasClass('cuf-entityLinkId')) {
                    //profile links always include /profile/<data-id> 
                    urlBegin += 'profile/';
                    dataSource = 'data-id';
                } else if ($(el).find('a').andSelf().hasClass('forceChatterCompoundFieldsGroupName')) {
                    //group links always include /group/<data-recordid>
                    urlBegin += 'group/';
                    dataSource = 'data-recordid';
                }
                $(el).parent().children().andSelf().attr('data-aura-rendered-by', '');
                link.current = {
                    el: $(el).find('a'),
                    type: 'dynamic',
                    url: urlBegin + ($(el).attr(dataSource) || $(el).find('a').attr(dataSource)),
                    dataAura: $(el).find('a').attr('data-aura-rendered-by')
                };
            }
        },
        action: {
            //on right click, link's href is set to the URL of the destination page
            //this allows the user to interact with the link traditionally
            setHref: function() {
                $(link.current.el).attr('href', link.current.url);
            },
            //returns href attribute to 'javascript:void(0)'
            voidHref: function() {
                $(link.current.el).attr('href', 'javascript:void(0)');
            },
            //on ctrl/cmd-click, the SPA sometimes still loads the link in the original tab
            //this loading is controlled by 'data-aura-rendered by' attribute
            //removes this attribute momentarily
            removeDataAura: function() {
                $(link.current.el).attr('data-aura-rendered-by', '');
            },
            //restores data-aura-rendered-by attribute (for future left-clicks)
            restoreDataAura: function() {
                $(link.current.el).attr('data-aura-rendered-by', link.current.dataAura);
            },
            newTab: function() {
                //sometimes, new tab will gain focus, meaning keys.pressed will === true until pressed again
                var windowFocus;
                $(window).focus(function() {
                    windowFocus = true;
                }).blur(function() {
                    windowFocus = false;
                });
                window.open(link.current.url);
                //if window loses focus, keys.pressed defaults back to false
                if (windowFocus === false) {
                    keys.pressed = false;
                }
            }
        }
    };

    function addListeners(el) {
        $(el).on({
            mousedown: function(e) {
                if (mouse.button(e) === 'right') {
                    //set href on mousedown so that it can be interpreted on mouseup
                    link.action.setHref();
                } else if (mouse.button(e) === 'left' && keys.pressed === true) {
                    //remove data-aura-rendered-by before mouseup to prevent SPA from loading link in original tab
                    link.action.removeDataAura();
                }
            },
            mouseup: function(e) {
                if (mouse.button(e) === 'left' && keys.pressed) {
                    //if ctrl/cmd-click, open link in new tab
                    e.stopImmediatePropagation();
                    link.action.newTab();
                    //wait 200ms after mouseup before returning data-aura-rendered-by attribute
                    //this timeout prevents the SPA from loading the link in the original tab
                    setTimeout(function() {
                        link.action.restoreDataAura();
                    }, 200);
                }
            },
            mouseleave: function() {
                //fail-safe: just in case the user leaves the link before mouseup
                if ($(link.current.el).attr('data-aura-rendered-by') === '') {
                    link.action.restoreDataAura();
                }
                link.action.voidHref();
            }
        });
    }
    
    $(document).mouseover(function() {
        //attaches listeners to list element when hovered
        $('li').on({
            mouseenter: function(e) {
                e.stopImmediatePropagation();
                link.static.define($(this));
                addListeners($(this));
            }
        });
        //attaches listeners to dynamic feed elements when hovered
        $('.compactFeedElement, .cuf-entityLinkId, .forceChatterCompoundFieldsGroupName').on({
            mouseenter: function(e) {
                e.stopImmediatePropagation();
                link.dynamic.define($(this));
                addListeners($(this));
            }
        });
    });
})();
