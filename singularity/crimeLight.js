/** @param {NS} ns */
export async function main(ns) {
	while (!ns.gang.inGang()) {
		ns.tail(); // keeping the log popping as otherwise very hard to shut down.
		if (!ns.singularity.isBusy()) { 
			var player = ns.getPlayer();
			if (player.dexterity < 20) {
				ns.singularity.commitCrime("rob store");
			} else if (player.dexterity < 80) {
				ns.singularity.commitCrime("traffick illegal arms");
			} else {
				ns.singularity.commitCrime("homicide");
			}
		}

		await ns.sleep(100);
	}
}