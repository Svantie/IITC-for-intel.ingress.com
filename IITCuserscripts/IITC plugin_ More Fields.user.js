// ==UserScript==
// @id             MoreFields
// @name           IITC plugin: More Fields
// @author         Driz & xZwop
// @category       Layer
// @version        0.5.3.20151217183652
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      http://iitc.xoupzk.com/xzwop.morefields.meta.js
// @downloadURL    http://iitc.xoupzk.com/xzwop.morefields.user.js
// @description    [morefields-2015-12-17-183652] By setting two anchors and a cloud of portals, this plugin will generate the plan with the most layers
// @include        https://intel.ingress.com*
// @include        http://intel.ingress.com*
// @match          https://intel.ingress.com*
// @match          http://intel.ingress.com*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START //

window.plugin.morefields = function() {};

window.plugin.morefields.url = 'https://morefields.adrouet.net';
window.plugin.morefields.url_request = 'https://okey.adrouet.net/morefields/compute';

window.plugin.morefields.anchors = {};
window.plugin.morefields.portals = {};
window.plugin.morefields.nb_portals = 0;

///////////////////////////////////////////////////////
// Load Externals adapted by Carb from Point in Polygon
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
/* jshint ignore:start */
window.plugin.morefields.loadExternals = function() {
    try { console.log('Loading leaflet-pip JS now'); } catch(e) {}

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.leafletPip=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var gju = _dereq_('geojson-utils');

var leafletPip = {
    bassackwards: false,
    pointInLayer: function(p, layer, first) {
        'use strict';
        if (p instanceof L.LatLng) p = [p.lng, p.lat];
        else if (leafletPip.bassackwards) p.reverse();

        var results = [];

        layer.eachLayer(function(l) {
            if (first && results.length) return;
            if ((l instanceof L.MultiPolygon ||
                 l instanceof L.Polygon) &&
                gju.pointInPolygon({
                    type: 'Point',
                    coordinates: p
                }, l.toGeoJSON().geometry)) {
                results.push(l);
            }
        });
        return results;
    }
};

module.exports = leafletPip;

},{"geojson-utils":2}],2:[function(_dereq_,module,exports){
(function () {
  var gju = this.gju = {};

  // Export the geojson object for **CommonJS**
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = gju;
  }

  // adapted from http://www.kevlindev.com/gui/math/intersection/Intersection.js
  gju.lineStringsIntersect = function (l1, l2) {
    var intersects = [];
    for (var i = 0; i <= l1.coordinates.length - 2; ++i) {
      for (var j = 0; j <= l2.coordinates.length - 2; ++j) {
        var a1 = {
          x: l1.coordinates[i][1],
          y: l1.coordinates[i][0]
        },
          a2 = {
            x: l1.coordinates[i + 1][1],
            y: l1.coordinates[i + 1][0]
          },
          b1 = {
            x: l2.coordinates[j][1],
            y: l2.coordinates[j][0]
          },
          b2 = {
            x: l2.coordinates[j + 1][1],
            y: l2.coordinates[j + 1][0]
          },
          ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
          ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
          u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
        if (u_b != 0) {
          var ua = ua_t / u_b,
            ub = ub_t / u_b;
          if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
            intersects.push({
              'type': 'Point',
              'coordinates': [a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)]
            });
          }
        }
      }
    }
    if (intersects.length == 0) intersects = false;
    return intersects;
  }

  // Bounding Box

  function boundingBoxAroundPolyCoords (coords) {
    var xAll = [], yAll = []

    for (var i = 0; i < coords[0].length; i++) {
      xAll.push(coords[0][i][1])
      yAll.push(coords[0][i][0])
    }

    xAll = xAll.sort(function (a,b) { return a - b })
    yAll = yAll.sort(function (a,b) { return a - b })

    return [ [xAll[0], yAll[0]], [xAll[xAll.length - 1], yAll[yAll.length - 1]] ]
  }

  gju.pointInBoundingBox = function (point, bounds) {
    return !(point.coordinates[1] < bounds[0][0] || point.coordinates[1] > bounds[1][0] || point.coordinates[0] < bounds[0][1] || point.coordinates[0] > bounds[1][1])
  }

  // Point in Polygon
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#Listing the Vertices

  function pnpoly (x,y,coords) {
    var vert = [ [0,0] ]

    for (var i = 0; i < coords.length; i++) {
      for (var j = 0; j < coords[i].length; j++) {
        vert.push(coords[i][j])
      }
	  vert.push(coords[i][0])
      vert.push([0,0])
    }

    var inside = false
    for (var i = 0, j = vert.length - 1; i < vert.length; j = i++) {
      if (((vert[i][0] > y) != (vert[j][0] > y)) && (x < (vert[j][1] - vert[i][1]) * (y - vert[i][0]) / (vert[j][0] - vert[i][0]) + vert[i][1])) inside = !inside
    }

    return inside
  }

  gju.pointInPolygon = function (p, poly) {
    var coords = (poly.type == "Polygon") ? [ poly.coordinates ] : poly.coordinates

    var insideBox = false
    for (var i = 0; i < coords.length; i++) {
      if (gju.pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords[i]))) insideBox = true
    }
    if (!insideBox) return false

    var insidePoly = false
    for (var i = 0; i < coords.length; i++) {
      if (pnpoly(p.coordinates[1], p.coordinates[0], coords[i])) insidePoly = true
    }

    return insidePoly
  }

  // support multi (but not donut) polygons
  gju.pointInMultiPolygon = function (p, poly) {
    var coords_array = (poly.type == "MultiPolygon") ? [ poly.coordinates ] : poly.coordinates

    var insideBox = false
    var insidePoly = false
    for (var i = 0; i < coords_array.length; i++){
      var coords = coords_array[i];
      for (var j = 0; j < coords.length; j++) {
        if (!insideBox){
          if (gju.pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords[j]))) {
            insideBox = true
          }
        }
      }
      if (!insideBox) return false
      for (var j = 0; j < coords.length; j++) {
        if (!insidePoly){
          if (pnpoly(p.coordinates[1], p.coordinates[0], coords[j])) {
            insidePoly = true
          }
        }
      }
    }

    return insidePoly
  }

  gju.numberToRadius = function (number) {
    return number * Math.PI / 180;
  }

  gju.numberToDegree = function (number) {
    return number * 180 / Math.PI;
  }

  // written with help from @tautologe
  gju.drawCircle = function (radiusInMeters, centerPoint, steps) {
    var center = [centerPoint.coordinates[1], centerPoint.coordinates[0]],
      dist = (radiusInMeters / 1000) / 6371,
      // convert meters to radiant
      radCenter = [gju.numberToRadius(center[0]), gju.numberToRadius(center[1])],
      steps = steps || 15,
      // 15 sided circle
      poly = [[center[0], center[1]]];
    for (var i = 0; i < steps; i++) {
      var brng = 2 * Math.PI * i / steps;
      var lat = Math.asin(Math.sin(radCenter[0]) * Math.cos(dist)
              + Math.cos(radCenter[0]) * Math.sin(dist) * Math.cos(brng));
      var lng = radCenter[1] + Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(radCenter[0]),
                                          Math.cos(dist) - Math.sin(radCenter[0]) * Math.sin(lat));
      poly[i] = [];
      poly[i][1] = gju.numberToDegree(lat);
      poly[i][0] = gju.numberToDegree(lng);
    }
    return {
      "type": "Polygon",
      "coordinates": [poly]
    };
  }

  // assumes rectangle starts at lower left point
  gju.rectangleCentroid = function (rectangle) {
    var bbox = rectangle.coordinates[0];
    var xmin = bbox[0][0],
      ymin = bbox[0][1],
      xmax = bbox[2][0],
      ymax = bbox[2][1];
    var xwidth = xmax - xmin;
    var ywidth = ymax - ymin;
    return {
      'type': 'Point',
      'coordinates': [xmin + xwidth / 2, ymin + ywidth / 2]
    };
  }

  // from http://www.movable-type.co.uk/scripts/latlong.html
  gju.pointDistance = function (pt1, pt2) {
    var lon1 = pt1.coordinates[0],
      lat1 = pt1.coordinates[1],
      lon2 = pt2.coordinates[0],
      lat2 = pt2.coordinates[1],
      dLat = gju.numberToRadius(lat2 - lat1),
      dLon = gju.numberToRadius(lon2 - lon1),
      a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(gju.numberToRadius(lat1))
        * Math.cos(gju.numberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2),
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (6371 * c) * 1000; // returns meters
  },

  // checks if geometry lies entirely within a circle
  // works with Point, LineString, Polygon
  gju.geometryWithinRadius = function (geometry, center, radius) {
    if (geometry.type == 'Point') {
      return gju.pointDistance(geometry, center) <= radius;
    } else if (geometry.type == 'LineString' || geometry.type == 'Polygon') {
      var point = {};
      var coordinates;
      if (geometry.type == 'Polygon') {
        // it's enough to check the exterior ring of the Polygon
        coordinates = geometry.coordinates[0];
      } else {
        coordinates = geometry.coordinates;
      }
      for (var i in coordinates) {
        point.coordinates = coordinates[i];
        if (gju.pointDistance(point, center) > radius) {
          return false;
        }
      }
    }
    return true;
  }

  // adapted from http://paulbourke.net/geometry/polyarea/javascript.txt
  gju.area = function (polygon) {
    var area = 0;
    // TODO: polygon holes at coordinates[1]
    var points = polygon.coordinates[0];
    var j = points.length - 1;
    var p1, p2;

    for (var i = 0; i < points.length; j = i++) {
      var p1 = {
        x: points[i][1],
        y: points[i][0]
      };
      var p2 = {
        x: points[j][1],
        y: points[j][0]
      };
      area += p1.x * p2.y;
      area -= p1.y * p2.x;
    }

    area /= 2;
    return area;
  },

  // adapted from http://paulbourke.net/geometry/polyarea/javascript.txt
  gju.centroid = function (polygon) {
    var f, x = 0,
      y = 0;
    // TODO: polygon holes at coordinates[1]
    var points = polygon.coordinates[0];
    var j = points.length - 1;
    var p1, p2;

    for (var i = 0; i < points.length; j = i++) {
      var p1 = {
        x: points[i][1],
        y: points[i][0]
      };
      var p2 = {
        x: points[j][1],
        y: points[j][0]
      };
      f = p1.x * p2.y - p2.x * p1.y;
      x += (p1.x + p2.x) * f;
      y += (p1.y + p2.y) * f;
    }

    f = gju.area(polygon) * 6;
    return {
      'type': 'Point',
      'coordinates': [y / f, x / f]
    };
  },

  gju.simplify = function (source, kink) { /* source[] array of geojson points */
    /* kink	in metres, kinks above this depth kept  */
    /* kink depth is the height of the triangle abc where a-b and b-c are two consecutive line segments */
    kink = kink || 20;
    source = source.map(function (o) {
      return {
        lng: o.coordinates[0],
        lat: o.coordinates[1]
      }
    });

    var n_source, n_stack, n_dest, start, end, i, sig;
    var dev_sqr, max_dev_sqr, band_sqr;
    var x12, y12, d12, x13, y13, d13, x23, y23, d23;
    var F = (Math.PI / 180.0) * 0.5;
    var index = new Array(); /* aray of indexes of source points to include in the reduced line */
    var sig_start = new Array(); /* indices of start & end of working section */
    var sig_end = new Array();

    /* check for simple cases */

    if (source.length < 3) return (source); /* one or two points */

    /* more complex case. initialize stack */

    n_source = source.length;
    band_sqr = kink * 360.0 / (2.0 * Math.PI * 6378137.0); /* Now in degrees */
    band_sqr *= band_sqr;
    n_dest = 0;
    sig_start[0] = 0;
    sig_end[0] = n_source - 1;
    n_stack = 1;

    /* while the stack is not empty  ... */
    while (n_stack > 0) {

      /* ... pop the top-most entries off the stacks */

      start = sig_start[n_stack - 1];
      end = sig_end[n_stack - 1];
      n_stack--;

      if ((end - start) > 1) { /* any intermediate points ? */

        /* ... yes, so find most deviant intermediate point to
        either side of line joining start & end points */

        x12 = (source[end].lng() - source[start].lng());
        y12 = (source[end].lat() - source[start].lat());
        if (Math.abs(x12) > 180.0) x12 = 360.0 - Math.abs(x12);
        x12 *= Math.cos(F * (source[end].lat() + source[start].lat())); /* use avg lat to reduce lng */
        d12 = (x12 * x12) + (y12 * y12);

        for (i = start + 1, sig = start, max_dev_sqr = -1.0; i < end; i++) {

          x13 = source[i].lng() - source[start].lng();
          y13 = source[i].lat() - source[start].lat();
          if (Math.abs(x13) > 180.0) x13 = 360.0 - Math.abs(x13);
          x13 *= Math.cos(F * (source[i].lat() + source[start].lat()));
          d13 = (x13 * x13) + (y13 * y13);

          x23 = source[i].lng() - source[end].lng();
          y23 = source[i].lat() - source[end].lat();
          if (Math.abs(x23) > 180.0) x23 = 360.0 - Math.abs(x23);
          x23 *= Math.cos(F * (source[i].lat() + source[end].lat()));
          d23 = (x23 * x23) + (y23 * y23);

          if (d13 >= (d12 + d23)) dev_sqr = d23;
          else if (d23 >= (d12 + d13)) dev_sqr = d13;
          else dev_sqr = (x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12) / d12; // solve triangle
          if (dev_sqr > max_dev_sqr) {
            sig = i;
            max_dev_sqr = dev_sqr;
          }
        }

        if (max_dev_sqr < band_sqr) { /* is there a sig. intermediate point ? */
          /* ... no, so transfer current start point */
          index[n_dest] = start;
          n_dest++;
        } else { /* ... yes, so push two sub-sections on stack for further processing */
          n_stack++;
          sig_start[n_stack - 1] = sig;
          sig_end[n_stack - 1] = end;
          n_stack++;
          sig_start[n_stack - 1] = start;
          sig_end[n_stack - 1] = sig;
        }
      } else { /* ... no intermediate points, so transfer current start point */
        index[n_dest] = start;
        n_dest++;
      }
    }

    /* transfer last point */
    index[n_dest] = n_source - 1;
    n_dest++;

    /* make return array */
    var r = new Array();
    for (var i = 0; i < n_dest; i++)
      r.push(source[index[i]]);

    return r.map(function (o) {
      return {
        type: "Point",
        coordinates: [o.lng, o.lat]
      }
    });
  }

  // http://www.movable-type.co.uk/scripts/latlong.html#destPoint
  gju.destinationPoint = function (pt, brng, dist) {
    dist = dist/6371;  // convert dist to angular distance in radians
    brng = gju.numberToRadius(brng);

    var lon1 = gju.numberToRadius(pt.coordinates[0]);
    var lat1 = gju.numberToRadius(pt.coordinates[1]);

    var lat2 = Math.asin( Math.sin(lat1)*Math.cos(dist) +
                          Math.cos(lat1)*Math.sin(dist)*Math.cos(brng) );
    var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(dist)*Math.cos(lat1),
                                 Math.cos(dist)-Math.sin(lat1)*Math.sin(lat2));
    lon2 = (lon2+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180ยบ

    return {
      'type': 'Point',
      'coordinates': [gju.numberToDegree(lon2), gju.numberToDegree(lat2)]
    };
  };

})();

},{}]},{},[1])
(1)
});
    try { console.log('done loading leaflet-pip JS'); } catch(e) {}
};
/* jshint ignore:end */
// Load Externals adapted by Carb from Point in Polygon
///////////////////////////////////////////////////////

