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
            ns.print(`${hostname} now open.`);
        }
    }  
	return i;
}

/** @param {NS} ns **/
export async function main(ns) {  
	// try to set up hacks on all possible servers. 
    var f = ns.formulas.hacking;
	var tempServers = list_servers(ns);
    const script = "justhack.js";
    const growWeaken = "growweaken.js";
	const justWeaken = "justWeaken.js";

	tempServers.push("home");

	ns.tail();
	ns.disableLog("ALL");
	ns.clearLog();

	if (ns.args[0]=="kill" && ns.args[1]=="all")
	{
		for (const server of tempServers)
		{
			if (server=="home") { continue; } // exclude home
			ns.killall(server);
		}
		return;
	}
	
	// stop all running processes - probably want to refine this at some point.
	for (const server of tempServers)
	{
		const processes = ns.ps(server);
		for (var process of processes)
		{
			if (process.filename==script || process.filename==growWeaken || process.filename==justWeaken) {
				if (!ns.kill(process.pid)) { ns.print( "Failed to kill processes " + process.pid + " on " + server )};
			}
		}
//		if (!ns.killall(server)) { ns.print( "Failed to kill processes on ", server ); }
	}

    // Sort servers by max server cash (lowest first to prioritise easier hacks)
    var len = tempServers.length;
    var bSwap=true;
    while (bSwap)
    {
        bSwap=false;
        for (var i = 1 ; i <= (len-1) ; i++ )
        {
            if ( ns.getServerMaxMoney(tempServers[i-1]) > ns.getServerMaxMoney(tempServers[i]) )
            {
                var tempCurrentTarget=tempServers[i-1];
                tempServers[i-1] = tempServers[i];
                tempServers[i] = tempCurrentTarget;
                bSwap=true;
            }
        }
    }
	const servers = tempServers;	
	ns.print( "Servers in order of max cash: " + servers );


	const purchasedServers = ns.getPurchasedServers();
	var failed = [];
	var hacked = [];
	var failedRoot = [];
	var gainedRoot = [];
	for (var server of servers)
	{
		var log="";
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
		if (ns.getServerMaxMoney(server)==0 || (purchasedServers.indexOf(server)>-1) || !ns.hasRootAccess(server) ||
		ns.getServerRequiredHackingLevel(server)>ns.getPlayer().hacking ) {
			if (!purchasedServers.indexOf(server==-1)) {
				if ( (!ns.hasRootAccess(server)) || (ns.getServerRequiredHackingLevel(server)>ns.getPlayer().hacking) )
				{
					ns.print( `Skipping: ${server} Skill required: ${ns.getServerRequiredHackingLevel(server)} My skill: ${ns.getPlayer().hacking}`);			
				} 
			}
		}
		else if (server=="w0r1d_d43m0n") // exclusion list
		{

		}
		else 
		{
            // # threads required to steal 30% of servers max cash
			if (!ns.fileExists("Formulas.exe"))
			{
	            var hacks = Math.floor(ns.getServerMaxMoney(server)/1000000);
			} else {
				var hackPer = f.hackPercent(ns.getServer(server), ns.getPlayer() );
				var hacks = Math.floor(0.3 / hackPer);
			}

			if (hacks==0) { hacks = 1; }
			var weakens = Math.floor(ns.getServerMaxMoney(server) / 100000);

//			ns.enableLog("ALL");
			
			if ( ns.exec("main-hack.js", "home", 1, server, hacks, weakens+hacks) > 0 ) {
				hacked.push( server + " Max money: " + ns.nFormat(ns.getServerMaxMoney(server),"0.000a") + " (" + hacks + "/" + weakens + ") ");
			} else {
				failed.push( server );
			}

//			ns.disableLog("ALL");
//			log = "Attempting to hack " + server + " Max money: " + ns.getServerMaxMoney( server ) + " Hacks: " + hacks + ""
		} 
	}
	ns.print( "Gained root: " + gainedRoot );
	ns.print( "" );
	ns.print( "Failed root: " + failedRoot );
	ns.print( "" );	
	ns.print( "Hacked: " + hacked );
	ns.print( "" );	
	ns.print( "Failed: " + failed );
	ns.print( `Memory requirements: main-hack.js:${ns.getScriptRam("main-hack.js")} ${growWeaken}:${ns.getScriptRam(growWeaken)} ${script}:${ns.getScriptRam(script)}`);
}
//ns.exec( script, server, runThreadsHack, target