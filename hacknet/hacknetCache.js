/** @param {NS} ns */
export async function main(ns) {
	var upgradePossible=true;
	while (upgradePossible) {
		upgradePossible=false;
		for ( var i = 0 ; i < ns.hacknet.numNodes() ; i++ ) {
			if (ns.hacknet.getCacheUpgradeCost( i, 1 ) > 0 ) { upgradePossible = true; }
			if ( ns.hacknet.getCacheUpgradeCost( i, 1) < ns.getPlayer().money ) {
				ns.hacknet.upgradeCache( i, 1 );
			}
		}

		await ns.sleep(100);
	}
}