window.plugin.morefields.open_window = function() {
	var anchor1 = "";
	if (window.plugin.morefields.anchors[1]){
		anchor1 = " -> <a onclick='renderPortalDetails(\""+window.plugin.morefields.anchors[1].guid +"\")'>"+window.plugin.morefields.anchors[1].name  + "</a>";
	}
	var anchor2 = "";
	if (window.plugin.morefields.anchors[2]){
		anchor2 = " -> <a onclick='renderPortalDetails(\""+window.plugin.morefields.anchors[2].guid +"\")'>"+window.plugin.morefields.anchors[2].name  + "</a>";
	}

	var html =
	'<div id="morefields_window">' +
		'<div style="width: 500px">' +
			'Anchor <b>1</b>: ' +
				'<button style="font-size: 0.9em; padding: 0 4px"  onclick="window.plugin.morefields.set_anchor(1)">set</button>' +
				'<span id="morefields_anchor1" style="font-style:italic">'+anchor1+'</span>' +
			'<br>' +
			'Anchor <b>2</b>: ' +
				'<button style="font-size: 0.9em; padding: 0 4px"  onclick="window.plugin.morefields.set_anchor(2)">set</button>' +
				'<span id="morefields_anchor2" style="font-style:italic">'+anchor2+'</span>' +
			'<br>' +
		'</div>' +
		'<span id="morefields_number" style="font-weight: bold;">0</span> portals detected in the drawn areas ' +
			'(<a class="help" title="Polygons can be drawn with the <b>draw tools</b> plugin. For more informations, visit the IITC website">?</a>)' +
		'<div>' +
			'<a class="morefields" onclick="window.plugin.morefields.reset_and_refresh()">Reset&Refresh</a>' +
		'</div>' +
		'<div id="morefields_portals" style="overflow: auto; font-style:italic; border: 1px; max-height: 120px;"/>' +
		'<div>' +
			'<a class="morefields" onclick="window.plugin.morefields.generate();">Generate</a>' +
		'</div>' +
		'<div>' +
			//'<a class="morefields" target="_blank" href="'+window.plugin.morefields.url+'">Open the web app</a>' +
			'<a class="morefields" target="_blank" href="http://morefields.adrouet.net">Open the web app</a>' +
		'</div>' +
		'<table style="width:100%">' +
			'<thead>' +
				'<th style="width:33%">' +
					'JSON (for the web-app)' +
				'</th>' +
				'<th style="width:33%">' +
					'Draw Tools' +
				'</th>' +
				'<th style="width:33%">' +
					'Reswue' +
				'</th>' +
			'</thead>' +
			'<tbody>' +
				'<tr>' +
					'<td>' +
						'<div style="overflow: auto; max-height: 120px;">' +
							'<textarea id="morefields_result_json" style="resize:none;" onmouseup="$(this).select();" rows="5">Please click on generate</textarea>' +
						'</div>' +
					'</td>' +
					'<td>' +
						'<div style="overflow: auto; max-height: 120px;">' +
							'<textarea id="morefields_result_drawtools" style="resize:none;" onmouseup="$(this).select();" rows="5">Please click on generate</textarea>' +
						'</div>' +
					'</td>' +
					'<td>' +
						'<div style="overflow: auto; max-height: 120px;">' +
							'<textarea id="morefields_result_reswue" style="resize:none;" onmouseup="$(this).select();" rows="5">Please click on generate</textarea>' +
						'</div>' +
					'</td>' +
				'</tr>' +
			'</tbody>' +
		'</table>' +
		'<div id="morefields_result_stats"/>' +
	'</div>';
	dialog({
		html: html,
		id: 'plugin-morefields',
		title: 'More Fields',
		width: 'auto'
	});

	window.plugin.morefields.reset_and_refresh();
};

