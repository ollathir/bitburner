import {printTable, currentTimeInHHMMSS} from "printTable.js";
import {list_servers, list_open_servers} from "getServers.js";
import {formatMem} from "functions.js";
import {showHUD} from "/status/showHUD.js";

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function isRunning2( ns, filename ) {
    var processes = ns.ps( "home" );
    var myResult = { args:"", filename:"", pid:"-", threads:0};
    for (var process of processes) {
        if (process.filename == filename) {
            myResult = process;
        }
    }
    return myResult;
}

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
//    ns.disableLog("scan");
//    ns.disableLog("sleep");
	ns.tail();
	
    while (true)
    {
	    // income streams: scripts, gangs, hacknet, (stocks?)
	    var scriptIncome = ns.getScriptIncome()[0];
	    var scriptExp = ns.getScriptExpGain();
        var gangIncome = 0;
        var corpProfit = 0;
        var hackScript1 = "/hackAll_v4/main.js";
        var hackScript2 = "/hackAll_v5/main.js";
        var hackScript0 = "/hackExp/main.js";
        var gangScript = "/gangs/gangs.js";
        var hacknetScript = "/hacknetAuto.js";
        var corpScript1 = "/corp/corp_start.js";
        var corpScript2 = "/corp/corp_mid.js";
        var stockScript = "stocks.js";
        var cctScript = "/cct/solver.js";
        var purchasedServerScript = "purchaseServerAuto.js";
        var torScript = "/singularity/tor.js";
        var manualHackScript = "/singularity/manualHack.js";
        var backdoorScript = "/singularity/backdoorAll.js";
        var hudScript = "HUD.js";
        

        ns.clearLog();

        var servers = list_servers(ns); var backdoor=0;
        for (var server of servers) {
            if (ns.getServer(server).backdoorInstalled) { backdoor++; }
        }
        ns.print( "Open servers: " + list_open_servers(ns).length + " / " + (list_servers(ns).length+1) + ". " + backdoor + " backdoors installed.");

        var totalram = 0; var usedram = 0;
        var servers = list_open_servers(ns); 
        for (var server of servers) {
            totalram += ns.getServerMaxRam( server );
            usedram += ns.getServerUsedRam( server );
        }
        ns.print( "Network ram - Used: " + formatMem(usedram) + " total: " + formatMem(totalram) );
        ns.print( "Karma: " + ns.heart.break() );


        var table=[];

        table.push( ["Category", "Status", "PID", "Script" ] );
        // hacknet
        var hacknetIncome = 0;
        for (var i=0 ; i<ns.hacknet.numNodes() ; i++ )
        {
            hacknetIncome += ns.hacknet.getNodeStats(i).production;
        }
        if (isRunning2(ns, hacknetScript).filename!="") {
            table.push( ["Hacknet", ns.nFormat(hacknetIncome,"0.000a"), isRunning2(ns, hacknetScript).pid, hacknetScript] );
        } else {
            table.push( ["Hacknet", ns.nFormat(hacknetIncome,"0.000a"), "-", "None"] );
        }

        // gang
        if (ns.gang.inGang()) {
            var gangInfo = ns.gang.getGangInformation();
            gangIncome = gangInfo.moneyGainRate*5;
            if (isRunning2(ns,gangScript).filename!="" ) {
                table.push( ["Gang", numberWithCommas(Math.round(gangIncome)), ns.nFormat(gangIncome,"0.000a"), isRunning2(ns,gangScript).pid, gangScript ] );
            } else {
                table.push( ["Gang", 0, "-", "None"]);
            }
        }

        // hacking
        if (isRunning2(ns,hackScript1).filename!="") {
            table.push( ["Hacking", ns.nFormat(scriptIncome,"0.000a"), isRunning2(ns,hackScript1).pid, hackScript1] );
        } else if (isRunning2(ns,hackScript2).filename!="") {
            table.push( ["Hacking", ns.nFormat(scriptIncome,"0.000a"), isRunning2(ns,hackScript2).pid, hackScript2] );
        } else if (isRunning2(ns,hackScript0).filename!="") {
            table.push( ["Hacking", ns.nFormat(scriptIncome,"0.000a"), isRunning2(ns,hackScript0).pid, hackScript0] );
        } else {
            table.push( ["Hacking", ns.nFormat(scriptIncome,"0.000a"), 0, "None"] );
        }

        // corporation
        if (ns.getPlayer().hasCorporation) {
            var corp = ns.corporation.getCorporation();
            var tempCorp = "None";
            var corppid = "-";
            if (isRunning2(ns,corpScript1).pid != 0) { tempCorp = corpScript1;  corppid = isRunning2(ns,corpScript1).pid; }
            if (isRunning2(ns,corpScript2).pid != 0) { tempCorp = corpScript2; corppid = isRunning2(ns,corpScript2).pid; }
            for (var division of corp.divisions) {
                table.push( [`${corp.name}: ${division.name} ` , ns.nFormat((division.lastCycleRevenue-division.lastCycleExpenses)/1,"0.000a"), corppid, tempCorp] );
                corpProfit += (division.lastCycleRevenue-division.lastCycleExpenses)/1;
            }
        }

        // stocks
        if (isRunning2(ns,stockScript).filename!="") {
            var stockProfit = ns.peek(19);
            if (!isNaN(stockProfit)) { stockProfit = ns.nFormat(stockProfit,"0.000"); }
            table.push( ["Stocks", stockProfit, isRunning2(ns,stockScript).pid, stockScript] );
        } else {
            table.push( ["Stocks", "-", "-", "None"] );
        }

        // utility - coding contracts
        var servers = list_servers(ns);
        var contracts = 0;
        for (var server of servers) {
            var files = ns.ls(server, "cct");
            contracts += files.length;
        }
        var tempCCT = "None";
        if (isRunning2(ns,cctScript).filename != "") { tempCCT = cctScript; }
        table.push( ["Coding contracts", `${contracts} open`, isRunning2(ns,cctScript).pid, tempCCT ]);

        var tempPSS = "None";
        if (isRunning2(ns,purchasedServerScript).filename != "") { tempPSS = purchasedServerScript; }
        table.push( ["Server Upgrade", 0, isRunning2(ns,purchasedServerScript).pid, tempPSS] );

        var torScript = "/singularity/tor.js";
        const dwProgs = ns.singularity.getDarkwebPrograms();
        var myDw = 0;
        for (var dw = 0 ; dw < dwProgs.length ; dw++) {
            if (ns.fileExists(dwProgs[dw])) { myDw++; }
        }
        var tempTor = "None";
        if (isRunning2(ns,torScript).filename != "" ) { tempTor = torScript; }
        if (!ns.getPlayer().tor) {
            table.push( ["Darkweb", "No TOR", isRunning2(ns,torScript).pid, tempTor]);
        } else {
            table.push( ["Darkweb", myDw + " programs", isRunning2(ns,torScript).pid, tempTor]);
        }            
        
        var tempMHS = "None";
        if (isRunning2(ns,manualHackScript).filename!="") { tempMHS = manualHackScript; }
        table.push( ["Intelligence", ns.singularity.getCurrentServer(), isRunning2(ns,manualHackScript).pid, tempMHS] );  

        var tempBD = "None";
        if (isRunning2(ns,backdoorScript).filename != "") { tempBD = backdoorScript; }
        table.push( ["Backdoor", "-", isRunning2(ns,backdoorScript).pid,tempBD ]);

        var tempHUD = "None";
        if (isRunning2(ns,hudScript).filename != "") { tempHUD = hudScript; }
        table.push( ["HUD", "-", isRunning2(ns,hudScript).pid,tempHUD ]);

        await printTable( ns, table );
        showHUD(ns);

        await ns.sleep(2000);
    }
}