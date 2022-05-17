/** @param {NS} ns */
import {list_servers, list_open_servers, list_hack_servers} from "getServers.js";
import {printTable, convertMSToHHMMSS} from "printTable.js";

var sHack = "/hackAll_v5/hack.js";
var sGrow =  "/hackAll_v5/grow.js";
var sWeaken =  "/hackAll_v5/weaken.js";


var hackAmt = 0.8;
var chanceToHack = 0.4;
var homeReserved = 1000;


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
	if (vGrowAmountMultiRequired<1) {vGrowAmountMultiRequired=2;}
	if (!isFinite(vGrowAmountMultiRequired)) {vGrowAmountMultiRequired=2;}
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
	ns.disableLog("ALL");
	ns.clearLog();
	// time for each function to run.
	var player = ns.getPlayer();
	var tick = ns.args[1];
	var cycleTime = ns.args[0];
	if (isNaN( cycleTime )) { cycleTime = 500; }

//	var hackThreads=1; var growThreads=1; var weakenThreads=1;

	var myTargets = []
	
	var targets = await list_hack_servers( ns, chanceToHack );

	for (var target of targets) {
		var threads = calculateThreads( ns, target );

		// execution times
		var sTarget = ns.getServer(target);
		var tHack = ns.formulas.hacking.hackTime(sTarget,player);
		var tGrow = ns.formulas.hacking.growTime(sTarget,player);
		var tWeaken = ns.formulas.hacking.weakenTime(sTarget,player);


		// try this as time stamps at which point the script should be run?
		var curTime = ns.getTimeSinceLastAug();
		var timeToHack = curTime + tWeaken - tHack - 2000;
		var timeToGrow = curTime + tWeaken - tGrow - 1000;

		var myTarget = { 	
			target : target,
			hackThreads : threads.hackThreads,
			timeToHack : timeToHack,
			amountHacked : 0,
			growThreads : threads.growThreads,
			timeToGrow : timeToGrow,
			weakenThreads : threads.weakenThreads,
			timeToWeaken : curTime,
			weakenRun : false,
			hackRun : false,
			growRun : false,
		}

		myTargets.push( myTarget );
	}


//	ns.print( `Threads: H ${threads.hackThreads} G ${threads.growThreads} W ${threads.weakenThreads}`)
//    ns.print( `curTime: ${convertMSToHHMMSS(curTime)} Start time: hackTime ${convertMSToHHMMSS(timeToHack)} growTime ${convertMSToHHMMSS(timeToGrow)} `);
//	ns.print( `Execution times: tHack ${convertMSToHHMMSS(tHack)} tGrow ${convertMSToHHMMSS(tGrow)} tWeaken ${convertMSToHHMMSS(tWeaken)}`);
//	ns.print( `Time to run scripts H:${convertMSToHHMMSS(tHack)} G:${convertMSToHHMMSS(tGrow)} W:${convertMSToHHMMSS(tWeaken)}`);
//	ns.print( `Finish at: H: ${convertMSToHHMMSS(timeToHack+tHack)} G: ${convertMSToHHMMSS(timeToGrow+tGrow)} W: ${convertMSToHHMMSS(curTime+tWeaken)}`);

	var startLoop = 0;

	var allFinished=false;
	while (allFinished==false) {
		allFinished = true;
		curTime = ns.getTimeSinceLastAug();
		startLoop = curTime;

		for (var myTarget of myTargets) {
			var curFundsPercentage = ns.getServerMoneyAvailable(myTarget.target) / ns.getServerMaxMoney(myTarget.target);
			var secDelta = ns.getServerSecurityLevel(myTarget.target) - ns.getServerMinSecurityLevel(myTarget.target);

			if (!myTarget.weakenRun) { 
				await runScript( ns, sWeaken, myTarget.target, myTarget.weakenThreads, tick);
				myTarget.weakenRun = true; 
			}

			if ( (myTarget.timeToHack <= curTime && !myTarget.hackRun) ) {
				if (curFundsPercentage > 0.7 ) {
					myTarget.amountHacked = await runScript( ns, sHack, myTarget.target, myTarget.hackThreads, tick);
				}
				myTarget.hackRun = true;
			}
			if ( (myTarget.timeToGrow <= curTime && !myTarget.growRun) ) {
				if ( secDelta < 5 ) {
					await runScript( ns, sGrow, myTarget.target, myTarget.growThreads, tick);
				}
				myTarget.growRun = true;
			}
			if (myTarget.weakenRun==false || myTarget.hackRun==false || myTarget.growRun==false) { allFinished=false; }
		}
		var sleepTime = (curTime+cycleTime) - ns.getTimeSinceLastAug();
		await ns.sleep(sleepTime);
		await showSummary( ns, tick, myTargets );
		ns.print( `Loop time: ${ns.getTimeSinceLastAug()-startLoop}.`);
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
		//if (!ns.fileExists(sScript, openServer)) 
		{ await ns.scp( sScript, openServer); }

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
	return await ns.readPort( 20 );
}

