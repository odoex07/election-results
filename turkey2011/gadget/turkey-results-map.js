// turkey-results-map.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

// Keep this in sync with ALL_ALL.xml
var strings = {
	nationwideLabel: 'Nationwide Results',
	//chooseLabel: 'Choose a province and select a race:',
	provinceLabel: 'Province:',
	partyLabel: 'Party:',
	topParty: 'Top Votes',
	//secondParty: 'Second',
	//thirdParty: 'Third',
	//fourthParty: 'Fourth',
	turkey: 'Turkey',
	percentReporting: '{{percent}} counted ({{counted}}/{{total}} ballot boxes)',
	countdownHeading: 'Live results in:',
	countdownHours: '{{hours}} hours',
	countdownHour: '1 hour',
	countdownMinutes: '{{minutes}} minutes',
	countdownMinute: '1 minute',
	noVotes: 'No votes reported',
	unopposed: 'Unopposed'
};

var parties = [
	{ id: 4, abbr: 'DSP', color: '#000080', icon: 5 },
	{ id: 7, abbr: 'BBP', color: '#6666CC', icon: 2 },
	{ id: 8, abbr: 'DP', color: '#C2D1F0', icon: 4 },
	{ id: 9, abbr: 'EMEP', color: '#FF00FF', icon: 7 },
	{ id: 13, abbr: 'LDP', color: '#0000FF', icon: 10 },
	{ id: 14, abbr: 'MP', color: '#CCFFCC', icon: 13 },
	{ id: 16, abbr: 'SP', color: '#FF9900', icon: 14 },
	{ id: 17, abbr: 'TKP', color: '#FF0000', icon: 15 },
	{ id: 20, abbr: 'BGMZ1', color: '#993366', icon: 0 },
	{ id: 21, abbr: 'BGMZDIGER', color: '#993366', icon: 0 },
	{ id: 22, abbr: 'AKP', color: '#FFCC00', icon: 1 },
	{ id: 23, abbr: 'CHP', color: '#FF6600', icon: 3 },
	{ id: 24, abbr: 'MHP', color: '#808000', icon: 11 },
	{ id: 27, abbr: 'BGMZ2', color: '#993366', icon: 0 },
	{ id: 28, abbr: 'BGMZ3', color: '#993366', icon: 0 },
	{ id: 29, abbr: 'BGMZ4', color: '#993366', icon: 0 },
	{ id: 30, abbr: 'BGMZ5', color: '#993366', icon: 0 },
	{ id: 31, abbr: 'BGMZ6', color: '#993366', icon: 0 },
	{ id: 32, abbr: 'BGMZ7', color: '#993366', icon: 0 },
	{ id: 33, abbr: 'HEPAR', color: '#B3D580', icon: 9 },
	{ id: 34, abbr: 'HAS', color: '#808080', icon: 8 },
	{ id: 35, abbr: 'DYP', color: '#E1C7E1', icon: 6 },
	{ id: 36, abbr: 'MMP', color: '#00FF00', icon: 12 }
];

// Voting results column offsets
var col = {};
col.parties = 0;
col.ID = parties.length;
col.NumVoters = col.ID + 1;
col.NumBallotBoxes = col.ID + 2;
col.NumCountedBallotBoxes = col.ID + 3;

function resultsFields() {
	return S(
		parties.map( function( party ) {
			return S( "'VoteCount-", party.id, "'" );
		}).join( ',' ),
		',ID,NumVoters',
		',NumBallotBoxes,NumCountedBallotBoxes'
	);
}

document.write(
	'<style type="text/css">',
		'html, body { margin:0; padding:0; border:0 none; }',
	'</style>'
);

var gm = google.maps, gme = gm.event;

var $window = $(window), ww = $window.width(), wh = $window.height();

// TEMP
ww = 740;
wh = 426;
// END TEMP

var geo = {};
var $map;

var prefs = new _IG_Prefs();

var opt = window.GoogleElectionMapOptions || {};
opt.fontsize = '15px';
var sw = 300;

