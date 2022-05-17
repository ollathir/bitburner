/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	while (true) {
		ns.tail(); 
		if (!ns.singularity.isBusy()) {
			if (ns.getPlayer().dexterity > 80 && ns.getPlayer().agility > 80) {
				ns.singularity.commitCrime("homicide");
			} else {
				ns.singularity.commitCrime("traffick illegal arms");
			}
		}

		await ns.sleep(100);
	}
}