window.plugin.morefields.reset_and_refresh = function() {
	window.plugin.morefields.portals = {};
	window.plugin.morefields.nb_portals = 0;
	$('#morefields_portals').html('');
	window.plugin.morefields.process_all_portals();
};

window.plugin.morefields.process_all_portals = function() {
	for (var i in window.portals) {
		window.plugin.morefields.process_portal(i, window.portals[i]._latlng, window.portals[i].options.data.title);
	}
};

window.plugin.morefields.process_portal = function (guid, latlng, title) {
	if (window.plugin.morefields.portals[guid]) {
		if (title && !window.plugin.morefields.portals[guid].name) {
			window.plugin.morefields.update_portal(guid, title);
		}
		return;
	}

	var layer = window.plugin.drawTools.drawnItems;
	if (window.search.lastSearch &&
		window.search.lastSearch.selectedResult &&
		window.search.lastSearch.selectedResult.layer)  {
			layer = window.search.lastSearch.selectedResult.layer;
	}
	if (leafletPip.pointInLayer(latlng, layer).length === 0) {
		return;
	}

	var name = title? title.replace(/\"/g,"\\\""): title;
	window.plugin.morefields.portals[guid] = {
		'lat': latlng.lat,
		'lng': latlng.lng,
		'name': name
	};
	window.plugin.morefields.nb_portals++;

	$('#morefields_number').html(window.plugin.morefields.nb_portals);
	var help = 'New portal(s) detected.\n\nPlease re-generate.';
	$('#morefields_result_json').val(help);
	$('#morefields_result_drawtools').val(help);
	$('#morefields_result_reswue').val(help);
	$('#morefields_result_stats').html('');
	document.getElementById("morefields_portals").innerHTML += " - <a id='morefields_"+guid.replace('.', '_')+"' onclick='renderPortalDetails(\""+guid+"\")'>"+name + "</a><br>";
};