opt.codeUrl = opt.codeUrl || 'http://election-results.googlecode.com/hg/turkey2011/';
opt.imgUrl = opt.imgUrl || opt.codeUrl + 'images/';
opt.shapeUrl = opt.shapeUrl || opt.codeUrl + 'shapes/json/';

opt.voteUrl = '???';

opt.province = opt.province || 'turkey';

if( ! Array.prototype.forEach ) {
	Array.prototype.forEach = function( fun /*, thisp*/ ) {
		if( typeof fun != 'function' )
			throw new TypeError();
		
		var thisp = arguments[1];
		for( var i = 0, n = this.length;  i < n;  ++i ) {
			if( i in this )
				fun.call( thisp, this[i], i, this );
		}
	};
}

if( ! Array.prototype.map ) {
	Array.prototype.map = function( fun /*, thisp*/ ) {
		var len = this.length;
		if( typeof fun != 'function' )
			throw new TypeError();
		
		var res = new Array( len );
		var thisp = arguments[1];
		for( var i = 0;  i < len;  ++i ) {
			if( i in this )
				res[i] = fun.call( thisp, this[i], i, this );
		}
		
		return res;
	};
}

Array.prototype.mapjoin = function( fun, delim ) {
	return this.map( fun ).join( delim || '' );
};

if( ! Array.prototype.index ) {
	Array.prototype.index = function( field ) {
		this.by = this.by || {};
		if( field ) {
			var by = this.by[field] = {};
			for( var i = 0, n = this.length;  i < n;  ++i ) {
				var obj = this[i];
				by[obj[field]] = obj;
				obj.index = i;
			}
		}
		else {
			var by = this.by;
			for( var i = 0, n = this.length;  i < n;  ++i ) {
				var str = this[i];
				by[str] = str;
				str.index = i;
			}
		}
		return this;
	};
}

Array.prototype.random = function() {
	return this[ randomInt(this.length) ];
};

String.prototype.trim = function() {
	return this.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
};

String.prototype.words = function( fun ) {
	this.split(' ').forEach( fun );
};

String.prototype.T = function( args ) {
	return ( prefs.getMsg(this) || strings[this] || '' ).replace( /\{\{(\w+)\}\}/g,
		function( match, name ) {
			var value = args[name];
			return value != null ? value : match;
		});
}

function S() {
	return Array.prototype.join.call( arguments, '' );
}

function join( array, delim ) {
	return Array.prototype.join.call( array, delim || '' );
}

//jQuery.extend( jQuery.fn, {
//	html: function( a ) {
//		if( a == null ) return this[0] && this[0].innerHTML;
//		return this.empty().append( join( a.charAt ? arguments : a ) );
//	},
//	setClass: function( cls, yes ) {
//		return this[ yes ? 'addClass' : 'removeClass' ]( cls );
//	}
//});

function randomInt( n ) {
	return Math.floor( Math.random() * n );
}

// hoverize.js
// Based on hoverintent plugin for jQuery

(function( $ ) {
	
	var opt = {
		slop: 7,
		interval: 200
	};
	
	function start() {
		if( ! timer ) {
			timer = setInterval( check, opt.interval );
			$(document.body).bind( 'mousemove', move );
		}
	}
	
	function clear() {
		if( timer ) {
			clearInterval( timer );
			timer = null;
			$(document.body).unbind( 'mousemove', move );
		}
	}
	
	function check() {
		if ( ( Math.abs( cur.x - last.x ) + Math.abs( cur.y - last.y ) ) < opt.slop ) {
			clear();
			for( var i  = 0,  n = functions.length;  i < n;  ++i )
				functions[i]();
		}
		else {
			last = cur;
		}
	}
	
	function move( e ) {
		cur = { x:e.screenX, y:e.screenY };
	}
	
	var timer, last = { x:0, y:0 }, cur = { x:0, y:0 }, functions = [];
	
	hoverize = function( fn, fast ) {
		
		function now() {
			fast && fast.apply( null, args );
		}
		
		function fire() {
			clear();
			return fn.apply( null, args );
		}
		functions.push( fire );
		
		var args;
		
		return {
			clear: clear,
			
			now: function() {
				args = arguments;
				now();
				fire();
			},
			
			hover: function() {
				args = arguments;
				now();
				start();
			}
		};
	}
})( jQuery );

