import {serverPath} from"getServers.js";
 
/** @param {NS} ns */
export async function main(ns) {
    let pathToVictim = [];

	if (!ns.args[0]) { ns.tprint( "Usage gotoServer.js <serverName>"); }

    if (ns.args[0]=="end") { 
        var target = "w0r1d_d43m0n";
    } else {
        var target = ns.args[0];
    }

    // Try to get a path to the victim server, and if that's successful, install
    // a backdoor on it
    if (serverPath(ns, '', ns.getCurrentServer(), target, pathToVictim)) {
        // Got a path from 'here' to 'there'
        // Step through the path, connecting to each server along the path
        // until the victim server is reached
        for (const i in pathToVictim) {
            if (i > 0) { // Don't connect to the current server, we're already here
                ns.connect(pathToVictim[i]); // next server in the chain
            }
        } // navigate to the victim server
	}
}