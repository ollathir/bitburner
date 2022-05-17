import {printTable} from "printTable.js";
import {list_servers} from "getServers.js";

/*function scan(ns, parent, server, list) {
    const children = ns.scan(server);
    for (let child of children) {
        if (parent == child) {
            continue;
        }
        list.push(child);
        
        scan(ns, server, child, list);
    }
}

export function list_servers(ns) {
    const list = [];
    scan(ns, '', 'home', list);
    return list;
}

export function spaceleft ( a, l ) {

    var length = a.length;
    var spaces = l - length;
    var space = " ";

    var b = " ";

    var b = space.repeat(spaces) + a;

    return b;
}

export function space( a, l ) {

    var length = a.length;
    var spaces = l - length;
    var space = " ";

    var b = " ";

    var b = a + space.repeat(spaces);

    return b;
}

async function printTable( ns, table )
{
    // Seems very badly coded, below blocks return the max column length for each column.
    // Check max number of columns
    var maxcols = 0;
    for (tablerow of table) {
        if (tablerow.length > maxcols) { 
            maxcols = tablerow.length; 
        }
    }

    // Define a colsizes array
    var colsizes = []; colsizes.length=maxcols;
    for( var i=0 ; i < colsizes.length ; i++ ) {
        colsizes[i] = 0;
    }
    
    // get the highest value for each column within the table
    for (var tablerow of table) {
        var c = 0;
        for (var tableCol of tablerow) {
            if (tableCol.length > colsizes[c]) { 
                colsizes[c] = tableCol.length }
            c++;
        }
        
    }    
    
    await ns.clearLog;

    for (var tablerow of table)
    {
        var printrow = ''; var col = 0;
        for (var tablecol of tablerow)
        {
            printrow = printrow + space(tablecol, colsizes[col]+1);
            col++;
        }
        ns.print(printrow);
    }
}
*/
/** @param {NS} ns **/
export async function main(ns) {    
    var servers = list_servers(ns);
    const min = ns.args[0];
    const maxskill = ns.args[1];

    ns.disableLog('ALL');
    ns.tail();    

    if (ns.args[0] == "help") {
        ns.tprint( "Display all server on the network:");
        ns.tprint( "listservers <min amount of max server cash> <max hacking skill>");
        ns.tprint( "listservers <purchase/player> shows purchased servers");
        return;
    }
    
    // if player servers then change the list
    if (ns.args[0] == "purchased" || ns.args[0] == "player" ) {
        servers = ns.getPurchasedServers();
    } else {
        // otherwise remove player servers
        var pservers = ns.getPurchasedServers();
        for (var pserver of pservers ) {
            if (servers.indexOf(pserver) >= 0 ) {
                servers.splice( servers.indexOf(pserver), 1 );
            }
        }
    }

    var table = [];
    
    table[0] = ["Server", "Memory", "",      "Security", "",   "Hack", "Ports", "Cur$", "Max$", "Growth", "Opened", "Hack%", "HackGain"];
    table[1] = ["",       "Used",   "Total", "Min",     "Cur", "Req",   "",     "",     "",     "",       "",       "",      ""];
    
    var row=2;
    for(const server of servers) {
        if (ns.getServer(server).purchasedByPlayer) { continue; }
        const rused = ns.nFormat(ns.getServerUsedRam(server), '0.0') + "GB";
        const rmax = ns.nFormat(ns.getServerMaxRam(server), '0.0') + "GB";
		
        const smin = ns.nFormat(ns.getServerMinSecurityLevel(server), "0.0");
        const scur = ns.nFormat(ns.getServerSecurityLevel(server), "0.0" );

        const hackskill = ns.nFormat(ns.getServerRequiredHackingLevel(server), "0");
        const hackchance = ns.nFormat(ns.hackAnalyzeChance(server)*100, "0.00");
        const ports = ns.nFormat(ns.getServerNumPortsRequired(server), "0" );
        
        const cmax = ns.nFormat(ns.getServerMaxMoney(server),"$0.000a");//.toLocaleString("en-US");
        const ccur = ns.nFormat(ns.getServerMoneyAvailable(server),"$0.000a");//.toLocaleString("en-US");
        const growth = ns.nFormat(ns.getServerGrowth(server), "0000");

        var open = "";
        if (ns.hasRootAccess(server)) {
            open = "True";
        }
        else {
            open = "False";
        }
        
        var stolen = ns.nFormat(ns.hackAnalyze(server), "0.0000"); 
        var bestweaken = Math.round((ns.getHackingLevel() - ns.getServerRequiredHackingLevel(server)) / ns.getHackingLevel()*1000)/1000;

        if ( !isNaN( ns.args[0])) { // filter on max cash 
            if (ns.getServerMaxMoney(server)<ns.args[0]) { continue; }
        }

        if ( !isNaN( ns.args[1])) { // filter on required skill
            if (ns.getServerRequiredHackingLevel(server)>ns.args[1]) { continue; }
        }
        table[row] = [server, rused, rmax, smin, scur, hackskill + " ("+hackchance+")", ports, ccur, cmax, growth, open, stolen, bestweaken];
        row++;
    }
    ns.clearLog();
    printTable( ns, table );
    ns.print( `Servers found: ${table.length-2}`);
}