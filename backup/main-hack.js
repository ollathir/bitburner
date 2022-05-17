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

export function deploy_hack(ns, hostname, skipped ) {
    var i = 0;
//    ns.print(`${hostname} is closed. ${used} GB / ${max} GB (${(100*used/max).toFixed(2)}%)`);
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
    skipped++;
    return skipped; 
}

/** @param {NS} ns **/
export async function main(ns) {
    const args = ns.flags([["help", false]]);
    const target = args._[0];
    const debug=0;
    const homeReserverd = 16;

    const script = "justhack.js";
    const growWeaken = "growweaken.js";
    const monitor = "activity.js";
    var servers = list_servers(ns); 
   // servers.push( 'home' );
    const purchasedServers = ns.getPurchasedServers();
    purchasedServers.push( 'home' );

    if ( ns.args[0]=="help") {
        ns.tprint( 'Program runs two scripts accross all available servers. ');
        ns.tprint( 'justhack.js - Loop hacks targetted server.' );
        ns.tprint( 'growweaken.js - Weakens and Grows targetted server (does not hack).');
        ns.tprint( "Usage: ");
        ns.tprint( `run ${ns.getScriptName()} kill all - terminated all running scripts on all servers.`);
        ns.tprint( `run ${ns.getScriptName()} <server to hack> <threads to use for hacking> <total threads for both scripts>.`);
        ns.tprint( 'if threads to use for hacking is blank, defaults to 200. total threads defaults to all available.')
        return;
    }

    if ( ns.args[0]=="kill" && ns.args[1]=="all")
    {
        for (const server of servers)
        {
            ns.killall(server);
        }
        return;
    }

    var hackMax = 200;
    // Max number of threads to use for hack(), others will only be used for grow() and weaken()
    if ( !isNaN(ns.args[1]) )
    {
        hackMax = ns.args[1];
    }
    //ns.tprint( hackMax );
    var maxThreads = -1;
    if ( !isNaN(ns.args[2]))
    {
        maxThreads = ns.args[2];
    } 
    


    // Check for root access, hack if not present and when able copy script & growWeaken
    var skipped = 0; 
    for (var server of servers) {
        // hack server
        if (!ns.hasRootAccess(server)) {
            skipped = deploy_hack( ns, server, skipped );
        }
        if (ns.hasRootAccess(server)) { // hopefully now hacked, copy our files.
            //if (!ns.fileExists(growWeaken, server)) { // disabled checks in case of file updates.
                await ns.scp( growWeaken, 'home', server );
            //}
            //if (!ns.fileExists(script, server )) {
                await ns.scp( script, 'home', server );
            //}
        }
    }

    // hack up to hackMax, growWeaken up to (maxThreads-hackMax) if maxThreads is -1 then run everywhere possible.
    var weakenMax = maxThreads-hackMax;
    var currentHacked = 0; var currentWeaken = 0;
    // memory required for a single thread of each of our scripts.
    var scriptMem = ns.getScriptRam(script); var growWeakenMem = ns.getScriptRam( growWeaken );
    if (debug==1) {
        ns.tprint( `${script} requires ${scriptMem}. ${growWeaken} requires ${growWeakenMem}`); }

    // run a monitor
    if (!ns.isRunning(monitor, "home")) {
        if (ns.getScriptRam(monitor)<= (ns.getServerMaxRam("home")-ns.getServerUsedRam("home"))) {
            ns.exec( monitor, "home", 1 ); }
    }



    for (var server of servers) {
        if (!ns.hasRootAccess(server)) { continue; } // skip if we do not have root access

        // how many threads can we run of each script?
        var freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        if (server=='home') 
        {
            freeRam = ns.getServerMaxRam('home') - ns.getServerUsedRam('home') - homeReserverd;
//            ns.tprint( "[home]: Available: " + ns.getServerMaxRam(server) + " Used: " + ns.getServerUsedRam(server) + " Allocated: " + freeRam + " allocated (" + homeReserverd + " reserved)");
        }
//        ns.tprint( server, ": ", freeRam );

        var posThreadsHack = Math.floor(freeRam/scriptMem);
        var posThreadsWeaken = Math.floor(freeRam/growWeakenMem);
        var runThreadsHack = 0;
        var runThreadsWeaken = 0;


        // hack to the max
        runThreadsHack = posThreadsHack;
        if ( (currentHacked + runThreadsHack) > hackMax ) { // will we run too many threads if running maximum?
            runThreadsHack = hackMax - currentHacked;
            freeRam = freeRam - (scriptMem * runThreadsHack); // memory left after threads we will use for hack
            posThreadsWeaken = Math.floor(freeRam/growWeakenMem); // update threads we can use for Weaken
        }
        
        // weaken to the max
        var runThreadsWeaken = posThreadsWeaken;
        if ( maxThreads != -1 ) { // if hackMax is -1 then run to the maximum
            if ( (currentWeaken + runThreadsWeaken) > weakenMax ) { // will we run too many threads if running maximum?
                runThreadsWeaken = weakenMax - currentWeaken; // so how many do we wish to run?
            }
        }

        // we should now have numbers of threads to run for each of the scripts
        if (runThreadsHack > 0) {
            if (ns.exec( script, server, runThreadsHack, target )>0) {
                currentHacked = currentHacked + runThreadsHack; }
        }
        if (runThreadsWeaken > 0 ) {
            if (ns.exec( growWeaken, server, runThreadsWeaken, target )>0) {
                currentWeaken = currentWeaken + runThreadsWeaken; }
        }
                
        if ((runThreadsHack>0 || runThreadsWeaken>0) && debug==1){
            ns.print( `Hacking: ${server} Free Ram: ${ns.nFormat(ns.getServerMaxRam(server)-ns.getServerUsedRam(server),"0.0")} Threads: Hack: ${runThreadsHack} Weaken: ${runThreadsWeaken}`);
        }
    }
    ns.print( `Hacking ${target} Successful threads: Hack: ${currentHacked}/${hackMax} Weaken: ${currentWeaken}/${weakenMax}`);

}