window.plugin.morefields.update_portal = function(guid, title) {
	if (window.plugin.morefields.portals[guid] && !window.plugin.morefields.portals[guid].name) {
		window.plugin.morefields.portals[guid].name = title;
		$('#morefields_'+guid.replace('.', '_')).html(title);
	}
};

window.plugin.morefields.request = function (){
	$.ajax({
		method: 'POST',
		url: window.plugin.morefields.url_request,
		data: $('#morefields_result_json').val(),
		xhrFields: {
			withCredentials: false
		},
		headers: {
			'Content-Type': 'application/json'
		},
	})
	.done(function(data, textStatus, jqXHR) {
		$('#morefields_result_drawtools').val(JSON.stringify(data.draw));
		$('#morefields_result_reswue').val(JSON.stringify(data.reswueImport));
		$('#morefields_result_stats').html("Most layers found: <b>"+data.anchorsSize+'</b> layers!');
		window.plugin.morefields.import(data.draw);
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.responseJSON && jqXHR.responseJSON.msg) {
			$('#morefields_result_stats').html(jqXHR.responseJSON.msg);
		} else {
			$('#morefields_result_stats').html('Generation results: server communication <b>error</b>');
		}
		$('#morefields_result_drawtools').val("-error-");
		$('#morefields_result_reswue').val("-error-");
	});
};