async function showSummary(ns, tick, myTargets)
{
	ns.clearLog();

	var targets = await list_hack_servers(ns,chanceToHack);
	var totalThreads=0;
	var totalMemoryUsed=0;
	var table=[["Server", "Cycles", "Hacks", "Grows", "Weakens", "Cycle Time", "Sec Delta", "Cur $", "Max $", "Hacked"]];
	for (var myTarget of myTargets) {
		var target = myTarget.target;
		var hacks=[]; var grows=[]; var weakens=[]; var ticks=[];
		var totalHackThreads=0; var totalGrowThreads=0; var totalWeakenThreads=0;
		var servers = list_servers(ns);
		for (var server of servers) {
			var processes = ns.ps(server);
			for (var process of processes) {
				if ( (process.filename==sHack || process.filename==sGrow || process.filename==sWeaken) && process.args[0]==target && process.args[1]==tick) {
					if ( ticks.indexOf(process.args[1]) == -1 ) {
						ticks.push( process.args[1] ); 
						hacks.push(0); 
						grows.push(0); 
						weakens.push(0);
					}
					var pos = ticks.indexOf( process.args[1] );
					if ( process.filename==sHack )   { hacks[pos]   += process.threads;   totalMemoryUsed += ns.getScriptRam(process.filename); totalHackThreads += process.threads; }				
					if ( process.filename==sGrow )   { grows[pos]   += process.threads;   totalMemoryUsed += ns.getScriptRam(process.filename); totalGrowThreads += process.threads;  }				
					if ( process.filename==sWeaken ) { weakens[pos] += process.threads;   totalMemoryUsed += ns.getScriptRam(process.filename); totalWeakenThreads += process.threads;  }				
				}
			}
		}

		var serverFunds = ns.nFormat( ns.getServerMoneyAvailable(target), "0.000a" );
		var serverMaxFunds = ns.nFormat( ns.getServerMaxMoney(target), "0.000a" );
		var serverSecurity = ns.nFormat( ns.getServerSecurityLevel(target), "0.0" );
		var serverMinSecurity = ns.nFormat( ns.getServerMinSecurityLevel(target), "0.0" );
		var curTime = ns.nFormat( (ns.getTimeSinceLastAug()/1000), "0.0" );
		var secDelta = ns.nFormat( serverSecurity-serverMinSecurity, "0.0" );
		totalThreads = totalThreads + totalHackThreads + totalGrowThreads + totalWeakenThreads;
		var memoryUsed = (totalHackThreads * 1.7) + (totalGrowThreads * 1.75) + (totalWeakenThreads * 1.75);
		var tHack=0; var tGrow=0; var tWeaken=0;
		for (var i = 0 ; i < ticks.length ; i++ ) {
			tHack += hacks[i];
			tGrow += grows[i];
			tWeaken += weakens[i];
		}
		if (isNaN(myTarget.amountHacked)) {
			var amountHackedF = "-";
		} else {
			var amountHackedF = ns.nFormat(myTarget.amountHacked,"0.000a")
		}

		var tableRow=[];
		tableRow.push( target );
		tableRow.push( ticks.length );
		tableRow.push( tHack );
		tableRow.push( tGrow );
		tableRow.push( tWeaken );
		tableRow.push( convertMSToHHMMSS(ns.formulas.hacking.weakenTime(ns.getServer(target),ns.getPlayer())) );
		tableRow.push( `${secDelta}` );
		tableRow.push( `${serverFunds}`);
		tableRow.push( `${serverMaxFunds}`);
		tableRow.push( amountHackedF );
		table.push( tableRow );
	}
	ns.print( `Time: ${curTime} Threads running: ${totalThreads}/${maxTotalThreads(ns,1.75)} Memory used: ${memoryUsed}/${maxRam(ns)} Current cycle: ${tick}` );
	ns.print( `Earnings: ${ns.nFormat(ns.getScriptIncome()[1],"0.000a")} / sec  Number of targets: ${myTargets.length}`)
	await printTable( ns, table );
}

function maxRam( ns ) {
	const purchasedServers = list_open_servers(ns);
	var mem = 0;

	for (var purchasedServer of purchasedServers) {
		mem += ns.getServerMaxRam(purchasedServer);
		if (purchasedServer=="home") { mem -= homeReserved; }
	}

	return mem;
}

function maxTotalThreads( ns, mem ) { // theoretical max
	const purchasedServers = list_open_servers(ns);
	var threads = 0;

	for (var purchasedServer of purchasedServers) {
		var memAvailable = ns.getServerMaxRam(purchasedServer);
		if (purchasedServer=="home") { memAvailable -= homeReserved; }
		threads += Math.floor(memAvailable / mem);
	}

	return threads;
}