/** @param {NS} ns */
export async function main(ns) {
	if (!ns.getPlayer().hasCorporation)  {
			ns.exec( "/corp/corp_start.js", "home", 1 ); 
	} else {
		var corp = ns.corporation.getCorporation();
		if (corp.divisions.length < 2) {
			ns.exec( "/corp/corp_start.js", "home", 1 ); 
		} else {
			ns.exec( "/corp/corp_mid.js", "home", 1 ); 
		}
	}
}