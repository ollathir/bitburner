/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	ns.tail();
	var portfolio = 0;
	while (!finished) {
		var player = ns.getPlayer();
		var finished = false;
		var freeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");

		// try to create a gang
		if ( ns.gang.createGang( "Slum Snakes" ) && !ns.gang.inGang() ) {
			ns.exec( "/gangs/gangs.js", "home", 1 );
		} 

		// if over 35bn buy purchase4SMarketDataTixApi() ?
		if ( !player.has4SDataTixApi + player.money > 35000000000 ) {
			ns.exec("/stocks/stocks2.js", "home", 1 ); // script should straight away buy 4S and start stocks3
		}

		// if over 150bn create corp
		if (!ns.getPlayer().hasCorporation) {
			if (ns.exec("/stocks/functions.js", "home", 1, "value") != 0) {
				portfolio = ns.readPort(16);
			} else {
				portfolio = 0;
			}
			if ( (portfolio + player.money) > 170000000000) {
				if (freeRam > ns.getScriptRam("/corp/corp_start.js")) {
					ns.exec("/stocks/functions.js", "home", 1, "sell");
					ns.exec( "/corp/corp_start.js", "home", 1, "start" );
				} else {
					ns.exec( "/singularity/upgradeHome.js", "home", 1, "2048" ); // only doing this upgrade with money in the bank...
				}
			}
		} 

		// if over 100 in main stats, join bladeBurner
		const requiredStat = 100;
		if (!player.inBladeburner && player.strength > requiredStat && player.defense > requiredStat && player.dexterity > requiredStat && player.agility > requiredStat) {
			ns.exec( "/bladeBurner/main.js", "home", 1 );
		} 

		ns.clearLog();
		ns.print( "Gang: " + ns.gang.inGang() );
		if ( !player.hasCorporation ) {
			if ( (player.money + portfolio) > 170000000000) {
				if (freeRam < ns.getScriptRam("/corp/corp_start.js")) {
					ns.print( "Corporation: Not enough RAM to start script" );
				}
			} else {
				ns.print( "Corporation: " + player.hasCorporation );
			}
		} else {
			ns.print( "Corporation: " + player.hasCorporation );
		}

		ns.print( "Bladeburner: " + player.inBladeburner );
		ns.print( "4S Access: " + player.has4SDataTixApi );
		if ( ns.gang.inGang() && player.hasCorporation && player.inBladeburner && player.has4SDataTixApi ) {
			finished = true;
		}

		await ns.sleep(1000);
	}	
}