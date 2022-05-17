/** @param {NS} ns */
export async function main(ns) {
	var created=false;
	ns.tail();
	ns.disableLog("ALL");
	while ( !created )
	{
		created = ns.gang.createGang('Slum Snakes');
		ns.clearLog();
		ns.print(`Current Karma level: ${ns.heart.break()}`);
		await ns.sleep(200);
	};
	ns.exec("gangs.js","home",1);
}