parties.index('id').index('abbr');

document.body.scroll = 'no';

document.write(
	'<style type="text/css">',
		'.selects tr { vertical-align:middle; }',
		'.selects label { font-weight:bold; margin:0; }',
		'.selects .selectdiv { margin:0 0 4px 6px; }',
		'html, body { width:', ww, 'px; height:', wh, 'px; overflow:hidden; }',
		'* { font-family: Arial,sans-serif; font-size: ', opt.fontsize, '; }',
		'#outer {}',
		opt.tpm ? '.fullpanel { background-color:#CCC7AA; }' : '.fullpanel { background-color:#EEE; }',
		'#provinceSelector, #partySelector { width:', sw - 12, 'px; }',
		'.barvote { font-weight:bold; color:white; }',
		'h2 { font-size:11pt; margin:0; padding:0; }',
		'.content table { xwidth:100%; }',
		'.content .contentboxtd { width:7%; }',
		'.content .contentnametd { xfont-size:24px; xwidth:18%; }',
		'.content .contentbox { height:24px; width:24px; xfloat:left; margin-right:4px; }',
		'.content .contentname { xfont-size:12pt; white-space:pre; }',
		'.content .contentvotestd { text-align:right; width:5em; }',
		'.content .contentpercenttd { text-align:right; width:2em; }',
		'.content .contentvotes, .content .contentpercent { xfont-size:', opt.fontsize, '; margin-right:4px; }',
		'.content .contentclear { clear:left; }',
		'.content .contentreporting { margin-bottom:8px; }',
		'.content .contentreporting * { xfont-size:20px; }',
		'.content {}',
		'#content-scroll { overflow:scroll; overflow-x:hidden; }',
		'#maptip { position:absolute; z-index:10; border:1px solid #333; background:#f7f5d1; color:#333; white-space: nowrap; display:none; }',
		'.tiptitlebar { padding:4px 8px; border-bottom:1px solid #AAA; }',
		'.tiptitletext { font-weight:bold; font-size:120%; }',
		'.tipcontent { padding:4px 8px 8px 8px; }',
		'.tipreporting { font-size:80%; padding:4px 8px; border-top:1px solid #AAA; }',
		'#selectorpanel { height:85px; }',
		'#selectorpanel, #selectorpanel * { font-size:14px; }',
		'.candidate, .candidate * { font-size:18px; font-weight:bold; }',
		'.candidate-small, .candidate-small * { font-size:14px; font-weight:bold; }',
		'#centerlabel, #centerlabel * { font-size:12px; xfont-weight:bold; }',
		'#spinner { z-index:999999; filter:alpha(opacity=70); opacity:0.70; -moz-opacity:0.70; position:absolute; left:', Math.floor( ww/2 - 64 ), 'px; top:', Math.floor( wh/2 - 20 ), 'px; }',
		'#attrib { z-index:999999; position:absolute; right:4px; bottom:16px; }',
		'#error { z-index:999999; position:absolute; left:4px; bottom:4px; border:1px solid #888; background-color:#FFCCCC; font-weight:bold; padding:6px; }',
	'</style>'
);


var index = 0;
function option( value, name, selected, disabled ) {
	var html = optionHTML( value, name, selected, disabled );
	++index;
	return html;
}

function optionHTML( value, name, selected, disabled ) {
	var id = value ? 'id="option-' + value + '" ' : '';
	var style = disabled ? 'color:#AAA; font-style:italic; font-weight:bold;' : '';
	selected = selected ? 'selected="selected" ' : '';
	disabled = disabled ? 'disabled="disabled" ' : '';
	return S(
		'<option ', id, 'value="', value, '" style="', style, '" ', selected, disabled, '>',
			name,
		'</option>'
	);
}

