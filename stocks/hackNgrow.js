/** @param {NS} ns */
import {list_open_servers} from "getServers.js";
import {hackAll, runScript,convertMSToHHMMSS } from "functions.js";
import {printTable} from "printTable.js";

const sHack = "/stocks/hack.js";
const sGrow = "/stocks/grow.js";
const sWeaken = "/stocks/weaken.js";

var symbolMap = [
		["AERO","AeroCorp","aerocorp"],
		["APHE","Alpha Enterprises","alpha-ent"],
		["BLD","Blade Industries","blade"],
		["CLRK","Clarke Incorporated","clarkinc"],
		["CTK","CompuTek","comptek"],
		["CTYS","Catalyst Ventures","catalyst"],
		["DCOMM","DefComm","defcomm"],
		["ECP","ECorp","ecorp"],
		["FLCM","Fulcrum Technologies","fulcrumassets"],
		["FNS","FoodNStuff","foodnstuff"],
		["FSIG","Four Sigma","4sigma"],
		["GPH","Global Pharmaceuticals","global-pharm"],
		["HLS","Helios Labs","helios"],
		["ICRS","Icarus Microsystems","icarus"],
		["JGN","Joe's Guns","joesguns"],
		["KGI","KuaiGong International","kuai-gong"],
		["LXO","LexoCorp","lexo-corp"],
		["MDYN","Microdyne Technologies","microdyne"],
		["MGCP","MegaCorp","megacorp"],
		["NTLK","NetLink Technologies","netlink"],
		["NVMD","Nova Medical","nova-med"],
		["OMGA","Omega Software","omega-net"],
		["OMN","Omnia Cybersystems","omnia"],
		["OMTK","OmniTek Incorporated","omnitek"],
		["RHOC","Rho Contruction","rho-construction"],
		["SGC","Sigma Cosmetics","sigma-cosmetics"],
		["SLRS","Solaris Space Systems","solaris"],
		["STM","Storm Technologies","stormtech"],
		["SYSC","SysCore Securities","syscore"],
		["TITN","Titan Laboratories","titan-labs"],
		["UNV","Universal Energy","univ-energy"],
		["VITA","VitaLife","vitalife"],
//		["WDS","Watchdog Security",""]
];

export async function main(ns) {
	ns.tail(); ns.disableLog("ALL"); ns.clearLog();
	await makeHack(ns); await makeGrow(ns); await makeWeaken(ns);

	while( true ) {
		await loop(ns);
		await ns.sleep(100);
	}	
// export async function runScript( ns, sScript, target, threads ) { 
}

async function loop(ns) {
		await hackAll(ns); // try to open all available servers.
	var memHack = ns.getScriptRam(sHack); // 1.7Gb
	var memGrow = ns.getScriptRam(sGrow); // 1.75Gb
	var memWeaken = ns.getScriptRam(sWeaken); // 1.75Gb

	// total threads available
	var servers = await list_open_servers( ns );
	var threadsAvailable = 0;
	for (var server of servers) {
		threadsAvailable += Math.floor((ns.getServerMaxRam(server)-ns.getServerUsedRam(server))/1.75);
	}

	// find where we have stock positions.
	// if long then grow the company
	// if short then hack the company
	// manage security delta along the way


	// lists of short and long positions. totalValue tracked to allocate weighting per server.
	var shorts = [];
	var longs = [];
	var totalValue = 0; var totalValueForHacks = 0; var totalValueForGrows = 0;
	for ( var sym of ns.stock.getSymbols() ) {
		var position = ns.stock.getPosition(sym);
		var target = lookupServer(sym);

		if (position[0] > 0) { 
			longs.push(sym); 
			if (target != null ) {
				if ( ns.formulas.hacking.growTime(ns.getServer(target),ns.getPlayer()) <300000 ) { // has a server and takes less than 5 minutes to grow
					totalValueForGrows += (position[0] * position[1]);
				}
			}
			totalValue += (position[0] * position[1]);
		}
		if (position[2] > 0) { 
			shorts.push(sym); 
			if (target != null ) {
				if ( ns.formulas.hacking.hackTime(ns.getServer(target),ns.getPlayer()) <300000 ) { // has a server and takes less than 5 minutes to hack
					totalValueForHacks += (position[2] * position[3]);
				}
			}
			totalValue += (position[2] * position[3]);
		}
	}

	ns.clearLog();
	await display2( ns, shorts, longs );
	ns.print( "Threads available " + threadsAvailable );
	ns.print( "Total value held in hackable servers: " + ns.nFormat(totalValueForHacks,"0.000a") );
	ns.print( "Total value held in growable servers: " + ns.nFormat(totalValueForGrows,"0.000a") );

	// short positions - hack these ones.
	for (var shortPos of shorts) {
		
	}
}

