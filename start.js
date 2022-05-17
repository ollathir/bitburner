/** @param {NS} ns **/
export async function main(ns) {
	// starts main scripts. currently optimised for bitnode 2

	if (ns.args[0] == "1") {
		// just starting, focus on getting a gang
		ns.exec( "/hacknet/hacknetServer.js", "home", 1, 0 );
		ns.exec( "/singularity/crimeLight.js", "home", 1 );
		// set sleeves to crimes...
		ns.exec( "/singularity/startProgress.js", "home", 1 );
	} else if (ns.args[0]=="2") {
		ns.exec( "/hacknet/hacknetServer.js", "home", 1, 50 );
		ns.exec( "purchaseServerAuto.js", "home", 1, 50 ); // buy purchasedServers using 30% available cash. - need to check whether any have been purchased, otherwise hackall does not run.
	} else if (ns.args[0]=="3") {
		ns.exec( "/hacknet/hacknetServer.js", "home", 1, 0 );
		ns.exec( "purchaseServerAuto.js", "home", 1, 10 ); // buy purchasedServers using 10% available cash. - need to check whether any have been purchased, otherwise hackall does not run.
		if ( ns.getPlayer().has4SDataTixApi ) {
			ns.exec( "/stocks/stocks3.js", "home", 1 );
		} else if ( ns.getPlayer().hasTixApiAccess ) {
			ns.exec( "/stocks/stocks2.js", "home", 1 );
		}
		ns.exec( "/singularity/startProgress.js", "home", 1 );
	} else {
		ns.tprint( "Usage: <stage>" );
		ns.tprint( "1 - hacknetServer no investment, spam crimes to reduce karma, progress checker." );
		ns.tprint( "2 - hacknetServer 50% spend limit, purchasedServer 50% spend limit." );
		ns.tprint( "3 - hacknetServer no investment, purchaseServer 10%, run stocks script.")
		return;
	}

	if (ns.gang.inGang()) {
		ns.exec( "/gangs/gangs.js", "home", 1 ); } 

	if (ns.getPlayer().hasCorporation && freeRam(ns) > 500 ) {
		ns.exec( "/corp/start.js", "home", 1 ); 
	}
	if (freeRam(ns) > 500) {
		ns.exec( "/singularity/tor.js", "home", 1 ); 
	}
	if (ns.getPlayer().inBladeburner && freeRam(ns) > 100 ) {
		ns.exec( "/bladeBurner/main.js", "home", 1 );
	}

	if (freeRam(ns) > 500 ) {
		ns.exec( "/status/status2.js", "home", 1 ); 
	}

//	if (freeRam(ns) < 2000) {
		ns.spawn("/hackAll_v4/main.js" ); 
//	} else {
//		ns.exec("/hackAll_v5/main.js", "home", 1 ); 
//	}
}

function freeRam(ns) {
	return ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
}