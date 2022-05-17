import {printTable,convertMSToHHMMSS } from "printTable.js";
import {list_servers, list_hack_servers, list_hack_servers_sorted, list_open_servers, list_hack_servers_sorted_a} from "getServers.js";
import {deploy_hack, hackAll} from "functions.js";

// is there any way to brute force initial growth?

const homeReserverd=1500;
const hackAmt = 0.3;
const minHackChance = 0.5;
const sHack = "pureHack.js";
const sWeaken = "pureWeaken.js";
const sGrow = "pureGrow.js";
const sMonitor = "activity.js";
const weakenFirst=true;
const noloop=false; // should the threads be run indefinately?
	
function maxRam( ns ) {
	const purchasedServers = list_open_servers(ns);
	var mem = 0;

	for (var purchasedServer of purchasedServers) {
		mem += ns.getServerMaxRam(purchasedServer);
		if (purchasedServer=="home") { mem -= homeReserverd; }
	}

	return mem;
}

function maxTotalThreads( ns, mem ) { // theoretical max
	const purchasedServers = list_open_servers(ns);
	var threads = 0;

	for (var purchasedServer of purchasedServers) {
		var memAvailable = ns.getServerMaxRam(purchasedServer);
		if (purchasedServer=="home") { memAvailable -= homeReserverd; }
		threads += Math.floor(memAvailable / mem);
	}

	return threads;
}


function maxThreads( ns, mem ) { // max available given current server usage
	const purchasedServers = list_open_servers(ns);
	var threads = 0;

	for (var purchasedServer of purchasedServers) {
		var memAvailable = ns.getServerMaxRam(purchasedServer) - ns.getServerUsedRam(purchasedServer);;
		if (purchasedServer=="home") { memAvailable -= homeReserverd; }
		threads += Math.floor(memAvailable / mem);
	}

	return threads;
}

function runProcess( ns, sScript, pServ, target, cThreads, threads ) {
	var sMem = ns.getScriptRam( sScript );
	var freeMem = ns.getServerMaxRam(pServ)-ns.getServerUsedRam(pServ); // free RAM	
	if (pServ=="home") { freeMem -= homeReserverd; }

	if (cThreads < threads && threads>0 && !isNaN(threads)) { 
		var threadsToRun = threads - cThreads;
		if (threadsToRun > (Math.floor(freeMem/sMem))) { threadsToRun = Math.floor(freeMem/sMem); }
		if (isNaN(threadsToRun) || threadsToRun<=0) {
			ns.print( sScript + " no threads to run to hack " + target );
		} else {
			if (noloop) {
				if (!ns.exec( sScript, pServ, threadsToRun, target, "noloop" )) { 
					ns.print( sScript + " failed to run on " + target); 
				}
			} else {
				if (!ns.exec( sScript, pServ, threadsToRun, target )) { 
					ns.print( sScript + " failed to run on " + target); 
				}
			}
		}
	}
	return threadsToRun;
}

async function kill_all( ns ) {
	var openServers = list_servers(ns);
	openServers.push("home");
	for (var openServer of openServers) {
		const processes = ns.ps(openServer);
		for (var process of processes) {
			if (process.filename==sHack) { ns.kill(process.pid); }
			if (process.filename==sGrow) { ns.kill(process.pid); }
			if (process.filename==sWeaken) { ns.kill(process.pid); }
		}
	}
}

