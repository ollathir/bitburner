import { printTable, currentTimeInHHMMSS } from "printTable.js";


/** @param {NS} ns */
export async function main(ns) {
	if (isNaN(ns.args[0]) && (isNaN(ns.args[1]) && ns.args[1]!="auto") )
	{
		ns.tprint( "Usage: <% of money to spend> <max number of nodes/auto>.");
        return;
	}
    if (ns.args[1]=="auto")
    {
        var maxNodes=20;
    } else {
        var maxNodes = ns.args[1];
    }
	var pct = ns.args[0]; 
	// should I automate maxNodes? 30 when have $50bn, 40 when $1tn ?

//	ns.disableLog("ALL");
	ns.tail();
    var log=[];
	while (true)
	{
        let myMoney = ns.getServerMoneyAvailable('home');
        let allowance = myMoney * (pct / 100);

        if (ns.getServerMoneyAvailable("home") > 1000000000000 && ns.args[1]=="auto") // $1 tn
            { maxNodes = 40; }
        else if (ns.getServerMoneyAvailable("home") > 50000000000 && ns.args[1]=="auto" ) // $50 bn
            { maxNodes = 30; }


		// buy new node?
        if (ns.hacknet.getPurchaseNodeCost() < allowance && ns.hacknet.numNodes() < maxNodes) {
            log.push( currentTimeInHHMMSS()+": " + 'Purchasing new node');
            ns.hacknet.purchaseNode();
            continue;
        }
		// run upgrades
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            let node = ns.hacknet.getNodeStats(i);
            let RoI = [];
            let topRoI = 0;
 
            if (node.level < 200) {
                RoI.push(((node.level + 1) * 1.6) * Math.pow(1.035, (node.ram - 1)) * ((node.cores + 5) / 6) / ns.hacknet.getLevelUpgradeCost(i, 1));
            } else {
                RoI.push(0);
            }
 
            if (node.ram < 64) {
                RoI.push((node.level * 1.6) * Math.pow(1.035, (node.ram * 2) - 1) * ((node.cores + 5) / 6) / ns.hacknet.getRamUpgradeCost(i, 1));
            } else {
                RoI.push(0);
            }
 
            if (node.cores < 16) {
                RoI.push((node.level * 1.6) * Math.pow(1.035, node.ram - 1) * ((node.cores + 6) / 6) / ns.hacknet.getCoreUpgradeCost(i, 1));
            } else {
                RoI.push(0);
            }
 
            RoI.forEach(value => {
                if (value > topRoI) {
                    topRoI = value;
                }
            });
 
            if ( i === maxNodes - 1 && topRoI === 0) {
//                log.push( currentTimeInHHMMSS()+": " + "Desired number of nodes reached and upgraded");
//                ns.scriptKill(ns.getScriptName(), ns.getHostname());
            }
            else if (topRoI === 0) {
//                log.push( currentTimeInHHMMSS()+": " + "All upgrades maxed on node" + i);
            } else if (topRoI == RoI[0] && ns.hacknet.getLevelUpgradeCost(i, 1) < allowance) {
                log.push( currentTimeInHHMMSS()+": " + 'Upgrading Level on Node' + i);
                ns.hacknet.upgradeLevel(i, 1);
            } else if (topRoI == RoI[1] && ns.hacknet.getRamUpgradeCost(i, 1) < allowance) {
                log.push( currentTimeInHHMMSS()+": " + 'Upgrading Ram on Node' + i);
                ns.hacknet.upgradeRam(i, 1);
            } else if (topRoI == RoI[2] && ns.hacknet.getCoreUpgradeCost(i, 1) < allowance) {
                log.push( currentTimeInHHMMSS()+": " + 'Upgrading Core on Node' + i);
                ns.hacknet.upgradeCore(i, 1);
            }
        }
 


		// Display hacknet nodes
		var table = [["Name", "Production", "Level", "RAM", "Cores", "Cache"]];
		
		var myHacknetNodes = ns.hacknet.numNodes();
        var totalProduction = 0;
		for (var i=0 ; i < ns.hacknet.numNodes() ; i++ )
		{
            let node = ns.hacknet.getNodeStats(i);
			var tablerow=[node.name, "$"+ns.nFormat(node.production,"0.000a")+" /sec", node.level, node.ram, node.cores, node.cache];
            totalProduction += node.production;
			table.push(tablerow);
		}
		ns.clearLog();
		ns.print( `Total nodes: ${ns.hacknet.numNodes()} Total production: ${ns.nFormat(totalProduction,"0.000a")} /sec`);
		await printTable(ns,table);
        for (var i=(log.length-1) ; i >= (log.length-4) && i>=0 ; i-- )
        {
            ns.print(log[i]);
        }


		await ns.sleep(200);
	}
}