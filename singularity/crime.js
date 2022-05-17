var log=[];

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	ns.tail();
	ns.clearLog();
	var attempt=0; var allDWProgs = false;
	while (true)
	{
		printLog( ns, true );
		// game start, commit crimes.
	//	raiseStats( ns, 20 );
		doCrime(ns );
		await ns.sleep(100);
	}
}

function printLog( ns, clearScrn ) {
	if (clearScrn) { ns.clearLog(); }

	ns.print( "Karma " + ns.heart.break() );
	ns.print( "" );
	ns.print( "Log:" );

	for (var i = (log.length-1) ; i >= (log.length-10) ; i-- ) {
		if (i<=0) {continue;}
		ns.print(log[i]);
	}
}

async function raiseStats( ns, cap ) {
	var me = ns.getPlayer(); 

	if (me.strength < cap || me.defense < cap || me.dexterity < cap || me.agility < cap) {
		if (ns.getServerMoneyAvailable("home") < 100000 ) return;

		var stat = "";
		if (me.strength < cap ) {
			stat = "strength";
		} else if ( me.defense < cap ) {
			stat = "defense";
		} else if (me.dexterity < cap ) { 
			stat = "dexterity";
		} else if (me.agility < cap ) { 
			stat = "agility";
		}
		await doGym( ns, stat, cap );
	}
}

function getPlayerStat( ns, stat )
{
	if (stat == "strength" ) { return ns.getPlayer().strength; }
	if (stat == "defense" ) { return ns.getPlayer().defense; }
	if (stat == "dexterity" ) { return ns.getPlayer().dexterity; }
	if (stat == "agility" ) { return ns.getPlayer().agility; }
}

async function doGym( ns, stat, cap ) {
	var gym = "crush fitness gym";
	var city = "Aevum";

	if (stat != "" && !ns.singularity.isBusy() ) {
		log.push( `Going to the gym to raise ${stat}` );
		ns.singularity.travelToCity(city);
		ns.singularity.gymWorkout(gym,stat,true);
		while ( getPlayerStat(ns, stat) <= cap ) {
			await ns.sleep(1000);
		}
		ns.singularity.stopAction();
	}
}

function doCrime( ns ) {
	if (ns.singularity.isBusy()) { return; }

	var crimeName = "";
	if (ns.singularity.getCrimeChance("homicide")>0.44) { // homicide = 1 karma / second. best gain.
		crimeName = "homicide";
	} else if (ns.singularity.getCrimeChance("mug someone")>0.4) {
		crimeName = "mug someone";
	} else {
		crimeName = "rob store";
	}

	if (crimeName != "") {
		ns.singularity.commitCrime(crimeName);
		var crimeMoney = ns.nFormat( ns.singularity.getCrimeStats(crimeName).money, "0.000a");
		log.push( `Attempting ${crimeName} (${ns.nFormat(ns.singularity.getCrimeChance(crimeName)*100,"0.00")}% chance of success for ${crimeMoney})`);
	}
}