async function weaken_all( ns ) {
	hackAll(ns);
	var targets = await list_hack_servers_sorted_a(ns, minHackChance); // all servers with cash and > 80% hack chance.
	for (var target of targets) {
		if (ns.getServerSecurityLevel(target) <= (ns.getServerMinSecurityLevel(target)+1)) { continue; }
		var openServers = list_open_servers(ns);
		await kill_all( ns );
		
		var tThreads = 0;
		for (var openServer of openServers) {
			var serverFreeRam = ns.getServerMaxRam(openServer) - ns.getServerUsedRam(openServer);
			if (openServer=="home") { serverFreeRam -= homeReserverd; }
			ns.print( serverFreeRam );
			var threadsToRun = Math.floor ( serverFreeRam / ns.getScriptRam(sWeaken) );
			if (threadsToRun<1) { continue; }
			
			tThreads += threadsToRun;
			if (threadsToRun<5) {
				ns.exec( sWeaken, openServer, 1, target );
				if (threadsToRun >= 1) {
					ns.exec( sGrow, openServer, threadsToRun-1, target ); }
			} else {
				ns.exec( sWeaken, openServer, threadsToRun/5, target );
				ns.exec( sGrow, openServer, (threadsToRun/5)*4, target );
			}
		}

		while ( ns.getServerSecurityLevel(target) > (ns.getServerMinSecurityLevel(target)+1) ) { 
			ns.clearLog();
			var table=[["Server", "Threads", "Cycle Time", "Min Sec", "Cur Sec", "Max Cash", "Cur Cash"]];
			var maxCash = ns.nFormat(ns.getServerMaxMoney(server),"0.000a");
			var curCash = ns.nFormat(ns.getServerMoneyAvailable(server),"0.000a");
			for (var server of targets) {
				if (server==target) {
					var tablerow = [server, tThreads, convertMSToHHMMSS(ns.getWeakenTime(server)), ns.getServerMinSecurityLevel(server), ns.nFormat(ns.getServerSecurityLevel(server),"0.0"), maxCash, curCash];
				} else {
					var tablerow = [server, 0, convertMSToHHMMSS(ns.getWeakenTime(server)), ns.getServerMinSecurityLevel(server), ns.nFormat(ns.getServerSecurityLevel(server),"0."), maxCash, curCash];
				}
				table.push( tablerow );
			}
			printTable( ns, table );
			await ns.sleep(100);
		}
	}
}

async function weaken_all2( ns ) {
	hackAll(ns);
	var targets = await list_hack_servers_sorted_a(ns, minHackChance); // all servers with cash and > 80% hack chance.
	for (var target of targets) {
		if ( (ns.getServerSecurityLevel(target) <= (ns.getServerMinSecurityLevel(target)+1)) && (ns.getServerMoneyAvailable(target) > (ns.getServerMaxMoney(target)*0.9)) ) { continue; }
		var openServers = list_open_servers(ns);
		await kill_all( ns );
		
		while ( (ns.getServerSecurityLevel(target) > (ns.getServerMinSecurityLevel(target)+1)) || (ns.getServerMoneyAvailable(target) <= (ns.getServerMaxMoney(target)*0.9)) ) { 
			var openServers = list_open_servers(ns); 
			for (var openServer of openServers) {
				await ns.scp(sHack, openServer); await ns.scp( sGrow, openServer); await ns.scp(sWeaken, openServer); // copy scripts, not checking if exists in case of update.				
				var serverFreeRam = ns.getServerMaxRam(openServer) - ns.getServerUsedRam(openServer);
				if (openServer=="home") { serverFreeRam -= homeReserverd; }
				var threadsToRun = Math.floor ( serverFreeRam / ns.getScriptRam(sWeaken) );
				if (threadsToRun<1) { continue; }

				var ratio=7;
				if (threadsToRun<ratio) {
					ns.exec( sWeaken, openServer, 1, target );
					if (threadsToRun > 1) {
						ns.exec( sGrow, openServer, threadsToRun-1, target, "noloop" ); }
				} else {
					ns.exec( sWeaken, openServer, Math.floor(threadsToRun/ratio), target, "noloop" );
					ns.exec( sGrow, openServer, Math.floor((threadsToRun/ratio)*(ratio-1)), target, "noloop" );
				}
			}

			var runningServers = list_servers(ns);
			runningServers.push("home");
			var tThreads = 0; var tGrowThreads = 0 ; var tWeakenThreads = 0; var tHackThreads = 0;
			for (var runningServer of runningServers) {
				var processes = ns.ps(runningServer);
				for (var process of processes) {
					if (process.filename==sWeaken) { tWeakenThreads += process.threads; }
					if (process.filename==sGrow) { tGrowThreads += process.threads; }
					if (process.filename==sHack) { tHackThreads += process.threads; }
				}
			}

	
			ns.clearLog();
			ns.print( `Hacking: ${target}`);
			var table=[["Server", "Grow Threads", "Weaken Threads", "Hack Threads", "Cycle Time", "Min Sec", "Cur Sec", "Max Cash", "Cur Cash"]];
			for (var server of targets) {
				var maxCash = ns.nFormat(ns.getServerMaxMoney(server),"0.000a");
				var curCash = ns.nFormat(ns.getServerMoneyAvailable(server),"0.000a");
				if (server==target) {
					var tablerow = [server, tGrowThreads, tWeakenThreads, tHackThreads, convertMSToHHMMSS(ns.getWeakenTime(server)), ns.getServerMinSecurityLevel(server), ns.nFormat(ns.getServerSecurityLevel(server),"0.0"), maxCash, curCash];
				} else {
					var tablerow = [server, 0, 0, 0, convertMSToHHMMSS(ns.getWeakenTime(server)), ns.getServerMinSecurityLevel(server), ns.nFormat(ns.getServerSecurityLevel(server),"0."), maxCash, curCash];
				}
				table.push( tablerow );
			}
			printTable( ns, table );
			await ns.sleep(100);
		}
	}
}


