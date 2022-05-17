/** @param {NS} ns */
export async function main(ns) {
    if (ns.getServerMaxRam("home")>2000) { // plenty of memory so run mid game status
        ns.exec( "/status/status_mid.js", "home", 1 );
    } else {
        ns.exec( "/status/status_early.js", "home", 1 );
    }
}