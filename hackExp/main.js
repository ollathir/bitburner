import {printTable, numberWithCommas} from "printTable.js";
import {list_servers, list_open_servers} from "getServers.js";
import {runScript, hackAll} from "functions.js";

var homeReserve = 1000;

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

function convertMSToHHMMSS(ms = 0) {
  if (ms <= 0) {
    return '00:00:00'
  }

  if (!ms) {
    ms = new Date().getTime()
  }

  return new Date(ms).toISOString().substr(11, 8)
}


/** @param {NS} ns */
export async function main(ns) {
	// Script focusing on gaining hacking experience, just hacks and weakens. Does not grow.
    var f = ns.formulas.hacking;
	const servers = list_servers(ns, true);
	const weakenScript = "/hackExp/expPureWeaken.js";
	const hackScript = "/hackExp/expPureHack.js";
	

	servers.push("home");

	const target = "foodnstuff";

	ns.tail();
	ns.disableLog("ALL");
	ns.clearLog();

	if (ns.args[0] == "kill" ) {
		for (var server of servers) {
			var processes = ns.ps(server);
			for (var process of processes) {
				if (process.filename==weakenScript || process.filename==hackScript) {
					ns.kill(process.pid);
				}
			}
		}
		return;
	} else if (!isNaN(ns.args[0])) {
		homeReserve = ns.args[0];
	}

	
	const purchasedServers = list_open_servers(ns, false);
	purchasedServers.push("home");
	// stop all running processes
	for (const server of purchasedServers)
	{	
		var processes = ns.ps(server);
		for (var process of processes) {
			if (process.filename == weakenScript || process.filename == hackScript) {
				ns.kill( process.pid );
			}
		}
	}

	for (var purchasedServer of purchasedServers) {
		{ await ns.scp(weakenScript,purchasedServer);	}
		{ await ns.scp(hackScript,purchasedServer);	}
	}


	while (true)
	{
		ns.clearLog();

	for (var purchasedServer of purchasedServers)
	{
		hackAll(ns);
		var memAvail = ns.getServerMaxRam(purchasedServer)-ns.getServerUsedRam(purchasedServer);
		if (purchasedServer=="home") { memAvail -= homeReserve; }
		var threads = Math.floor(memAvail / (ns.getScriptRam(hackScript)+ns.getScriptRam(weakenScript) ) ); // both scripts are the same memory overhead
		if (threads <2) { continue; }
		if (!ns.fileExists(weakenScript, purchasedServer)) { await ns.scp(weakenScript,purchasedServer);	}
		if (!ns.fileExists(hackScript, purchasedServer)) { await ns.scp(hackScript,purchasedServer);	}
		//await runScript( ns, weakenScript, target, threads );
		//await runScript( ns, hackScript, target, threads );
		ns.exec(weakenScript,purchasedServer,threads,target);
		ns.exec(hackScript,purchasedServer,threads,target);
	}

		var weakenThreads = 0; var weakenExp = 0;
		var hackThreads = 0; var hackXp = 0;
		for (var server of servers)
		{
			var processes = ns.ps(server);
			for (var process of processes)
			{
				if (process.filename==weakenScript) { weakenThreads += process.threads; weakenExp += ns.getScriptExpGain(weakenScript,server,target); }
				if (process.filename==hackScript) { hackThreads += process.threads; hackXp += ns.getScriptExpGain(hackScript,server,target);  }
			}
		}

// ENABLE WHEN HASHES ARE AVAILABLE
        if (ns.hacknet.hashCost("Reduce Minimum Security")< ns.hacknet.numHashes() && ns.getServerMinSecurityLevel(target)>1) {
            ns.hacknet.spendHashes("Reduce Minimum Security", target);
//            ns.print(timeStamp + ": Buying Exchange for Bladeburner SP");
        }		

		ns.print( `Security level: ${ns.getServerMinSecurityLevel(target)}`);
		var table=[["Process", "Target", "Threads", "Time", "Time(ms)", "Exp"]];
		table.push(["Hacking",target, numberWithCommas(hackThreads), convertMSToHHMMSS(ns.getHackTime(target,ns.getPlayer())),ns.nFormat(ns.getHackTime(target,ns.getPlayer()),"0"),ns.nFormat(hackXp,"0.000a")+" /sec"]);
		table.push(["Weaken", target, numberWithCommas(weakenThreads), convertMSToHHMMSS(ns.getWeakenTime(target,ns.getPlayer())), ns.nFormat(ns.getHackTime(target,ns.getPlayer()),"0"), ns.nFormat(weakenExp,"0.000a")+" /sec" ]);
		await printTable( ns, table );

//		ns.print( `Hacking ${target} with ${hackThreads} threads. ${convertMSToHHMMSS(ns.getHackTime(target,ns.getPlayer()))} ${ns.nFormat(ns.getHackTime(target,ns.getPlayer()),"0")}ms XP:${ns.nFormat(hackXp,"0.000a")}/sec`);
//		ns.print( `Weakening ${target} with ${weakenThreads} threads. ${convertMSToHHMMSS(ns.getWeakenTime(target,ns.getPlayer()))} ${ns.nFormat(ns.getHackTime(target,ns.getPlayer()),"0")}ms XP:${ns.nFormat(weakenExp,"0.000a")}/sec`);
		await ns.sleep(1);
	}
}