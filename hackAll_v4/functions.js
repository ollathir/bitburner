/** @param {NS} ns */
import {list_open_servers} from "getServers.js";

export function maxRam( ns, homeReserve ) {
	const purchasedServers = list_open_servers(ns);
	var mem = 0;

	for (var purchasedServer of purchasedServers) {
		mem += ns.getServerMaxRam(purchasedServer);
		if (purchasedServer=="home") { mem -= homeReserve; }
	}

	return mem;
}

export function maxTotalThreads( ns, mem, homeReserve ) { // theoretical max
	const purchasedServers = list_open_servers(ns);
	var threads = 0;

	for (var purchasedServer of purchasedServers) {
		var memAvailable = ns.getServerMaxRam(purchasedServer);
		if (purchasedServer=="home") { memAvailable -= homeReserve; }
		threads += Math.floor(memAvailable / mem);
	}

	return threads;
}


export function maxThreads( ns, mem, homeReserve ) { // max available given current server usage
	const purchasedServers = list_open_servers(ns);
	var threads = 0;

	for (var purchasedServer of purchasedServers) {
		var memAvailable = ns.getServerMaxRam(purchasedServer) - ns.getServerUsedRam(purchasedServer);;
		if (purchasedServer=="home") { memAvailable -= homeReserve; }
		threads += Math.floor(memAvailable / mem);
	}

	return threads;
}