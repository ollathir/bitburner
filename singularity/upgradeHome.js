/** @param {NS} ns */
export async function main(ns) {
	var targetMem = 0;
	if ( isNaN(ns.args[0]) ) {
		ns.tprint( "Usage: <desired home server memory>" );
	} else {
		targetMem = ns.args[0];
	}

	while ( (ns.getServerMaxRam("home") < targetMem) && (ns.getPlayer().money > ns.singularity.getUpgradeHomeRamCost()) ) {
		ns.singularity.upgradeHomeRam();
	}
}