/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	ns.clearLog();
	ns.tail();

	if (weakenFirst && !ns.fileExists("Formulas.exe")) { await weaken_all2(ns); }

	var sHackMem = ns.getScriptRam(sHack);
	var sWeakenMem = ns.getScriptRam(sWeaken);
	var sGrowMem = ns.getScriptRam(sGrow);
	var sHighMem = 0;
	if (sHackMem > sHighMem) { sHighMem = sHackMem; }
	if (sGrowMem > sHighMem) { sHighMem = sGrowMem; }
	if (sWeakenMem > sHighMem) { sHighMem = sWeakenMem; }

	// Kill currently running threads related to hackallv3.js
	var servers = list_servers(ns);
	servers.push("home");
	for (var server of servers) {
		var processes = ns.ps(server);
		for (var process of processes) {
			if (process.filename==sHack) { ns.kill(process.pid); }
			if (process.filename==sGrow) { ns.kill(process.pid); }
			if (process.filename==sWeaken) { ns.kill(process.pid); }
		}
	}

	while (true)
	{
		await hackAll( ns );
		if (ns.getHackingLevel()<=500) {
			var hackServers = await list_hack_servers_sorted_a(ns, minHackChance); // all servers with cash and > 80% hack chance.
		} else {
			var hackServers = await list_hack_servers_sorted(ns, minHackChance); // all servers with cash and > 80% hack chance.
		}
		var table=[];
		var headers=[];
		var isFirst = true;
		var totalThreads = 0;

		const myHack = {target:"", tHack:"", tGrow:"", tWeaken:""};	

		var totalThreadsForAllHacks = 0;
		for (var target of hackServers)
		{
			if (ns.fileExists("Formulas.exe")) {
				var vHackTime = ns.formulas.hacking.hackTime(ns.getServer(target), ns.getPlayer());
				var vGrowTime = ns.formulas.hacking.growTime(ns.getServer(target), ns.getPlayer());
				var vWeakenTime = ns.formulas.hacking.weakenTime(ns.getServer(target), ns.getPlayer());
				// how many threads of each script should be run?

				// how many hacks to hack 30% of server funds?
				var hackPer = ns.formulas.hacking.hackPercent(ns.getServer(target), ns.getPlayer() );
				var hackThreads = Math.floor(hackAmt / hackPer); // number of threads to hack 30% of server
				if (hackThreads==0) { hackThreads=1; }
				var hackSecInc = Math.floor(ns.hackAnalyzeSecurity(hackThreads)); // what will security increase by from the hack?

				// number of threads to grow 30% of server?
//				var vGrowAmountMultiRequired = ((ns.getServerMaxMoney( target )*hackAmt) / ns.getServerMoneyAvailable(target)); 
				var vGrowAmountMultiRequired = ((ns.getServerMaxMoney( target )) / ns.getServerMoneyAvailable(target)); 
				if (vGrowAmountMultiRequired<1) {vGrowAmountMultiRequired=1;}
				var growThreads = Math.floor(ns.growthAnalyze( target, vGrowAmountMultiRequired, 1 ) * 1); // add on x %
				if (growThreads==0) { growThreads=1; }
				var growSecInc = Math.floor(ns.growthAnalyzeSecurity(growThreads)); // what will security increase by from the grow?

				// how many weakens do I need?
				var weakenEffect1 = ns.weakenAnalyze(1,1);
				var secInc = Math.floor(hackSecInc+growSecInc);
				if (secInc==0) { secInc = 1; }
				var weakenThreads = Math.floor(secInc / weakenEffect1);
				if (weakenThreads == 0) { weakenThreads=1; }

				// scale hacks/grows according to the time taken to weaken
				var hacksPerWeaken = Math.floor(vWeakenTime / vHackTime);
				var growsPerWeaken = Math.floor(vWeakenTime / vGrowTime);
				var weakensPerWeaken = 1;
				var tHackThreads = Math.floor(hackThreads / hacksPerWeaken); // how many hacks will run in the time of one weaken
				var tGrowThreads = Math.floor(growThreads / growsPerWeaken); // how many grows will run in the time of one weaken
				var tWeakenThreads = Math.floor(weakenThreads / weakensPerWeaken); // weakens per weaken
				hackThreads = tHackThreads; growThreads = tGrowThreads; weakenThreads = tWeakenThreads;
				totalThreadsForAllHacks += (tGrowThreads + tHackThreads + tWeakenThreads);
			} else {
				// really I need to balance this over the available threads...
				var quickScanServers = await list_hack_servers_sorted_a(ns, minHackChance);
				var totalCashToHack = 0;
				for (var quickScanServer of quickScanServers) {
					totalCashToHack += ns.getServerMaxMoney(quickScanServer);
				}
				var rHack = 4; var rGrow = 16; var rWeaken = 2; // ratio's for hack:grow:weaken
				var threadsPerServer = rHack + rGrow + rWeaken;
				var threadsForServer = Math.floor( ns.getServerMaxMoney(target) / (totalCashToHack / (maxTotalThreads(ns,sHighMem)/threadsPerServer) ));
				if (threadsForServer<1) { threadsForServer = 1; }
				var growThreads = threadsForServer * rGrow;
				var hackThreads = threadsForServer * rHack;
				var weakenThreads = threadsForServer * rWeaken;
				
				var tGrowThreads = growThreads;
				var tHackThreads = hackThreads;
				var tWeakenThreads = weakenThreads;
				vWeakenTime = ns.getWeakenTime(target);
				var vGrowAmountMultiRequired = 1;
				var secInc = 1;
				totalThreadsForAllHacks += (tGrowThreads + tHackThreads + tWeakenThreads);
			}

			// Check what is currently running.
			var purchasedServers = list_open_servers(ns);
			var cHackThreads = 0; var cGrowThreads = 0; var cWeakenThreads = 0;
			for (var purchasedServer of purchasedServers) {
				var processes=ns.ps(purchasedServer);
				for (var process of processes) {
					if (process.filename == sHack && process.args[0] == target) { cHackThreads += process.threads; totalThreads += process.threads; }
					if (process.filename == sGrow && process.args[0] == target) { cGrowThreads += process.threads; totalThreads += process.threads; }
					if (process.filename == sWeaken && process.args[0] == target) { cWeakenThreads += process.threads; totalThreads += process.threads; }
				}
			}

			// Run new processes when required.
			for (var pServ of purchasedServers)
			{
				await ns.scp(sHack, pServ); await ns.scp( sGrow, pServ); await ns.scp(sWeaken, pServ); // copy scripts, not checking if exists in case of update.

				// Should I look to reduce processing here if required? D'uh.. just don't loop the hack/grow/weaken scripts, they expire when done

				var secDelta = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
				if (weakenFirst) {
					if ( (ns.getServerMoneyAvailable(target) > (ns.getServerMaxMoney(target)*(1-hackAmt))) && (secDelta<3) ) {
						hackThreads -= runProcess( ns, sHack, pServ, target, cHackThreads, hackThreads ); }
					if ( secDelta <= 10 ) {
						growThreads -= runProcess( ns, sGrow, pServ, target, cGrowThreads, growThreads ); }
					weakenThreads -= runProcess( ns, sWeaken, pServ, target, cWeakenThreads, weakenThreads );
				} else {
					hackThreads -= runProcess( ns, sHack, pServ, target, cHackThreads, hackThreads ); 
					growThreads -= runProcess( ns, sGrow, pServ, target, cGrowThreads, growThreads );
					weakenThreads -= runProcess( ns, sWeaken, pServ, target, cWeakenThreads, weakenThreads );
				}
			}

			// Status display
			var tableRow=[];
			if (isFirst) {
				headers.push( "Server" ); 
				headers.push( "hackThreads"); 
				headers.push( "growThreads" ); 
				headers.push( "weakenThreads"); 
				headers.push( "Sec Increase"); 
				headers.push( "Cash (Cur/Max)");
				headers.push( "Security (Cur/Min)");
				headers.push( "Cycle Time" );
				headers.push( "Grows / Weaken " );
				headers.push( "Hacks / Weaken");
				isFirst=false;
			}
			tableRow.push( target );
			tableRow.push( tHackThreads + " (" + cHackThreads + ")" );
			tableRow.push( tGrowThreads + " (" + cGrowThreads + ")" );
			tableRow.push( tWeakenThreads + " (" + cWeakenThreads + ")" );
			tableRow.push( secInc );
			tableRow.push( ns.nFormat(ns.getServerMoneyAvailable(target),"0.000a") + "/" + ns.nFormat(ns.getServerMaxMoney(target),"0.000a") + " (" + ns.nFormat(vGrowAmountMultiRequired,"0.000a") + ")" );
			tableRow.push( ns.nFormat(ns.getServerSecurityLevel(target),"0.000") + "/" + ns.nFormat(ns.getServerMinSecurityLevel(target),"0.000")
			+ " (" + ns.nFormat(ns.getServerSecurityLevel(target)-ns.getServerMinSecurityLevel(target),"0.0") + ")" );
			tableRow.push( convertMSToHHMMSS(vWeakenTime) );
			tableRow.push( ns.nFormat(growsPerWeaken, "0.000") ); tableRow.push( ns.nFormat(hacksPerWeaken,"0.000") );
			table.push(tableRow);
		}

		ns.clearLog();
		if (ns.fileExists("Formulas.exe")) {
			ns.print( `Memory requirements: Hack ${sHackMem} Grow ${sGrowMem} Weaken ${sWeakenMem} Highest ${sHighMem} Hacking ${ns.nFormat(hackAmt*100,"0")}% of server funds.` );
		} else {
			ns.print( `Memory requirements: Hack ${sHackMem} Grow ${sGrowMem} Weaken ${sWeakenMem} Highest ${sHighMem}.` );
		}
		ns.print( `Total available Ram: ${maxRam(ns)} allowing ${maxTotalThreads(ns,sHighMem)} threads. Total threads running ${totalThreads}. (Threads Required: ${totalThreadsForAllHacks})`);
		ns.print( "$"+ns.nFormat(ns.getScriptIncome()[0],"0.000a") + '/sec' );
		table.splice(0,0,headers);
		await printTable( ns, table );
		await ns.sleep(10);
	}
}