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
    list.push('home');
    return list;
}

export async function deploy_hack(ns, server) {
    
}

/** @param {NS} ns **/
export async function main(ns) {
    const args = ns.flags([["help", false]]);
    const target = args._[0];
	
    const script = "weaken.js";
    const servers = list_servers(ns);//.filter(s => ns.hasRootAccess(s)).concat(['home']);
    
    var hacked = 0; var skipped = 0; var threadscount = 0; var failed = 0;
    for(const server of servers) {
        if (ns.hasRootAccess(server)) {
        }
        else {
            const used = ns.getServerUsedRam(server);
            const max = ns.getServerMaxRam(server);
            const hostname = server;
            var i = 0;
            ns.print(`${server} is closed. ${used} GB / ${max} GB (${(100*used/max).toFixed(2)}%)`);
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
              if (ns.hasRootAccess(server)) { 
                ns.print('${server} now open.');
              }
            }
            else {
                skipped++;
            }
        }
        
        // Deploy hack
        const threads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server) ) / ns.getScriptRam( script ) );
        if (threads>0) {
            ns.print(`Launching script '${script}' on server '${server}' with ${threads} threads.`);

            await ns.scp( script, ns.getHostname(), server );
                        ns.exec( script, server, threads, target );
            if (ns.isRunning( script, server, target )) {
                hacked++;
                threadscount = threadscount + threads;
            }
            else {
                failed++;
            }
            
        }
    }
    ns.tprint( `${hacked} servers hacked with ${threadscount} threads. ${skipped} could not be hacked. Hack failed on ${failed} servers.`);
}