async function display2( ns, shorts, longs ) {
	var table=[];
	var tableRow = [];
	tableRow.push( "Server" );
	tableRow.push( "Sym" );
	tableRow.push( "Shares" );
	tableRow.push( "Price" );
	tableRow.push( "Value");
	tableRow.push( "Hack Time" );
	table.push( tableRow );
	var totalValue = 0;
	for (var item of shorts) {
		var position = ns.stock.getPosition(item);
		var tableRow = [];
		var target = lookupServer(item);
		if (target) {
			tableRow.push( target );
		} else {
			tableRow.push( "" );
		}
		tableRow.push( item );
		tableRow.push( ns.nFormat(position[2], "0.000a") );
		tableRow.push( ns.nFormat(position[3], "0.000a") );
		var value = position[2]*position[3];
		totalValue += value;
		tableRow.push( ns.nFormat(value, "0.000a") );
		if (target) {
			tableRow.push( convertMSToHHMMSS( ns.formulas.hacking.hackTime( ns.getServer(target), ns.getPlayer() ) ) );
		} else {
			tableRow.push( "" );
		}
		table.push( tableRow );
	}
	ns.print( "SHORTS" );
	await printTable( ns, table );
	ns.print( `Total value: ${ns.nFormat(totalValue,"0.000a")}`);
	ns.print( "" );

	var table=[];
	var tableRow = [];
	tableRow.push( "Server" );
	tableRow.push( "Sym" );
	tableRow.push( "Shares" );
	tableRow.push( "Price" );
	tableRow.push( "Value");
	tableRow.push( "Grow Time" );
	table.push( tableRow );
	totalValue = 0;
	for (var item of longs) {
		var position = ns.stock.getPosition(item);
		var tableRow = [];
		var target = lookupServer(item);
		if (target) {
			tableRow.push( target );
		} else {
			tableRow.push( "" );
		}
		tableRow.push( item );
		tableRow.push( ns.nFormat(position[0], "0.000a") );
		tableRow.push( ns.nFormat(position[1], "0.000a") );
		var value = position[0]*position[1];
		totalValue += value;
		tableRow.push( ns.nFormat(value, "0.000a") );
		if (target) {
			tableRow.push( convertMSToHHMMSS( ns.formulas.hacking.growTime( ns.getServer(target), ns.getPlayer() ) ) );
		} else {
			tableRow.push( "" );
		}
		table.push( tableRow );
	}
	ns.print( "LONGS" );
	await printTable( ns, table );
	ns.print( `Total value: ${ns.nFormat(totalValue,"0.000a")}`);
	ns.print( "" );
}

async function display( ns ) {
	if (position[0] == 0 && position[2] == 0) {  }
	var table=[["Server", "Sym", "Long Shares", "Long Shares $", "Total Long $", "Short Shares", "Short Shares $", "Total Short $" ]];
	var tableRow = [ lookupServer(sym) ];
	tableRow.push( sym, position[0], position[1], position[0]*position[1], position[2], position[3], position[2]*position[3] );
	var tableRow2 = [];
	for (var item of tableRow) {
		if (!isNaN(item) && isFinite(item) && item != null && item != "" ) { 
			tableRow2.push( ns.nFormat(item,"0.000a") ); 
		} else { 
			tableRow2.push(item); 
		}
	}
	table.push(tableRow2);
	await printTable( ns, table );
	ns.print( "Total Portfolio: " + ns.nFormat(totalValue,"0.000a") ); 

}

function lookupServer( sym ) {
	for ( var stSymbol of symbolMap ) {
		if (stSymbol[0] == sym) {
			return stSymbol[2];
		}
	}
	return null;
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


function numThreadsGrow( ns, target ) {
	var sWeakenMem = ns.getScriptRam(sWeaken);
	var sGrowMem = ns.getScriptRam(sGrow);

	if (ns.getServerRequiredHackingLevel(target)>ns.getPlayer().hacking) {  } // check that we are able to hack this server.
			
	if ( ns.fileExists("Formulas.exe") ) {
	// set up with Formulas.exe
		// time for each process.
		var vGrowTime = ns.formulas.hacking.growTime(ns.getServer(target), ns.getPlayer());
		var vWeakenTime = ns.formulas.hacking.weakenTime(ns.getServer(target), ns.getPlayer());

		var secDelta = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
		var singleWeakenThread = ns.weakenAnalyze( 1, 0 );
		var weakenThreads = secDelta / singleWeakenThread;


	}
}
/*
		// set up before Formulas.exe is available
				// really I need to balance this over the available threads...
				var quickScanServers = await list_hack_servers_sorted_a(ns, minHackChance);
				var mtt = maxTotalThreads(ns,sHighMem,homeReserve);
				var max = quickScanServers.length;
				if ( mtt < 200 ) { 
					max = 1;
				} else if (mtt < 400 ) { 
					max = 2;
				} else if (mtt < 600 ) { 
					max = 3;
				}

				var totalCashToHack = 0;
//				for (var quickScanServer of quickScanServers) {
//					totalCashToHack += ns.getServerMaxMoney(quickScanServer);
				for (var i = 0 ; i < max ; i++ ) {
					totalCashToHack += ns.getServerMaxMoney(quickScanServers[i]);
				}

				var rHack = 1; var rGrow = 8; var rWeaken = 2; // ratio's for hack:grow:weaken
				var threadsPerServer = rHack + rGrow + rWeaken;
				var threadsForServer = Math.floor( ns.getServerMaxMoney(target) / (totalCashToHack / (maxTotalThreads(ns,sHighMem,homeReserve)/threadsPerServer) ));
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
*/



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