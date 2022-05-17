import {printTable, tableToHTMLString, printBox2} from "printTable.js";
import {serverPath, list_servers, list_open_servers} from "getServers.js";
import {deployHack} from "functions.js";

const factionServers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z"];

var myBox=null;
var passInstruction="";


/** @param {NS} ns */
export async function main(ns) {
    if (ns.args[0] == "all" ) {

    } else if (ns.args[0] == "faction") {

    } else {
        ns.tprint( "Usage: <all/faction>" );
        return;
    }

	ns.clearLog();
	ns.disableLog("ALL");
	ns.tail();
    await ns.sleep(100);
    const servers = list_servers(ns);
    for (var server of servers) {
        deployHack( ns, server );
    }

    if (ns.args[0] == "faction") {
        ns.atExit( () => { myBox.remove() } );
        for (var openServer of factionServers) {
            ns.clearLog();
            await showSummary( ns, openServer );
            if (!ns.getServer(openServer).backdoorInstalled && ns.getServerRequiredHackingLevel(openServer)<=ns.getPlayer().hacking && ns.hasRootAccess(openServer)) { 
                await backdoorServer( ns, openServer ); 
            }
            await ns.sleep(100);
        }
        myBox.remove();
        return;
    } else if (ns.args[0] == "all") {
        ns.atExit( () => { myBox.remove() } );
        var openServers = list_open_servers(ns);
        for (var openServer of openServers) {
            ns.clearLog();
            await showSummary( ns, openServer );
            if (!ns.getServer(openServer).backdoorInstalled && ns.getServerRequiredHackingLevel(openServer)<=ns.getPlayer().hacking && ns.hasRootAccess(openServer)) { 
                await backdoorServer( ns, openServer ); 
            }
            await ns.sleep(100);
        }
        myBox.remove();
        return;
    }
}

async function showSummary( ns, victim ) {
    var servers = list_servers(ns);
    var table = [["Server", "Backdoor"]];
    for (var server of servers) {
        if (ns.getServer(server).purchasedByPlayer) { continue; }
        if (server==victim) {
            var tableRow = [server, "Installing..." ];
        } else if (ns.getServerRequiredHackingLevel(server)>ns.getPlayer().hacking) {
            var tableRow = [server, "Insufficient skill" ];
        } else {
            var tableRow = [server, ns.getServer(server).backdoorInstalled ];
        }
        table.push( tableRow );
    }
    await printTable( ns, table );
    myBox = printBox2( "backdoorAll", tableToHTMLString( table ) );
    myBox.style.width = "500px";
    myBox.style.height = globalThis.innerHeight-20 + "px";
    myBox.style.top = "1px";
  	if (!myBox.head.getAttribute("data-listener")) { myBox.head.querySelector(".kill").addEventListener('click', () => { passInstruction="kill" } ); }
}

export async function backdoorServer(ns, victim) {
    let pathToVictim = [];
    // Try to get a path to the victim server, and if that's successful, install
    // a backdoor on it
    if (serverPath(ns, '', ns.getCurrentServer(), victim, pathToVictim)) {
        for (const i in pathToVictim) {
            if (i > 0) { 
                ns.connect(pathToVictim[i]); 
            }
        } 

        await ns.installBackdoor();     // Install the backdoor

        // Now navigate back to where we started by walking the path backward
        let pathEnd = pathToVictim.length - 1;
        for (const i in pathToVictim) {
            if (i > 0) { // don't connect to the current server node
                ns.connect(pathToVictim[pathEnd - i]);
            }
        } // navigate back to the starting server
    } 
} // end of backdoorServer()