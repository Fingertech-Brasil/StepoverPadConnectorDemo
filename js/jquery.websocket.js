/*
 * jQuery Web Sockets Plugin v0.0.4
 * https://github.com/dchelimsky/jquery-websocket
 * http://code.google.com/p/jquery-websocket/
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2010 by shootaroo (Shotaro Tsubouchi).
 */
(function($){
    $.extend({
        websocket: function(url, settings, protocols) {
            var ws;
            if ( protocols ) {
                ws = new WebSocket(url, protocols);
            } else {
                ws = new WebSocket(url);
            }

            if (ws) {
                ws.onopen = settings.open;
                ws.onclose = settings.close;
                ws.onerror = settings.error;
                ws.onmessage = function(e) {
                    if( e )
                    {
                        var m = JSON.parse(e.data);
                        var h = settings.events[m.type];
                        if (h) h.call(this, m);
                    }    
                };
                ws._send = ws.send;
                ws.send = function(type, data) {
                        var m = {type: type};
                        m = $.extend(true, m, $.extend(true, {}, settings.options, m));
                        if (data) m['data'] = data;
                        return this._send(JSON.stringify(m));
                    }
            }

            return ws;
        }
    });
})(jQuery);