import {printTable,printTableFromPort,convertMSToHHMMSS } from "printTable.js";
import {list_servers, list_hack_servers, list_hack_servers_sorted, list_open_servers, list_hack_servers_sorted_a} from "getServers.js";
import {deploy_hack, hackAll, findBox} from "functions.js";

// is there any way to brute force initial growth?

const homeReserve=500;
const minHackChance = 0.6;
const iBackdoor=false;
const sMainLoop = "hackAll_v4/loop.js";
const sHack = "pureHack.js";
const sWeaken = "pureWeaken.js";
const sGrow = "pureGrow.js";
const weakenFirst=false;
const noloop=false; // should the threads be run indefinately?
var passInstruction = null;
var myBox=null;

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
//	ns.tail();

	if (weakenFirst && !ns.fileExists("Formulas.exe")) { await weaken_all2(ns); }

	await hackAll(ns);
	if (iBackdoor) {
		await installBackdoors(ns);
	}

	// Kill currently running threads related to hackallv4.js
	kill_all(ns);
	if (ns.args[0]=="kill") return;

	//  main loop
	var cycle=0;
	passInstruction="run";
	while (passInstruction!="kill")
	{
		ns.clearLog();
		ns.print( `Cycle ${ns.nFormat(cycle,"0.000a")} running...`);
		await ns.exec(sMainLoop,"home",1,homeReserve);		
		await printTableFromPort(ns,1);

		myBox = findBox( "hackAll_v4" );
		if (myBox) {
	  		if (myBox.head.getAttribute("data-listener")) { 
				if (parseInt(myBox.style.height,10) > (globalThis.innerHeight-20) ) {
    				myBox.style.height = globalThis.innerHeight-20 + "px";
    				myBox.style.top = "1px";
				}
			    passInstruction = myBox.head.getAttribute("data-listener");
			}  
		}

		await ns.sleep(100);
		cycle++;
	}
	myBox.remove();
	ns.tail();
}