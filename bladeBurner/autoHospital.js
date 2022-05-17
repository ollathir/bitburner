/** @param {NS} ns */
export async function main(ns) {
	while (true)
	{
		var me = ns.getPlayer();
		var curHp = ns.getPlayer().hp
		var maxHp = ns.getPlayer().max_hp

		if (curHp < (maxHp*0.8)) { // less than 80% health
			ns.singularity.hospitalize();
		}

		await ns.sleep(500);
	}
}