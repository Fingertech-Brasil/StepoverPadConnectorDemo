var signSocket = ( function($) {
	var ws;
	var callbacks = [];
	var messageId = 1;
	var wsIsOpen = false;
	var timestamp = new Date().getTime();
	
	var signSocketUrl = "wss://signsocket.stepover.com:57357/signsocket/";

	var pub = {};

	var reconnectTries = 0;

	pub.reconnectCallback = null;
	pub.reconnect = false;

	pub.events =
		{
			response: function(e)
				{
					if( typeof callbacks[ e.messageId ] != 'undefined' && typeof callbacks[ e.messageId ] == 'function' )
					{
						callbacks[ e.messageId ]( e.data.ret );
					}
				}
		};

	pub.init = function(callback)
	{
		if( wsIsOpen )
		{
			callback("isopen");
			return;
		}

		reconnectTries++;

		if (reconnectTries > 30) {
			console.info("couldn't reconnect!");
			reconnectTries = 0;
			return;
		}

		try
		{
			setTimeout( function() {

				ws = $.websocket(signSocketUrl, {
					events: pub.events,
					close: function () {
						wsIsOpen = false;
						if (pub.reconnect) {
							reconnectTries = 0;
							reconnect();
						}
					},
					open: function () {
						reconnectTries = 0;
						wsIsOpen = true;
						callback("open");
						pub.signSocketStart();
					},
					error: function() {
						if( !wsIsOpen )
						{
							pub.init(callback);
						}
					}
				});

				pub.ws = ws;

			}, reconnectTries == 0 ? 0 : 1000 );
		}
		catch( e )
		{
			pub.init( callback );
		}
	};


	function reconnect() {

		reconnectTries++;

		if (reconnectTries > 30) {
			console.info("couldn't reconnect!");
			reconnectTries = 0;
			return;
		}

		setTimeout( function()
		{
			try
			{
				ws = null;
				ws = $.websocket(signSocketUrl, {
					events: this.events,
					close: function () {
						wsIsOpen = false;
						reconnect();
					},
					open: function () {
						reconnectTries  = 0;
						wsIsOpen = true;
						if (pub.reconnectCallback != null) {
							pub.reconnectCallback();
							pub.reconnectCallback = null;
						}
					},
					error: function() {
						reconnect();
					}
				});
			}
			catch(e)
			{
				reconnect();
			}

		}, 1000 );
	}
	

	function send( message, data, callback )
	{
		if( !wsIsOpen ) return;
		
		if( typeof data == 'undefined' || data === null )
		{
			data = {};
		}
		
		if( typeof ws == 'undefined' )
		{
			return;
		}
		
		if( !data.messageId )
		{
			data.messageId = timestamp + '-' + messageId++;
		}
		
		ws.send( message, data );
		
		if ( typeof callback != 'undefined' ) {
			callbacks[ data.messageId ] = callback;
		}
		
	}

	pub.send = send;
	
	pub.signSocketStopSigning = function( showManufacturerLogo, callback )
	{
		send( 'stopSigning', { 'showManufacturerLogo' : showManufacturerLogo }, callback );
	};

	pub.signSocketKeepAlive = function()
	{
		send( 'keepAlive' );
	};

	pub.signSocketGetSignatureImage = function( width, height, withAlpha, callback )
	{
		return send( 'getSignatureImage', { 'width': width, 'height': height, 'withAlpha': withAlpha }, callback );
	};

	pub.signSocketStartSigning = function( x, y, width, height, resolution, page, withHashDialog, signSession, signatureTimeout, config, callback )
	{
		send( 'startSigning', { 'x': x, 'y':  y, 'width': width, 'height': height, 'resolution': resolution,
					'page': page, 'withHashDialog' : withHashDialog, 'signSession' : signSession, 'signatureTimeout' : signatureTimeout, config }, callback );
	};

	pub.signSocketStartViewing = function( pages, resolution, callback )
	{
		send( 'startViewing', {'pages': pages, 'resolution': resolution }, callback );
	};

	pub.signSocketGetDeviceCount = function(callback)
	{
		send( 'getDeviceCount', null, callback );
	};

	pub.signSocketExecuteDeviceSearch = function(callback)
	{
		send( 'executeDeviceSearch', null, callback );
	};

	pub.signSocketGetEncryptedAesKey = function( hash, callback )
	{
		var data = {};
		data.darray = JSON.stringify( hash );
		send( 'getEncryptedAesKey', data, callback );
	};

	pub.signSocketSetFinalDocHash = function( hash )
	{
		var data = {};
		data.darray = JSON.stringify( hash );
		send( 'setFinalDocHash', data );
	};

	pub.signSocketGetSignedFinalDocHash = function(callback)
	{
		return send( 'getSignedFinalDocHash', null, callback );
	};

	pub.signSocketStart = function(callback)
	{
		return send( 'start', null, callback );
	};

	pub.signSocketGetPreliminaryData = function( width, height, withAlpha, withHashDialog, callback )
	{
		send( 'getPreliminaryData', { 'width': width, 'height': height, 'withAlpha': withAlpha, 'withHashDialog': withHashDialog }, callback );
	};
	
	pub.signSocketGetVersion = function( callback )
	{
		send( 'getVersion', null, callback );
	}

	pub.signSocketGetDeviceInfo = function( callback )
	{
		send( 'getDeviceInfo', null, callback );
	}

	pub.signSocketFinishSigning = function()
	{
		send( 'finishSigning', null, undefined );
	}

	pub.signSocketRestart = function( reconnect )
	{
		pub.reconnect = reconnect;
		send( 'restart', null, undefined );
	}

	pub.setUrl = function( url )
	{
		signSocketUrl = url;
	}
	
	return pub;
	
}($));