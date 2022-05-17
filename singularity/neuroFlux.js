/** @param {NS} ns */
export async function main(ns, faction) {

	if (!ns.args[0]) {
		ns.tprint( "Purchases as many NeuroFlux Governor's as possible from specified faction.");
		ns.tprint( "Usage: neuroFlux.js <faction>");
		return;
	} 
	var faction = ns.args[0];

	ns.tail(); ns.clearLog();
	while (true) { 
		var cost = ns.singularity.getAugmentationPrice("NeuroFlux Governor");
		if (cost < ns.getPlayer().money) {
			ns.singularity.purchaseAugmentation(faction, "NeuroFlux Governor");
		}
		await ns.sleep(100);
	}
}