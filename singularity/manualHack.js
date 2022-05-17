import { list_open_servers, list_hack_servers_sorted }from "getServers.js";
import { convertMSToHHMMSS} from "functions.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.tail();
	ns.disableLog("ALL");
	ns.enableLog("hack");
	while (true) {
	//	ns.clearLog();
		var curServer = ns.singularity.getCurrentServer();
		var server = ns.getServer(curServer);
		if (server.purchasedByPlayer == false && server!="home" ) {
			var player = ns.getPlayer();
		    var timeStamp = convertMSToHHMMSS( (new Date().getTime()) ) + ": ";
			ns.print( timeStamp + `Int ${player.intelligence}` +  `. Hacking.`);
			await ns.singularity.manualHack();
		}
		await ns.sleep(10);
	}
}