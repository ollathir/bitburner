var log=[];

// get all darkweb programs

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	ns.tail();
	ns.clearLog();
	var attempt=0; var allDWProgs = false;
	while (!allDWProgs)
	{
		printLog( ns, true );

		if (!allDWProgs) { allDWProgs = await buyDarkWeb(ns); } // try to buy everything from the darkweb
		upgradeHome(ns); // upgrade RAM on home
ns.print(allDWProgs);
		await ns.sleep(1000);
	}
	ns.print( "All darkweb programs purchased.");
}

function printLog( ns, clearScrn ) {
	if (clearScrn) { ns.clearLog(); }

	ns.print( "Log:" );

	for (var i = (log.length-1) ; i >= (log.length-10) ; i-- ) {
		if (i<=0) {continue;}
		ns.print(log[i]);
	}
}

function upgradeHome(ns) {
	if (ns.getServerMoneyAvailable("home") > ns.singularity.getUpgradeHomeRamCost() ) {
		ns.singularity.upgradeHomeRam();
	}
}

function buyDarkWeb(ns) {
	var playerFunds = ns.getServerMoneyAvailable("home");
	var hasProgram = 0;
	if (playerFunds > 200000) {
		if (!ns.singularity.getCharacterInformation().tor) { 
			ns.singularity.purchaseTor(); 
			log.push( "Purchased Tor router."); 
		}

		const dwProgs = ns.singularity.getDarkwebPrograms();
		for (var dwProg of dwProgs) {
			if (ns.fileExists(dwProg)) {  hasProgram +=1; continue; }
			if (playerFunds > ns.singularity.getDarkwebProgramCost(dwProg)) { 
				ns.singularity.purchaseProgram(dwProg);
				log.push( `Purchased: ${dwProg}.`);
			}
		}
	}
	if (hasProgram == ns.singularity.getDarkwebPrograms().length && ns.getPlayer().tor) {
		return true;
	} else {
		return false;
	}
}