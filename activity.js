//import { hackPercent } from './Formulas.exe';

import {printTable} from "printTable.js";

function scan(ns, parent, server, list) {
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

/*export function spaceleft ( a, l ) {
    var length = a.length;
    var spaces = l - length;
    var space = " ";

    var b = space.repeat(spaces) + a;

    return b;
}

export function space( a, l ) {
// need to change the return to being a string
    var length = a.length;
    var spaces = l - length;
    var space = " ";

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
    } // could do this block with a push in the main loop below?
    
    // get the highest value for each column within the table
    for (var tablerow of table) {
        var c = 0;
        for (var tableCol of tablerow) {
            if (tableCol.length > colsizes[c]) { 
                colsizes[c] = tableCol.length }
            c++;
        }
        
    }    
    
    await ns.clearLog();

    for (var tablerow of table)
    {
        var printrow = ''; var col = 0;
        for (var tablecol of tablerow)
        {
            if (isNaN(tablecol)) {
                printrow = printrow + space(tablecol.toString(), colsizes[col]+1);
            } else {
                printrow = printrow + spaceleft(tablecol.toString(), colsizes[col]) + ' ';
            }
            col++;
        }
        ns.print(printrow);
    }
}
*/
function convertMSToHHMMSS(ms = 0) {
  if (ms <= 0) {
    return '00:00:00'
  }

  if (!ms) {
    ms = new Date().getTime()
  }

  return new Date(ms).toISOString().substr(11, 8)
}

/** @param {NS} ns **/
export async function main(ns) {   
    var f = ns.formulas.hacking; 
    const min = ns.args[0];
    const maxskill = ns.args[1];

    ns.tail();    
    ns.disableLog('ALL');
    ns.clearLog();

    if (ns.args[0] == "help") {
        ns.tprint( "Display all my activity on the network.");
        return;
    }

    // my main scripts
    const hackScript = 'justhack.js'; var curHacks=0;
    const weakenScript = 'growweaken.js'; var curWeakens=0;

    while(true) 
    {
        var servers = list_servers(ns);
        var currentTargets = [];
        servers.push("home");

        // Check what's running on each server. We are looking to build a list of servers which are being hacking.
        for (var server of servers) {
            var processes = ns.ps(server);
            for (var process of processes) {
                var bMatch = 0;
                var myArgs = process.args[0]; // process.args is actually an array.
                for ( var currentTarget of currentTargets ) {
                    if (currentTarget==myArgs) {
                        bMatch=1;
                    } 
                }
                if (bMatch==0) {
                    if (process.filename==hackScript || process.filename==weakenScript) {
                    currentTargets.push(myArgs); }
                }
            }
        }

        // Sort currentTargets by max server cash
        var len = currentTargets.length;
        var bSwap=true;
        while (bSwap)
        {
            bSwap=false;
            for (var i = 1 ; i <= (len-1) ; i++ )
            {
                if ( ns.getServerMaxMoney(currentTargets[i-1]) < ns.getServerMaxMoney(currentTargets[i]) )
                {
                    var tempCurrentTarget=currentTargets[i-1];
                    currentTargets[i-1] = currentTargets[i];
                    currentTargets[i] = tempCurrentTarget;
                    bSwap=true;
                }
            }
        }

        // Now work out how many hacks and weakens are running on each target. This is probably better merged
        // with the above, and is quite slow and ploddy. However, very difficult to debug in bitburner!
        var myTargets = [["Target", "Hacks", "Weakens", "$ Cur", "$ Max", "Security", "(Delta)", "Hack 30%", "Hack time", "Grow time", "Weaken time", "Next hack"]];
        for (var currentTarget of currentTargets) { // Set up information to display
            var curCash = ns.nFormat(ns.getServerMoneyAvailable(currentTarget), "0.000a");
            var maxCash = ns.nFormat(ns.getServerMaxMoney(currentTarget), "0.000a");
            var curSec = ns.nFormat(ns.getServerSecurityLevel(currentTarget),"0.00");
            var secMin = ns.getServerMinSecurityLevel(currentTarget);
            var secDelta = "("+ns.nFormat(ns.getServerSecurityLevel(currentTarget) - secMin, "0.00")+")";

            // scan processes on all servers looking for hackScript and weakenScript running on currentTarget. Total the number of threads running
            var myTarget = [currentTarget, 0, 0, curCash, maxCash, curSec, secDelta];
            for (var server of servers) {
                var processes = ns.ps(server);
                for (var process of processes) {
                    if (process.filename==hackScript && process.args[0]==currentTarget) {
                        myTarget[1] = myTarget[1] + process.threads;
                    }
                    if (process.filename==weakenScript && process.args[0]==currentTarget) {
                        myTarget[2] = myTarget[2] + process.threads;
                    }
                }
            } 

            // Add on # threads required to steal 30% of servers max cash, hack time, grow time, weaken time. 
            myTarget.push( ns.nFormat(ns.hackAnalyzeThreads(currentTarget, ns.getServerMaxMoney(currentTarget)*0.3), "0") );

            myTarget.push( convertMSToHHMMSS(ns.getHackTime(currentTarget)) );
            myTarget.push( convertMSToHHMMSS(ns.getGrowTime(currentTarget)) );        
            myTarget.push( convertMSToHHMMSS(ns.getWeakenTime(currentTarget)) );                

            if (ns.fileExists("Formulas.exe", "home")) {
                var p = ns.getPlayer();
                var a = f.hackPercent(ns.getServer(currentTarget), p);
                if (!isNaN(a) && ((ns.getServerMoneyAvailable(currentTarget)>(ns.getServerMaxMoney(currentTarget)*0.7))) ) {
                    myTarget.push( ns.nFormat((a * myTarget[1])*ns.getServerMoneyAvailable(currentTarget),"0.000a" )); // % money stolen by single thread from server, multiplied by calculated number of threads. 
                } else {
                    myTarget.push( "");
                }
             } else {
                 myTarget.push( "N/A" );
             }
            myTargets.push(myTarget);
        }

        await ns.clearLog();
        await printTable(ns,myTargets);   
        await ns.sleep(100);
    } // back to start of main loop.
}