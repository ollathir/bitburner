import {list_servers, list_open_servers, serverPath} from "getServers.js"; 

export function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function currentTimeInHHMMSS() {
  return convertMSToHHMMSS(new Date().getTime() );
}

export function currentTimeInMS() {
    return( new Date().getTime() );
}

export function timeStamp() {
	return (currentTimeInHHMMSS() + ": ");
}


export function convertMSToHHMMSS(ms = 0) {
  if (ms <= 0) {
    return '00:00:00'
  }

  if (!ms) {
    ms = new Date().getTime()
  }

  return new Date(ms).toISOString().substr(11, 8)
}

export function formatMem( mem ) {
	if ( mem < 1000 ) {
		return (Math.round(mem*100)/100) + " GB";
	} else if ( mem < 1000000 ) {
		return (Math.round(mem/10)/100) + " TB";
	} else {
		return (Math.round(mem/100)/10000) + " PB";
	}
}

export function deployHack( ns, hostname ) {
	deploy_hack( ns, hostname );
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

export function nf( number ) {
    var result = 0; var abbr = "";
    if (number >= 1e24) {
        result = ((Math.round((number/1e21))/1000));
        abbr = "S";
    } else if (number >= 1e21) {
        result = ((Math.round((number/1e18))/1000));
        abbr = "s";
    } else if (number >= 1e18) {
        result = ((Math.round((number/1e15))/1000));
        abbr = "Q";
    } else if (number >= 1e15) {
        result = ((Math.round((number/1e12))/1000));
        abbr = "q";
    } else if (number >= 1e12) {
        result = ((Math.round((number/1e9))/1000));
        abbr = "t";
    } else if (number >= 1e9) {
        result = ((Math.round((number/1e6))/1000));
        abbr = "b";
    } else if (number >= 1e6) {
        result = ((Math.round(number/1e3)/1000));
        abbr = "m";
    } else if (number >= 1e3) {
        result = ((Math.round((number/1))/1000));
        abbr = "k";
    } else {
        result = (Math.round(number*1000)/1000);
        abbr = "";
    }
/*    var len = result.toString().length;
    var pos = result.toString().indexOf(".");
    if (pos==-1) { pos = 2; result = result.toString() + "."; }
    var repeat = 3-len-pos;
    if (repeat<1) {
        result = result + abbr;
    } else {
        result = result + "0".repeat(3-(len-pos)) + abbr;
    }*/
    return result.toFixed(3) + abbr;
}


export async function installBackdoors( ns ) {
	const servers = list_open_servers(ns);
	for (var server of servers) {
		if (ns.getServer(server).purchasedByPlayer) { continue; }
		if (!ns.getServer(server).backdoorInstalled && ns.getServerRequiredHackingLevel(server)<=ns.getPlayer().hacking) {
			ns.print( 'Attempting to install backdoor on ' + server );
			await backdoorServer(ns, server);
		}
	}
}

export async function backdoorServer(ns, victim) {
    let pathToVictim = [];
    ns.disableLog('scan');      // don't log the 'scan()' calls from 'serverPath()'

    // Try to get a path to the victim server, and if that's successful, install
    // a backdoor on it
    if (serverPath(ns, '', ns.getCurrentServer(), victim, pathToVictim)) {
        // Got a path from 'here' to 'there'
        // Step through the path, connecting to each server along the path
        // until the victim server is reached
        for (const i in pathToVictim) {
            if (i > 0) { // Don't connect to the current server, we're already here
                ns.connect(pathToVictim[i]); // next server in the chain
            }
        } // navigate to the victim server

        // Inform the user that the server backdoor operation is staring on the victim
        ns.toast(`Installing backdoor on ${victim}`, 'info', 10000);
        await ns.installBackdoor();     // Install the backdoor

        // Now navigate back to where we started by walking the path backward
        let pathEnd = pathToVictim.length - 1;
        for (const i in pathToVictim) {
            if (i > 0) { // don't connect to the current server node
                ns.connect(pathToVictim[pathEnd - i]);
            }
        } // navigate back to the starting server

        // Post a sticy toast so the user knows that the victim server has been backdoored
        ns.toast(`Installed backdoor on ${pathToVictim[pathToVictim.length - 1]}`, 'success', null);
    } // path to victim server found
    
    ns.enableLog('scan');  // Allow 'scan()' to be logged again
} // end of backdoorServer()

export function hackAll( ns )
{
	const servers = list_servers(ns);
	for (var server of servers)
	{
		if (!ns.hasRootAccess(server)) {
			deploy_hack(ns,server);
		}
	}
}

export function fmt( i )
{
	if ( !isNaN(i) ) {
		if (isFinite(i)) {
			i = Math.round( i * 10000 ) / 10000;
		} else {
			i = -1;
		}
	
	}
	return i;
}

export async function runScript( ns, sScript, target, threads ) { 
	// ns, script to run, target server, number of threads to try to run over all open servers
	// returns number of threads of script with target running across network
	var scriptMem = ns.getScriptRam(sScript);

	// check how many threads are currently running...
	var openServers = list_servers( ns );
	openServers.push("home");
	var runningThreads = 0;
	for (var openServer of openServers) {
		var processes = ns.ps(openServer);
		for (var process of processes) {
			if (process.filename == sScript && process.args[0] == target) { 
				runningThreads += process.threads;
			}
		}	
	}

	var openServers = list_open_servers( ns );
	if (sScript=="pureWeaken.js") { // prefer to run weaken on home as has more cores later in the bitnode.
		openServers.unshift( "home" );
	} else {
		openServers.push( "home" );
	}
	// try to run script on all servers until threads is reached.
	for (var openServer of openServers)
	{
		// make certain script is on the server, if not then copy.
		if (!ns.fileExists(sScript, openServer)) { await ns.scp( sScript, openServer); }

		// are enough threads already running?
		if (runningThreads >= threads) { continue; }

		// how many threads can be run on this server?
		var freeRam = ns.getServerMaxRam(openServer) - ns.getServerUsedRam(openServer);
		if (openServer=="home") {
			if (typeof homeReservered!=='undefined') { 
				freeRam -= homeReserverd; // if home, knock off reserve
			} else {
				freeRam -= 16; // default reserve
			}
		}

		// not enough free ram, skip. 
		if (freeRam < scriptMem) { continue; } 

		// number of threads which can be run on this server.
		var threadsToRun = Math.floor( freeRam / scriptMem ); 

		// is this more than the number of threads remaining to be run? If so, reduce.
		if ((threadsToRun + runningThreads) > threads ) { threadsToRun = threads - runningThreads; }

		// run the script, if sucessful add on to running threads.
		if (ns.exec( sScript, openServer, threadsToRun, target, "noloop" )) { runningThreads += threadsToRun; }
	}
	return runningThreads;
}

export function findBox( title ) {
    const doc = eval("document");
    var sb = doc.querySelector( ".sb" );
    if (!sb) { return null; }

    var i=0; // catchall to prevent infinite loop
    var sibling = sb.querySelector( ".box" );
    while (sibling && i < 20) {
        if (sibling) {
            var head = sibling.querySelector( ".title" );
            if (head.innerHTML==title) { 
                return sibling;
            }
        } 
        i++;
        sibling = sibling.nextSibling;
    }
    return null;
}