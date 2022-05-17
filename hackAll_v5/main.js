/** @param {NS} ns */
import {list_servers, list_open_servers, list_hack_servers} from "getServers.js";
import {tableToHTMLString, printBox, printBox2,printTable,printTableFromPort,convertMSToHHMMSS } from "printTable.js";
import {formatMem, numberWithCommas} from "functions.js";

//var target = "crush-fitness"; 
var sHack = "/hackAll_v5/hack.js";
var sGrow =  "/hackAll_v5/grow.js";
var sWeaken =  "/hackAll_v5/weaken.js";
var interval=5000; // time between runs in ms
var homeReserved = 1000;
var passInstruction = "";
var myBox = null;
const chanceToHack = 0.6;

/* End game hacking script. 

I want to try to run this in cycles of 5 seconds or so to maximise hacks on slower servers.

This will mean timing threads so that hacks finish a second before a grow, grows finish a second before a weaken, etc.

I should be able to control the threads by adding a cycle arg when running exec.
*/
export async function main(ns) {
	//ns.tail(); 
	ns.disableLog("ALL"); ns.clearLog();
	await makeHack(ns);
	await makeGrow(ns);
	await makeWeaken(ns);

	var tick=0; var nextTime=0;

	// find highest existing tick
	var targets = list_servers(ns);
	for (var target of targets) {
		var processes = ns.ps(target);
		for (var process of processes) {
			if (process.filename==sWeaken && process.args[1] > tick && !isNaN(process.args[1])) { 
				tick = process.args[1]+1;
			}
		}
	}

	nextTime = ns.getTimeSinceLastAug();
	passInstruction = "run";
	while( true ) {
		if (nextTime < ns.getTimeSinceLastAug() ) {
			ns.exec( "/hackAll_v5/loop.js", "home", 1, 500, tick );
			nextTime += interval; 
			tick++;
		}

		// Display
		await showSummary(ns, tick);
		ns.print( "Instruction " + passInstruction );

		// Wait
		await ns.sleep(500); 

		if (passInstruction=="kill") {
			myBox.remove();
			ns.tail();
			ns.print("Kill received");
			return;
		}
	}
	myBox.remove();
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


async function showSummary(ns, tick)
{
	var targets = await list_hack_servers(ns,chanceToHack);
	var totalThreads=0;
	var totalMemoryUsed=0; var memoryUsed=0;
	ns.clearLog();
	var table=[["Server", "Cycles", "Hacks", "Grows", "Weakens", "Cycle Time", "Sec Delta", "Cur $", "Max $"]];
	for (var target of targets) {
		var hacks=[]; var grows=[]; var weakens=[]; var ticks=[];
		var totalHackThreads=0; var totalGrowThreads=0; var totalWeakenThreads=0;
		var servers = list_servers(ns);
		for (var server of servers) {
			var processes = ns.ps(server);
			for (var process of processes) {
				if ( (process.filename==sHack || process.filename==sGrow || process.filename==sWeaken) && process.args[0]==target ) {
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
		memoryUsed += (totalHackThreads * 1.7) + (totalGrowThreads * 1.75) + (totalWeakenThreads * 1.75);
		var tHack=0; var tGrow=0; var tWeaken=0;
		for (var i = 0 ; i < ticks.length ; i++ ) {
			tHack += hacks[i];
			tGrow += grows[i];
			tWeaken += weakens[i];
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
		table.push( tableRow );
	}
	ns.print( `Threads running: ${numberWithCommas(totalThreads)} / ${numberWithCommas(maxTotalThreads(ns,1.75))} Memory used: ${formatMem(memoryUsed)} / ${formatMem(maxRam(ns))} Current cycle: ${tick}` );
	ns.print( `Earnings: ${ns.nFormat(ns.getScriptIncome()[1],"0.000a")} / sec`);
	await printTable( ns, table );

	var myData = `Threads running: ${numberWithCommas(totalThreads)} / ${numberWithCommas(maxTotalThreads(ns,1.75))} Memory used: ${formatMem(memoryUsed)} / ${formatMem(maxRam(ns))} Current cycle: ${tick}`;
	myData += "<br>" + `Earnings: ${ns.nFormat(ns.getScriptIncome()[1],"0.000a")} / sec   (Instruction: ${passInstruction})`;
	myData += tableToHTMLString(table);
	myBox = printBox2( "hackAll_v5", myData ); 	
  	if (!myBox.head.getAttribute("data-listener")) { myBox.head.querySelector(".kill").addEventListener('click', () => { passInstruction="kill" } ); }
    myBox.head.setAttribute( 'data-listener', "true" ); 

}

async function makeHack(ns)
{
	var myFunct = "/** @param {NS} ns */ export async function main(ns) { var hck = await ns.hack( ns.args[0] ); await ns.writePort(20,hck); }";
	await ns.write( sHack, myFunct, "w" );
}

async function makeGrow(ns)
{
	var myFunct = "/** @param {NS} ns */ export async function main(ns) { await ns.grow( ns.args[0] ); }";
	await ns.write( sGrow, myFunct, "w" );
}

async function makeWeaken(ns)
{
	var myFunct = "/** @param {NS} ns */ export async function main(ns) {  await ns.weaken( ns.args[0] ); }";
	await ns.write( sWeaken, myFunct, "w" );
}