/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	ns.tail();
	ns.clearLog();
	ns.singularity.stopAction();
	var workout = true;
	if (isNaN(ns.args[0])) {
		var cap = 250;
	} else {
		var cap = ns.args[0];
	}
	ns.print( "Running..." );
	while (workout) {
		await raiseStats( ns, cap );
		var me = ns.getPlayer(); 
		if (me.strength >= cap && me.defense >= cap && me.dexterity >= cap && me.agility >= cap)
			{ workout = false; }
		await ns.sleep(5000);
	}
}

async function raiseStats( ns, cap ) {
	var me = ns.getPlayer(); 

	if (me.strength < cap || me.defense < cap || me.dexterity < cap || me.agility < cap) {
		if (ns.getServerMoneyAvailable("home") < 1000000 ) return;

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
	var gym = "powerhouse gym";
	var city = "Sector-12";

	if (stat != "" && !ns.singularity.isBusy() ) {
		ns.print( `Going to the gym to raise ${stat}` );
		await ns.singularity.travelToCity(city);
		ns.singularity.gymWorkout(gym,stat,true);
		
		while ( getPlayerStat(ns, stat) < cap ) {
			await ns.sleep(1000);
		}
		ns.singularity.stopAction();
	}
}