function provinceOption( province, selected, dated ) {
	province.selectorIndex = index;
	return option( province.abbr, province.name, selected );
}

function raceOption( value, name ) {
	return option( value, name, value == opt.infoType );
}

function imgUrl( name ) {
	return opt.imgUrl + name;
}

document.write(
	'<div id="outer">',
	'</div>',
	'<div id="maptip">',
	'</div>',
	'<div id="attrib">',
	'</div>',
	'<div id="error" style="display:none;">',
	'</div>',
	'<div id="spinner">',
		'<img border="0" style="width:128px; height:128px;" src="', imgUrl('spinner-124.gif'), '" />',
	'</div>'
);

function contentTable() {
	return S(
		'<table cellpadding="0" cellspacing="0">',
			'<tr valign="top" class="fullpanel">',
				'<td style="width:', sw, 'px;" class="leftpanel">',
					'<div id="selectorpanel" style="width:100%; height:100%;">',
						'<div style="margin:0; padding:4px;">',
							'<div style="font-weight:bold; white-space:nowrap; margin:2px 0;">',
								'chooseLabel'.T(),
							'</div>',
							'<table class="selects" cellspacing="0" cellpadding="0" style="margin-right:6px;">',
								'<tr>',
									'<td class="labelcell">',
										'<label for="provinceSelector">',
											'provinceLabel'.T(),
										'</label>',
									'</td>',
									'<td class="selectcell">',
										'<div class="selectdiv">',
											'<select id="provinceSelector">',
												option( '-1', 'nationwideLabel'.T() ),
												geo.provinces.features.mapjoin( function( province ) {
													return provinceOption( province, province.abbr == opt.province, true );
												}),
											'</select>',
										'</div>',
									'</td>',
								'</tr>',
								'<tr>',
									'<td class="labelcell">',
										'<label for="partySelector">',
											'partyLabel'.T(),
										'</label>',
									'</td>',
									'<td class="selectcell">',
										'<div class="selectdiv">',
											'<select id="partySelector">',
												option( '-1', 'topParty'.T() ),
												//option( '-2', 'secondParty'.T() ),
												//option( '-3', 'thirdParty'.T() ),
												//option( '-4', 'fourthParty'.T() ),
												option( '', '' ),
												parties.mapjoin( function( party ) {
													return option( party.id, party.abbr );
												}),
											'</select>',
										'</div>',
									'</td>',
								'</tr>',
							'</table>',
						'</div>',
					'</div>',
				'</td>',
				'<td style="width:', ww - sw, 'px;" class="rightpanel">',
					'<div id="content-two" class="content">',
					'</div>',
				'</td>',
			'</tr>',
			'<tr class="mappanel">',
				'<td colspan="2" style="width:100%; border-top:1px solid #DDD;" id="mapcol">',
					'<div id="map" style="width:100%; height:100%;">',
					'</div>',
				'</td>',
			'</tr>',
		'</table>'
	);
}

