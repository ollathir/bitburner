import {printTable,convertMSToHHMMSS } from "printTable.js";
import {list_servers, list_hack_servers, list_hack_servers_sorted, list_open_servers, list_hack_servers_sorted_a} from "getServers.js";
import {deploy_hack, hackAll, installBackdoors} from "functions.js";

// is there any way to brute force initial growth?

const homeReserverd=32;
const hackAmt = 0.3;
const minHackChance = 0.7;
const iBackdoor=false;
const sHack = "pureHack.js";
const sWeaken = "pureWeaken.js";
const sGrow = "pureGrow.js";
const sMonitor = "activity.js";
const weakenFirst=false;
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

async function runScript( ns, sScript, target, threads ) { 
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
	if (sScript==sWeaken) { // prefer to run weaken on home as has more cores later in the bitnode.
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
		if (openServer=="home") { freeRam -= homeReserverd; } // if home, knock off reserve

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

	await hackAll(ns);
	if (iBackdoor) {
		await installBackdoors(ns);
	}

	// memory requirements
	var sHackMem = ns.getScriptRam(sHack);
	var sWeakenMem = ns.getScriptRam(sWeaken);
	var sGrowMem = ns.getScriptRam(sGrow);
	var sHighMem = 0;
	if (sHackMem > sHighMem) { sHighMem = sHackMem; }
	if (sGrowMem > sHighMem) { sHighMem = sGrowMem; }
	if (sWeakenMem > sHighMem) { sHighMem = sWeakenMem; }

	// Kill currently running threads related to hackallv4.js
	kill_all(ns);
	if (ns.args[0]=="kill") return;

	//  main loop
	while (true)
	{
		await hackAll( ns ); // try to open all servers.

		var hackServers = await list_hack_servers_sorted_a(ns, minHackChance); // all servers with cash and > 80% hack chance.

		var table=[];
		var headers=[];
		var isFirst = true;
		var totalThreads = 0;

		var totalThreadsForAllHacks = 0;
		for (var target of hackServers)
		{
			if (ns.getServerRequiredHackingLevel(target)>ns.getPlayer().hacking) { continue; } // check that we are able to hack this server.
			
			if (ns.fileExists("Formulas.exe")) {
		// set up with Formulas.exe
				// time for each process.
				var vHackTime = ns.formulas.hacking.hackTime(ns.getServer(target), ns.getPlayer());
				var vGrowTime = ns.formulas.hacking.growTime(ns.getServer(target), ns.getPlayer());
				var vWeakenTime = ns.formulas.hacking.weakenTime(ns.getServer(target), ns.getPlayer());

			// how many threads of each script should be run?
				// how many hacks to hack 30% of server funds?
				// how many hacks required to hack server down to 100%-hackAmt funds (e.g. hackAmt set to 0.3 we hack the server down to 70%)
				var hackPercentagePerThread = ns.formulas.hacking.hackPercent(ns.getServer(target), ns.getPlayer() ); // one thread steals x % of server funds.
				var serverCurFunds = ns.getServerMoneyAvailable(target); var serverMaxFunds = ns.getServerMaxMoney(target); 
				var desiredFundsAfterHack = serverMaxFunds*(1-hackAmt);
				var desiredHackAmt = serverMaxFunds*(hackAmt);
				var fundsToHack = serverCurFunds - desiredHackAmt;
				if (fundsToHack>0) { // server does have enough money
					// what percentage of available funds is this?
					var percentageFundsToHack = fundsToHack / serverCurFunds;
					hackThreads = Math.floor( percentageFundsToHack / hackPercentagePerThread );
				} else { // server does not have enough money
					hackThreads = 0;
				}
				var hackSecInc = Math.floor(ns.hackAnalyzeSecurity(hackThreads)); // what will security increase by from the hack?

				// number of threads to grow hackAmt of server? 
				if ( (ns.getServerMoneyAvailable( target ) - (ns.getServerMaxMoney(target)*hackAmt)) < 1 ) { // if a 30% hack from max will reduce below 0 then hacks will not be running
					var vGrowAmountMultiRequired = ns.getServerMaxMoney( target ) / ( ns.getServerMoneyAvailable(target) );
				} else { // growth for funds as currently stand plus projected 30% of max hack
					var vGrowAmountMultiRequired = ns.getServerMaxMoney( target ) / ( (ns.getServerMoneyAvailable( target ) - (ns.getServerMaxMoney(target)*hackAmt)) ); 
				}
				if (vGrowAmountMultiRequired<1) {vGrowAmountMultiRequired=1;}
				var growThreads = Math.floor( ns.growthAnalyze( target, vGrowAmountMultiRequired, 1 ) ); // number of threads needed to grow server by multiplier
				if (growThreads<1) { growThreads=1; }
				var growSecInc = Math.floor(ns.growthAnalyzeSecurity(growThreads)); // what will security increase by from the grow?

				// how many weakens do I need?
				var weakenEffect1 = ns.weakenAnalyze(1,1);
				var secInc = Math.floor(hackSecInc+growSecInc);
				if (secInc==0) { secInc = 1; }
				var weakenThreads = Math.floor(secInc / weakenEffect1);
				if (weakenThreads == 0) { weakenThreads=1; }
				if (!isFinite(weakenThreads)) { weakenThreads = 1000; } // catch all

				// scale hacks/grows according to the time taken to weaken
				var hacksPerWeaken = (vWeakenTime / vHackTime); // trying this without floor/ceil
				var growsPerWeaken = (vWeakenTime / vGrowTime);
				var weakensPerWeaken = 1;
				var tHackThreads = Math.floor(hackThreads / hacksPerWeaken); // how many hacks will run in the time of one weaken
				var tGrowThreads = Math.floor(growThreads / growsPerWeaken); // how many grows will run in the time of one weaken
				var tWeakenThreads = Math.floor(weakenThreads / weakensPerWeaken); // weakens per weaken
				hackThreads = tHackThreads; growThreads = tGrowThreads; weakenThreads = tWeakenThreads;
				totalThreadsForAllHacks += (tGrowThreads + tHackThreads + tWeakenThreads);
			} else {
		// set up before Formulas.exe is available
				// really I need to balance this over the available threads...
				var quickScanServers = await list_hack_servers_sorted_a(ns, minHackChance);
				var mtt = maxTotalThreads(ns,sHighMem);
				var max = quickScanServers.length;
/*				if ( mtt < 200 ) { 
					max = 1;
				} else if (mtt < 400 ) { 
					max = 2;
				} else if (mtt < 600 ) { 
					max = 3;
				}*/

				var totalCashToHack = 0;
//				for (var quickScanServer of quickScanServers) {
//					totalCashToHack += ns.getServerMaxMoney(quickScanServer);
				for (var i = 0 ; i < max ; i++ ) {
					totalCashToHack += ns.getServerMaxMoney(quickScanServers[i]);
				}

				var rHack = 1; var rGrow = 8; var rWeaken = 2; // ratio's for hack:grow:weaken
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


		// run hack / grow / weaken
			var runningHackThreads = 0; var runningGrowThreads = 0; var runningWeakenThreads = 0; // threads running
			var secDelta = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);

			if (secDelta > 10 ) { hackThreads = 0; } // throttle hacking is security delta is too high
			if ( ns.getServerMoneyAvailable(target) < (ns.getServerMaxMoney(target)*0.7) ) { hackThreads = 0; }
			runningHackThreads = await runScript( ns, sHack, target, hackThreads ); 

			if (secDelta > 10 ) { growThreads = 0; } // throttle growth if security delta is too high
			runningGrowThreads = await runScript( ns, sGrow, target, growThreads );

			runningWeakenThreads = await runScript( ns, sWeaken, target, weakenThreads );

			totalThreads += runningHackThreads + runningGrowThreads + runningWeakenThreads;


		// Status display
			var tableRow=[];
			if (isFirst) {
				headers.push( "Server" ); 
				headers.push( "hackThreads"); 
				headers.push( "growThreads" ); 
				headers.push( "weakenThreads"); 
				headers.push( "Hack chance"); 
				headers.push( "Cash (Cur/Max)");
				headers.push( "Security (Cur/Min)");
				headers.push( "Cycle Time" );
				if (ns.fileExists("Formulas.exe")) {
					headers.push( "H    : G    : W");
				}
				headers.push( "Backdoor");
				isFirst=false;
			}
			tableRow.push( target );
			tableRow.push( tHackThreads + " (" + runningHackThreads + ")" );
			tableRow.push( tGrowThreads + " (" + runningGrowThreads + ")" );
			tableRow.push( tWeakenThreads + " (" + runningWeakenThreads + ")" );
			tableRow.push( ns.nFormat(ns.hackAnalyzeChance( target )*100, "0") + "%" );
			tableRow.push( ns.nFormat(ns.getServerMoneyAvailable(target),"0.000a") + "/" + ns.nFormat(ns.getServerMaxMoney(target),"0.000a") + " (" + ns.nFormat(vGrowAmountMultiRequired,"0.000a") + ")" );
			tableRow.push( ns.nFormat(ns.getServerSecurityLevel(target),"0.000") + "/" + ns.nFormat(ns.getServerMinSecurityLevel(target),"0.000")
			+ " (" + ns.nFormat(ns.getServerSecurityLevel(target)-ns.getServerMinSecurityLevel(target),"0.0") + ")" );
			tableRow.push( convertMSToHHMMSS(vWeakenTime) );
			if (ns.fileExists("Formulas.exe")) {
				tableRow.push( ns.nFormat(hacksPerWeaken,"0.00") + " : " + ns.nFormat(growsPerWeaken,"0.00") + " : 1" );
			}
			tableRow.push( ns.getServer(target).backdoorInstalled );
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