window.plugin.morefields.generate = function (){
	if (!window.plugin.morefields.anchors[1] ||
		!window.plugin.morefields.anchors[2]) {
		alert("You must set the two anchors to generate the JSON.");
		return;
	}
	var JSON = "{\n" +
		" \"baseA\":{\n" +
        "  \"guid\":\""+window.plugin.morefields.anchors[1].guid+"\",\n" +
		"  \"name\":\""+window.plugin.morefields.anchors[1].name.replace(/\"/g,"\\\"")+"\",\n" +
		"  \"lat\":"+window.plugin.morefields.anchors[1].lat+",\n" +
		"  \"lng\":"+window.plugin.morefields.anchors[1].lng+"\n" +
		" },\n" +
		" \"baseB\":{\n" +
        "  \"guid\":\""+window.plugin.morefields.anchors[2].guid+"\",\n" +
		"  \"name\":\""+window.plugin.morefields.anchors[2].name.replace(/\"/g,"\\\"")+"\",\n" +
		"  \"lat\":"+window.plugin.morefields.anchors[2].lat+",\n" +
		"  \"lng\":"+window.plugin.morefields.anchors[2].lng+"\n" +
		" },\n" +
		" \"portals\":[";
	var first = true;
	for (var i in window.plugin.morefields.portals) {
		if (first) {
			first = false;
		} else {
			JSON += ",";
		}
		JSON += "\n  {\n" +
        "   \"guid\":\""+i+"\",\n" +
		"   \"name\":\""+window.plugin.morefields.portals[i].name+"\",\n" +
		"   \"lat\":"+window.plugin.morefields.portals[i].lat+",\n" +
		"   \"lng\":"+window.plugin.morefields.portals[i].lng+"\n" +
		"  }";
	}
	JSON += "\n ]\n" +
	"}";
	$('#morefields_result_json').val(JSON);
	window.plugin.morefields.request();
};

