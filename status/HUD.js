/** @param {NS} ns **/
export async function main(ns) {
    const args = ns.flags([["help", false]]);
    if (args.help) {
        ns.tprint("This script will enhance your HUD (Heads up Display) with custom statistics.");
        ns.tprint(`Usage: run ${ns.getScriptName()}`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()}`);
        return;
    }

    while (true) {
        showHUD(ns);
        await ns.sleep(1000);
    }
}

export function showHUD(ns) {
        const doc = eval("document");
    //const doc = document; // This is expensive! (25GB RAM) Perhaps there's a way around it? ;)
    const hook0 = doc.getElementById('overview-extra-hook-0');
    const hook1 = doc.getElementById('overview-extra-hook-1');
    
    ns.atExit( () => {
        hook0.innerText = "";
        hook1.innerText = "";
    } );

    try {
        const headers = []
        const values = [];

        headers.push("Karma");
        values.push(ns.heart.break());

        headers.push("");
        values.push("");

        // Add script income per second
        headers.push("Scripts");
        values.push("$"+ns.nFormat(ns.getScriptIncome()[0],"0.000a") + '/sec');
        // TODO: Add more neat stuff
            
        var hacknetIncome = 0;
        for (var i=0 ; i<ns.hacknet.numNodes() ; i++ )
        {
            hacknetIncome += ns.hacknet.getNodeStats(i).production;
        }
        headers.push("Hacknet");
        values.push("$"+ns.nFormat(hacknetIncome,"0.000a") + "/sec");

        if (ns.gang.inGang()) {
            var gangInfo = ns.gang.getGangInformation();
            var gangIncome = gangInfo.moneyGainRate*5;
            headers.push("Gang");
            values.push("$"+ns.nFormat(gangIncome,"0.000a") + "/sec");
        }   

        // Now drop it into the placeholder elements
        hook0.innerText = headers.join(" \n");
        hook1.innerText = values.join("\n");
    } catch (err) { // This might come in handy later
        ns.print("ERROR: Update Skipped: " + String(err));
        hook0.innerText = "";
        hook1.innerText = "";
    }
}