function scan(ns, parent, server, list) {
    const children = ns.scan(server);
    for (let child of children) {
        if (parent == child) {
            continue;
        }
        list.push(child);      
        scan(ns, server, child, list);
    }
}

export function list_servers(ns) {
    const list = [];
    scan(ns, '', 'home', list);
    return list;
}

export function deploy_hack(ns, hostname ) {
    var i = 0;
    if ( ns.fileExists( "BruteSSH.exe" ) )
		{ns.brutessh( hostname ); i++}
	if ( ns.fileExists( "FTPCrack.exe" ) )
		{ns.ftpcrack( hostname ); i++}
	if ( ns.fileExists( "relaySMTP.exe" ) )
		{ns.relaysmtp( hostname ); i++}
	if ( ns.fileExists( "HTTPWorm.exe" ) )
		{ns.httpworm( hostname ); i++}
	if ( ns.fileExists( "SQLInject.exe" ) )
		{ns.sqlinject( hostname );i++}
    if ( i >= ns.getServerNumPortsRequired(hostname) ) {
        ns.nuke( hostname );        
        if (ns.hasRootAccess(hostname)) 
        { 
            ns.print('${hostname} now open.');
        }
    }  
	return i;
}

/** @param {NS} ns **/
export async function main(ns) {  
	// try to set up hacks on all possible servers. 
    var f = ns.formulas.hacking;
	const servers = list_servers(ns);
    const script = "justhack.js";
    const growWeaken = "growweaken.js";

	servers.push("home");

	ns.tail();
	ns.disableLog("ALL");
	ns.clearLog();

	
	// stop all running processes - probably want to refine this at some point.
	for (const server of servers)
	{
		const processes = ns.ps(server);
		for (var process of processes)
		{
			if (process.filename==script || process.filename==growWeaken) {
				if (!ns.kill(process.pid)) { ns.print( "Failed to kill processes " + process.pid + " on " + server )};
			}
		}
//		if (!ns.killall(server)) { ns.print( "Failed to kill processes on ", server ); }
	}

	const purchasedServers = ns.getPurchasedServers();
	var failed = [];
	var hacked = [];
	var failedRoot = [];
	var gainedRoot = [];
	for (var server of servers)
	{
		if (!ns.hasRootAccess(server)) 
		{
			deploy_hack(ns, server); 
			if (!ns.hasRootAccess(server)) {
				failedRoot.push( server );
			} else {
				gainedRoot.push( server );
			}
		}

		// check here if this is a purchased server...
		if (!ns.getServerMaxMoney(server)==0 || (purchasedServers.indexOf(server)>-1) ) {
			if (!purchasedServers.indexOf(server==-1)) {
				if ( (!ns.hasRootAccess(server)) || (ns.getServerRequiredHackingLevel(server)>ns.getPlayer().hacking) )
				{
					ns.print( `Skipping: ${server} Skill required: ${ns.getServerRequiredHackingLevel(server)} My skill: ${ns.getPlayer().hacking}`);			
				} 
			}
		}
		else if ( server=="w0r1d_d43m0n" ) // exclusion list
		{

		}
		else 
		{
            // # threads required to steal 30% of servers max cash
			if (!ns.fileExists("Formulas.exe"))
			{
	            var hacks = Math.round(ns.getServerMaxMoney(server)/10000000);
			} else {
				var hackPer = f.hackPercent(ns.getServer(server), ns.getPlayer() );
				var hacks = Math.round(0.3 / hackPer);
			}

			if (hacks==0) { hacks = 1; }
			var weakens = Math.round(ns.getServerMaxMoney(server) / 1000000);
			
			if ( ns.exec("main-hack.js", "home", 1, server, hacks, weakens+hacks) > 0 ) {
				hacked.push( server + "(" + hacks + "/" + weakens + ") ");
			} else {
				failed.push( server );
			}
		} 
	}
	ns.print( "Gained root: " + gainedRoot );
	ns.print( "" );
	ns.print( "Failed root: " + failedRoot );
	ns.print( "" );	
	ns.print( "Hacked: " + hacked );
	ns.print( "" );	
	ns.print( "Failed: " + failed );
}
//ns.exec( script, server, runThreadsHack, target