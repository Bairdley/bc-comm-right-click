(function() {
    var arr = [],
        keyed = false;

    $.ajax('https://spreadsheets.google.com/feeds/list/1Fk_RrRaB_-dn_L4pxhHY1usSXlUsq0xelDUpyMSh8IQ/1/public/basic?alt=json').success(function(data) {
        for (var i = 0; i < data.feed.entry.length; i += 1) {
            arr.push([data.feed.entry[i].title.$t, (data.feed.entry[i].content.$t)]);
        }
        arr.forEach(function(v) {
            v[1] = v[1].substring(v[1].indexOf(':') + 2);
        });
    });

    $(document).on('mouseover', function() {
        $('li').on('mousedown', function(event) {
            console.log(keyed);
            if (event.which !== 1) {
                console.log(event.which);
                for (var i = 0; i < arr.length; i++) {
                    if ($(this).find('a').text() === arr[i][0]) {
                        $(this).find('a').attr('href', (arr[i][1]));
                    }
                }
            }
        }).on('click', function(event) {
            if (event.which === 1 && keyed === true) {
                for (var i = 0; i < arr.length; i++) {
                    if ($(this).find('a').text() === arr[i][0]) {
                        event.stopImmediatePropagation();
                        window.open(arr[i][1]);
                    }
                }
            }

        }).on('mouseleave', function() {
            $(this).find('a').attr('href', 'javascript:void(0)');
        });
    });

    $(document).keydown(function(event) {
        keyed = true;
    }).keyup(function() {
        keyed = false;
    });
})();
