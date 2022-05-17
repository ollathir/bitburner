/** @param {NS} ns */

import {list_servers} from "getServers.js";

export async function main(ns) {
	ns.tail();
	ns.disableLog("ALL");
	ns.clearLog();
	var servers = list_servers(ns);
	for (var server of servers) {
		var dir = ns.ls( server, "cct" );
		for ( var i = 0 ; i < dir.length ; i++ ) {
			ns.print( server + "/" + dir[i] );
		}
	}
}