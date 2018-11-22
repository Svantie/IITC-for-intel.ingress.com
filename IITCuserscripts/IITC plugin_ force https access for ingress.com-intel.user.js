// ==UserScript==
// @id             force-https@jonatkins
// @name           IITC plugin: force https access for ingress.com/intel
// @category       Tweaks
// @version        0.1.0.20170108.21732
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://static.iitc.me/build/release/plugins/force-https.meta.js
// @downloadURL    https://static.iitc.me/build/release/plugins/force-https.user.js
// @description    [iitc-2017-01-08-021732] Force https access for the intel map. If the intel map is accessed via http, it redirects to the https version.
// @include        https://intel.ingress.com*
// @include        http://intel.ingress.com*
// @match          https://intel.ingress.com*
// @match          http://intel.ingress.com*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==



//NOTE: plugin authors - due to the unique requirements of this plugin, it doesn't use the standard IITC
//plugin architecture. do NOT use it as a template for other plugins


if(window.location.protocol !== 'https:') {
  var redir = window.location.href.replace(/^http:/, 'https:');
  window.location = redir;
  throw('Need to load HTTPS version.');
}