(function( $ ) {
	
	opt.province = prefs.getString('province');
	opt.party = '1';
	
	//opt.zoom = opt.zoom || 3;
	
	var fillOpacity = .75;
	
	function getJSON( type, path, file, cache, callback, retries ) {
		var stamp = +new Date;
		if( ! opt.nocache ) stamp = Math.floor( stamp / cache / 1000 );
		if( retries ) stamp += '-' + retries;
		if( retries == 3 ) showError( type, file );
		_IG_FetchContent( path + file + '?' + stamp, function( json ) {
			// Q&D test for bad JSON
			if( json && json.charAt(0) == '{' ) {
				$('#error').hide();
				callback( eval( '(' + json + ')' ) );
			}
			else {
				reportError( type, file );
				retries = ( retries || 0 );
				var delay = Math.min( Math.pow( 2, retries ), 128 ) * 1000;
				setTimeout( function() {
					getJSON( type, path, file, cache, callback, retries + 1 );
				}, delay );
			}
		}, {
			refreshInterval: opt.nocache ? 1 : cache
		});
	}
	
	function loadRegion( id ) {
			var file =
				id < 0 ? 'turkey.jsonp' :
				'province-' + id + '.jsonp';
		getGeoJSON( opt.shapeUrl + file );
	}
	
	function getScript( url ) {
		$.ajax({
			url: url,
			dataType: 'script',
			cache: true
		});
	}
	
	function getGeoJSON( url ) {
		getScript( url );
	}
	
	loadGeoJSON = function( json ) {
		//debugger;
		var loader = {
			provinces: function() {
				json.features.index('id').index('abbr');
				geo.current = geo.provinces = json;
				$('#outer').html( contentTable() );
				initSelectors();
				$map = $('#map');
				$map.height( wh - $map.offset().top );
				loadView();
				_IG_Analytics( 'UA-5730550-1', '/results' );
			},
			districts: function() {
			}
		}[json.kind];
		loader();
	};
	
	function showError( type, file ) {
		file = file.replace( '.json', '' ).replace( '-all', '' ).toUpperCase();
		$('#error').html( S( '<div>Error loading ', type, ' for ', file, '</div>' ) ).show();
		$('#spinner').hide();
	}
	
	function reportError( type, file ) {
		_IG_Analytics( 'UA-6203275-1', '/' + type + '/' + file );
	}
	
	function htmlEscape( str ) {
		var div = document.createElement( 'div' );
		div.appendChild( document.createTextNode( str ) );
		return div.innerHTML;
	}
	
	function percent( n ) {
		var p = Math.round( n * 100 );
		if( p == 100  &&  n < 1 ) p = 99;
		if( p == 0  && n > 0 ) p = '&lt;1';
		return p + '%';
	}
	
	NationwideControl = function( show ) {
		return $.extend( new GControl, {
			initialize: function( map ) {
				var $control = $(S(
					'<div style="color:black; font-family:Arial,sans-serif;">',
						'<div style="background-color:white; border:1px solid black; cursor:pointer; text-align:center; width:6em;">',
							'<div style="border-color:white #B0B0B0 #B0B0B0 white; border-style:solid; border-width:1px; font-size:12px;">',
								'nationwideLabel'.T(),
							'</div>',
						'</div>',
					'</div>'
				)).click( function() { setProvince(stateUS); } ).appendTo( map.getContainer() );
				return $control[0];
			},
			
			getDefaultPosition: function() {
				return new GControlPosition( G_ANCHOR_TOP_LEFT, new GSize( 50, 9 ) );
			}
		});
	};
	
	var map, gonzo;
	
	var overlays = [];
	overlays.clear = function() {
		while( overlays.length ) overlays.pop().setMap( null );
	};
	
	//var province = provinces[opt.province];
	
	function pointLatLng( point ) {
		return new gm.LatLng( point[1], point[0] );
	}
	
	function randomColor() {
		return '#' + hh() + hh() + hh();
	}
	
	function randomGray() {
		var h = hh();
		return '#' + h + h + h;
	}
	
	function hh() {
		var xx = Math.floor( Math.random() *128 + 96 ).toString(16);
		return xx.length == 2 ? xx : '0'+xx;
	}
	
	var reloadTimer;
	
	var geoMoveNext = true;
	
	function geoReady() {
		if( geoMoveNext ) {
			geoMoveNext = false;
			moveToGeo();
		}
		polys();
		$('#spinner').hide();
		//reloadTimer = setTimeout( function() { loadView(); }, 300000 );
	}
	
	function moveToGeo() {
		var json = geo.current;
		$('#map').show();
		initMap();
		gme.trigger( map, 'resize' );
		overlays.clear();
		//$('script[title=jsonresult]').remove();
		//if( json.status == 'later' ) return;
		var bbox = json.bbox;
		if( bbox ) {
			map.fitBounds( new gm.LatLngBounds(
				new gm.LatLng( bbox[1], bbox[0] ),
				new gm.LatLng( bbox[3], bbox[2] )
			) );
		}
	}
	
	var  mouseFeature;
	
	function getStateDistricts( features, province ) {
		var districts = [];
		for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
			if( feature.province.toUpperCase() == curProvince.abbr )
				districts.push( feature );
		}
		return districts;
	}
	
	function polys() {
		colorize( /* ?? */ );
		var $container = $('#map');
		function getFeature( event, where ) {
			return where && where.feature;
		}
		var events = {
			mousemove: function( event, where ) {
				var feature = getFeature( event, where );
				if( feature == mouseFeature ) return;
				mouseFeature = feature;
				map.setOptions({ draggableCursor: feature ? 'pointer' : null });
				showTip( feature );
			},
			click: function( event, where ) {
				var feature = getFeature( event, where );
				if( ! feature ) return;
				if( feature.type == 'province'  || feature.type == 'cd' )
					setProvince( feature.province );
			}
		};
		overlays.clear();
		// Let map display before drawing polys
		setTimeout( function() {
			var overlay = new PolyGonzo.PgOverlay({
				map: map,
				geo: geo.current,
				events: events
			});
			overlays.push( overlay );
			overlay.setMap( map );
			//overlay.redraw( null, true );
		}, 250 );
	}
	
	function colorize( /* ?? */ ) {
		// Use wider borders in IE to cover up gaps between borders, except in House view
		//strokeWidth = $.browser.msie ? 2 : 1;
		strokeWidth = 1;
		var features = geo.current.features;
		var partyID = $('#partySelector').val();
		if( partyID < 0 ) {
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var id = feature.id;
				var row = curResults.rowsByID[id];
				var party = parties[row.partyMax];
				if( party ) {
					feature.fillColor = party.color;
					feature.fillOpacity = .75;
				}
				else {
					feature.fillColor = '#FFFFFF';
					feature.fillOpacity = 0;
				}
				feature.strokeColor = '#000000';
				feature.strokeOpacity = .4;
				feature.strokeWidth = strokeWidth;
			}
		}
		else {
			var party = parties.by.id[partyID], color = party.color, index = party.index;
			var max = 0;
			var rows = curResults.rows;
			for( var row, iRow = -1;  row = rows[++iRow]; ) {
				max = Math.max( max, row[index] );
			}
			for( var iFeature = -1, feature;  feature = features[++iFeature]; ) {
				var id = feature.id;
				var row = curResults.rowsByID[id];
				feature.fillColor = color;
				feature.fillOpacity = max ? row[index] / max : 0;
				feature.strokeColor = '#000000';
				feature.strokeOpacity = .4;
				feature.strokeWidth = strokeWidth;
			}
		}
	}
	
	function getSeats( race, seat ) {
		if( ! race ) return null;
		if( seat == 'One' ) seat = '1';
		if( race[seat] ) return [ race[seat] ];
		if( race['NV'] ) return [ race['NV'] ];
		if( race['2006'] && race['2008'] ) return [ race['2006'], race['2008'] ];
		return null;
	}
	
	var tipOffset = { x:10, y:20 };
	var $maptip, tipHtml;
	$('body').bind( 'mousemove', moveTip );
	
	function showTip( feature ) {
		if( ! $maptip ) $maptip = $('#maptip');
		tipHtml = formatTip( feature );
		if( tipHtml ) {
			$maptip.html( tipHtml ).show();
		}
		else {
			$maptip.hide();
		}
	}
	
	function formatColorPatch( party, max ) {
		var size = Math.sqrt( party.vsTop ) * max;
		var margin1 = ( max - size ) / 2;
		var margin2 = max - size - margin1;
		return S(
			'<div style="background:', party.color, '; width:', size, 'px; height:', size, 'px; margin:', margin1+2, 'px ', margin2+8, 'px ', margin2+2, 'px ', margin1+0, 'px; border:1px solid #AAA;">',
			'</div>'
		);
	}
	
	function formatTipPartyRow( party ) {
		return S(
			'<tr>',
				'<td>',
					formatColorPatch( party, 24 ),
				'</td>',
				'<td style="text-align:right; padding-right:12px;">',
					percent( party.vsAll ),
				'</td>',
				'<td>',
					'<div style="background:url(', imgUrl('parties-24.png'), '); background-position:-', party.icon * 24, ' 0; width:24px; height:24px; margin:2px 8px 2px 0; border:1px solid #AAA;">',
					'</div>',
				'</td>',
				'<td style="">',
					party.abbr,
				'</td>',
			'</tr>'
		);
	}
	
	function topPartiesByVote( result, max ) {
		var top = parties.slice();
		var total = 0;
		for( var i = -1;  ++i < parties.length; ) {
			total += result[i];
		}
		for( var i = -1;  ++i < parties.length; ) {
			var party = top[i], votes = result[i];
			party.votes = votes;
			party.vsAll = votes / total;
			//party.total = total;
		}
		// TODO: use fast sort?
		top = top.sort( function( a, b ) {
			return(
				a.votes < b.votes ? 1 :
				a.votes > b.votes ? -1 :
				0
			);
		}).slice( 0, max );
		while( top.length  &&  ! top[top.length-1].votes )
			top.pop();
		if( top.length ) {
			var most = top[0].votes;
			for( var i = -1;  ++i < top.length; ) {
				var party = top[i];
				party.vsTop = party.votes / most;
			}
		}
		return top;
	}
	
	function formatTipParties( feature, result ) {
		var topParties = topPartiesByVote( result, 4 )
		if( ! topParties.length )
			return 'noVotes'.T();
		return S(
			'<table cellpadding="0" cellspacing="0">',
				topParties.mapjoin( formatTipPartyRow ),
			'</table>'
		);
	}
	
	function formatTip( feature ) {
		if( ! feature ) return null;
		var boxColor = '#F2EFE9';
		var result = curResults.rowsByID[feature.id];
		
		var content = S(
			'<div class="tipcontent">',
				formatTipParties( feature, result ),
			'</div>'
		);
		
		var boxes = result[col.NumBallotBoxes];
		var counted = result[col.NumCountedBallotBoxes];
		var footer = S(
			'<div class="tipreporting">',
				'percentReporting'.T({
					counted: counted,
					total: boxes,
					percent: percent( counted / boxes )
				}),
			'</div>'
		);
		
		return S(
			'<div class="tiptitlebar">',
				'<div style="float:left;">',
					'<span class="tiptitletext">',
						feature.name,
						' ',
					'</span>',
				'</div>',
				'<div style="clear:left;">',
				'</div>',
			'</div>',
			content,
			footer
		);
	}
	
	var tipLeft, tipTop;
	
	function moveTip( event ) {
		if( ! tipHtml ) return;
		var x = event.pageX, y = event.pageY;
		x += tipOffset.x;
		y += tipOffset.y;
		var pad = 2;
		var width = $maptip.width(), height = $maptip.height();
		var offsetLeft = width + tipOffset.x * 1.5;
		var offsetTop = height + tipOffset.y * 1.5;
		if( tipLeft ) {
			if( x - offsetLeft < pad )
				tipLeft = false;
			else
				x -= offsetLeft;
		}
		else {
			if( x + width > ww - pad )
				tipLeft = true,  x -= offsetLeft;
		}
		if( tipTop ) {
			if( y - offsetTop < pad )
				tipTop = false;
			else
				y -= offsetTop;
		}
		else {
			if( y + height > wh - pad )
				tipTop = true,  y -= offsetTop;
		}
		$maptip.css({ left:x, top:y });
	}
	
	function formatNumber( nStr ) {
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	}
	
	function getLeaders( locals ) {
		var leaders = {};
		for( var localname in locals ) {
			var votes = locals[localname].votes[0];
			if( votes ) leaders[votes.name] = true;
		}
		return leaders;
	}
	
	// Separate for speed
	function getLeadersN( locals, n ) {
		var leaders = {};
		for( var localname in locals ) {
			for( var i = 0;  i < n;  ++i ) {
				var votes = locals[localname].votes[i];
				if( votes ) leaders[votes.name] = true;
			}
		}
		return leaders;
	}
	
	function setProvinceByAbbr( abbr ) {
		setProvince( provinces.by.abbr(abbr) );
	}
	
	function setProvince( province ) {
		if( ! province ) return;
		if( typeof province == 'string' ) province = provinces.by.abbr( province );
		var select = $('#provinceSelector')[0];
		select && ( select.selectedIndex = province.selectorIndex );
		opt.province = province.abbr.toLowerCase();
		geoMoveNext = true;
		loadView();
	}
	
	function initMap() {
		if( map ) return;
		var mt = gm.MapTypeId;
		map = new gm.Map( $map[0],  {
			mapTypeId: mt.ROADMAP,
			streetViewControl: false,
			mapTypeControlOptions: {
				//mapTypeIds: [
				//	mt.ROADMAP, mt.SATELLITE, mt.HYBRID, mt.TERRAIN
				//]
			},
			zoomControlOptions: {
				style: gm.ZoomControlStyle.SMALL
			}
		});
	}
	
	function initSelectors() {
		
		//setProvinceByAbbr( opt.province );
		
		$('#provinceSelector').bind( 'change keyup', function() {
			var value = this.value.replace('!','').toLowerCase();
			if( opt.province == value ) return;
			opt.province = value;
			loadView();
		});
		
		$('#partySelector').bind( 'change keyup', function() {
			var value = this.value;
			if( opt.infoType == value ) return;
			opt.infoType = value;
			loadView();
		});
	}
	
	function oneshot() {
		var timer;
		return function( fun, time ) {
			clearTimeout( timer );
			timer = setTimeout( fun, time );
		};
	}
	
	function hittest( latlng ) {
	}
	
	function loadView() {
		clearTimeout( reloadTimer );
		reloadTimer = null;
		showTip( false );
		overlays.clear();
		var id = opt.province;
		var $select = $('#partySelector');
		opt.infoType = $select.val();
		
		opt.province = +$('#provinceSelector').val();
		//var province = curProvince = geo.provinces.features.by.abbr[opt.abbr];
		$('#spinner').show();
		//getShapes( opt.province, function() {
			getResults( opt.province, function() {
				geoReady();
			});
		//});
	}
	
	function getShapes( province, callback ) {
		if( province.shapes ) callback();
		else getJSON( 'shapes', opt.shapeUrl, province.abbr.toLowerCase() + '.json', 3600, function( shapes ) {
			province.shapes = shapes;
			//if( province == stateUS ) shapes.features.province.index('province');
			callback();
		});
	}
	
	var cacheResults = {};
	
	function getResults( province ) {
		if( cacheResults[province] ) {
			loadResults( cacheResults[province] );
			return;
		}
		var url = S(
			'http://www.google.com/fusiontables/api/query?',
			'jsonCallback=loadResults&',
			'sql=SELECT+',
			resultsFields(),
			'+FROM+',
			province < 0 ? '885915' : '885918'
		);
		getScript( url );
	}
	
	loadResults = function( json ) {
		// TEMP HACK - nationwide only
		cacheResults[-1] = json;
		var results = curResults = json.table;
		var rowsByID = results.rowsByID = {};
		var rows = curResults.rows;
		for( var row, iRow = -1;  row = rows[++iRow]; ) {
			rowsByID[ row[col.ID] ] = row;
			var nParties = parties.length;
			var max = 0,  partyMax = -1;
			for( iCol = -1;  ++iCol < nParties; ) {
				var count = row[iCol];
				if( count > max ) {
					max = count;
					partyMax = iCol;
				}
			}
			row.partyMax = partyMax;
		}
		geoReady();
	}
	
	function objToSortedKeys( obj ) {
		var result = [];
		for( var key in obj ) result.push( key );
		return result.sort();
	}
	
	var blank = imgUrl( 'blank.gif' );
	
	$window.bind( 'load', function() {
		loadRegion( -1 );
	});

})( jQuery );
