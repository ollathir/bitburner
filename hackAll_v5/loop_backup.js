/** @param {NS} ns */
import {list_servers, list_open_servers} from "getServers.js";
import {printTable, convertMSToHHMMSS} from "printTable.js";

var hackAmt = 0.5;


function calculateThreads( ns, target ) {
    var threads = {
        hackThreads : 0,
        growThreads : 0,
        weakenThreads : 0,
	}

	// thread calculations
	var hackPercentagePerThread = ns.formulas.hacking.hackPercent(ns.getServer(target), ns.getPlayer() ); // one thread steals x % of server funds.
	var serverCurFunds = ns.getServerMoneyAvailable(target); 
	var serverMaxFunds = ns.getServerMaxMoney(target); 
	var desiredHackAmt = serverMaxFunds*(hackAmt);
	var fundsToHack = serverCurFunds - desiredHackAmt;
	if (fundsToHack>0) { // server does have enough money
		// what percentage of available funds is this?
		var percentageFundsToHack = fundsToHack / serverCurFunds;
		threads.hackThreads = Math.floor( percentageFundsToHack / hackPercentagePerThread );
	} else { // server does not have enough money
		threads.hackThreads = 0;
	}
	var hackSecInc = Math.ceil(ns.hackAnalyzeSecurity(threads.hackThreads)); // what will security increase by from the hack?

	// number of threads to grow hackAmt of server? 
	if ( (ns.getServerMoneyAvailable( target ) - (ns.getServerMaxMoney(target)*hackAmt)) < 1 ) { // if a 30% hack from max will reduce below 0 then hacks will not be running
		var vGrowAmountMultiRequired = ns.getServerMaxMoney( target ) / ( ns.getServerMoneyAvailable(target) );
	} else { // growth for funds as currently stand plus projected 30% of max hack
		var vGrowAmountMultiRequired = ns.getServerMaxMoney( target ) / ( (ns.getServerMoneyAvailable( target ) - (ns.getServerMaxMoney(target)*hackAmt)) ); 
	}
	if (vGrowAmountMultiRequired<1) {vGrowAmountMultiRequired=1;}
	threads.growThreads = Math.ceil( ns.growthAnalyze( target, vGrowAmountMultiRequired, 1 ) ); // number of threads needed to grow server by multiplier
	if (threads.growThreads<1) { threads.growThreads=1; }
	var growSecInc = Math.floor(ns.growthAnalyzeSecurity(threads.growThreads)); // what will security increase by from the grow?

	// how many weakens do I need?
	var weakenEffect1 = ns.weakenAnalyze(1,1);
	var secInc = hackSecInc+growSecInc;
	if (secInc<0) { secInc = 1; }
	threads.weakenThreads = Math.ceil(secInc / weakenEffect1);
	if (threads.weakenThreads < 1) { threads.weakenThreads=1; }
	if (!isFinite(threads.weakenThreads)) { threads.weakenThreads = 1000; } // catch all

	return threads;
}


export async function main(ns) {
//	ns.tail();
	ns.disableLog("sleep");
	ns.disableLog("scan");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("getServerMaxRam");
	ns.clearLog();
	// time for each function to run.
	var target = ns.args[0];
	var player = ns.getPlayer();
	var tick = ns.args[1];

	var hackThreads=1; var growThreads=1; var weakenThreads=1;

	var threads = calculateThreads( ns, target );

	ns.print( `Threads: H ${threads.hackThreads} G ${threads.growThreads} W ${threads.weakenThreads}`)
	

	// execution times
	var sTarget = ns.getServer(target);
	var tHack = ns.formulas.hacking.hackTime(sTarget,player);
	var tGrow = ns.formulas.hacking.growTime(sTarget,player);
	var tWeaken = ns.formulas.hacking.weakenTime(sTarget,player);


	// try this as time stamps at which point the script should be run?
	var curTime = ns.getTimeSinceLastAug();
	var timeToHack = curTime + tWeaken - tHack - 2000;
	var timeToGrow = curTime + tWeaken - tGrow - 1000;

    ns.print( `curTime: ${convertMSToHHMMSS(curTime)} Start time: hackTime ${convertMSToHHMMSS(timeToHack)} growTime ${convertMSToHHMMSS(timeToGrow)} `);
	ns.print( `Execution times: tHack ${convertMSToHHMMSS(tHack)} tGrow ${convertMSToHHMMSS(tGrow)} tWeaken ${convertMSToHHMMSS(tWeaken)}`);
	ns.print( `Time to run scripts H:${convertMSToHHMMSS(tHack)} G:${convertMSToHHMMSS(tGrow)} W:${convertMSToHHMMSS(tWeaken)}`);
	ns.print( `Finish at: H: ${convertMSToHHMMSS(timeToHack+tHack)} G: ${convertMSToHHMMSS(timeToGrow+tGrow)} W: ${convertMSToHHMMSS(curTime+tWeaken)}`);

	await runScript( ns, "/hackAll_v5/weaken.js", target, threads.weakenThreads, tick);
	var hackRun = false; var growRun = false;
	while ( !hackRun || !growRun) {
		curTime = ns.getTimeSinceLastAug();

		var curFundsPercentage = ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target);
		var secDelta = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
	
		if ((timeToHack <= curTime && !hackRun) && (curFundsPercentage > 0.7 ) ) {
			await runScript( ns, "/hackAll_v5/hack.js", target, threads.hackThreads, tick);
			hackRun = true;
		}
		if ( (timeToGrow <= curTime && !growRun) && ( secDelta < 5 ) ) {
			await runScript( ns, "/hackAll_v5/grow.js", target, threads.growThreads, tick);
			growRun = true;
		//	ns.tprint( "running grow " + tick );
		}
		await ns.sleep(10);
	}
	await ns.sleep(2000);
}

export async function runScript( ns, sScript, target, threads, tick ) { 
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
			if (process.filename == sScript && process.args[0] == target && process.args[1]==tick) { 
				runningThreads += process.threads;
			}
		}	
	}

	var openServers = list_open_servers( ns );
	openServers.push( "home" );

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
		if (ns.exec( sScript, openServer, threadsToRun, target, tick )) { runningThreads += threadsToRun; }
	}
	return runningThreads;
}

/*
	// thread calculations
	var hackThreads=0;
	var hackPercentagePerThread = ns.formulas.hacking.hackPercent(ns.getServer(target), ns.getPlayer() ); // one thread steals x % of server funds.
	var serverCurFunds = ns.getServerMoneyAvailable(target); var serverMaxFunds = ns.getServerMaxMoney(target); 
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
*/