window.plugin.morefields.set_anchor = function (anchor) {
	var guid = window.selectedPortal;
	var p = window.portals[guid];
	if(!guid || !p) {
		alert("Please select a portal first!");
		return;
	}

	window.plugin.morefields.anchors[anchor] = {
		guid: p.options.guid,
		name: p.options.data.title,
		lat: p._latlng.lat,
		lng: p._latlng.lng
	};
	localStorage['window.plugin.morefields.anchors'] = JSON.stringify(window.plugin.morefields.anchors);
	var html = " -> <a onclick='renderPortalDetails(\""+p.options.guid+"\")'>"+p.options.data.title + "</a>";
	$('#morefields_anchor'+anchor).html(html);
};

window.plugin.morefields.import = function(data) {
	window.plugin.morefields.layer.clearLayers();
	$.each(data, function(index,item) {
		if (item.type == 'polyline') {
			var poly = L.geodesicPolyline(item.latLngs, {color: 'red'});
			poly.addTo(window.plugin.morefields.layer);
		}
	});
};

// Setup
var setup = function() {
	$('head').append('<style>.morefields { display:block; color:#ffce00; border:1px solid #ffce00; padding:3px 0; margin:10px auto; width:80%; text-align:center; background:rgba(8,48,78,.9); }');
	$('#toolbox').append(' <a onclick="window.plugin.morefields.open_window()" title="Optimize your layers! Generate the most layers from two anchors and a cloud of portals!">More Fields</a>');

	window.plugin.morefields.layer = new L.LayerGroup();

    window.addLayerGroup('More Fields', window.plugin.morefields.layer, true);

	if (localStorage["window.plugin.morefields.anchors"]) {
		window.plugin.morefields.anchors = JSON.parse(localStorage["window.plugin.morefields.anchors"]);
	}

	window.addHook('portalAdded', function(e) {
		if ($('#morefields_window')[0])
		window.plugin.morefields.process_portal(e.portal.options.guid, e.portal._latlng, e.portal.options.data.title);
	});

	window.addHook('mapDataRefreshEnd', function(e) {
		if ($('#morefields_window')[0])
		window.plugin.morefields.process_all_portals();
	});

	window.addHook('pluginDrawTools', function(e) {
		if ($('#morefields_window')[0])
		window.plugin.morefields.process_all_portals();
	});

	window.addHook('portalDetailLoaded', function(e) {
		if ($('#morefields_window')[0])
		window.plugin.morefields.update_portal(e.guid, e.details.title.replace(/\"/g,"\\\""));
	});

	// Loading external lib
	window.plugin.morefields.loadExternals();
};

// PLUGIN END //

setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);