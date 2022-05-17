import {tableToHTMLString, printBox, printBox2,printTable} from "printTable.js";
import { currentTimeInHHMMSS} from "functions.js";

var myBox=null;
var passInstruction="";
var log=[];
var reserve=0;

/** @param {NS} ns */
export async function main(ns) {
	//ns.tail(); 
	ns.clearLog(); 
	ns.disableLog("ALL");

	var limit = 50;
	if ( !isNaN(ns.args[0]) ) {
		if (ns.args[0] > 100) {
			reserve = ns.args[0];
			limit = 100;
		} else {
			limit = ns.args[0];
			reserve = 0;
		}
	}
	
	var tick=0;
	var upgraded = true;
	passInstruction = "run";
	while (passInstruction!="kill") {
		// buy server if have enough money.
		if ( ns.hacknet.getPurchaseNodeCost() < ((ns.getPlayer().money-reserve)*(limit/100)) ) {
			ns.hacknet.purchaseNode();
		}

		if (ns.hacknet.numNodes() > 0 ) {
			doUpgrade(ns, limit);
			doCache(ns, Math.floor(limit/10)); // cache upgrades - limit to 10% funds.
			spendHash( ns, limit );
			if (tick>100) { tick = 0; }
		}
		await displayStatus( ns );

		await ns.sleep(10);	
		tick++;
	}
	myBox.remove();
	ns.tail();
}

async function displayStatus( ns ) {
	// Display hacknet nodes
	var myData = "";
	var table = [["Name", "Production", "Level", "RAM", "Cores", "Cache"]];
		
	var myHacknetNodes = ns.hacknet.numNodes();
    var totalProduction = 0; var totalCapacity = 0;
	for (var i=0 ; i < ns.hacknet.numNodes() ; i++ )
	{
        let node = ns.hacknet.getNodeStats(i);
		var tablerow=[node.name, "$"+ns.nFormat(node.production,"0.000a")+" /sec", node.level, node.ram, node.cores, node.cache];
        totalProduction += node.production;
		totalCapacity += node.hashCapacity;
		table.push(tablerow);
	}
	ns.clearLog();
	ns.print( `Total nodes: ${ns.hacknet.numNodes()} Total production: ${ns.nFormat(totalProduction,"0.000a")} /sec`);
	myData += `Total nodes: ${ns.hacknet.numNodes()} Total production: ${ns.nFormat(totalProduction,"0.000a")} /sec`;
	ns.print( `Current hashes: ${ns.nFormat(ns.hacknet.numHashes(),"0.000a")} / ${ns.nFormat(totalCapacity,"0.000a")}`);
	myData += "<br>" + `Current hashes: ${ns.nFormat(ns.hacknet.numHashes(),"0.000a")} / ${ns.nFormat(totalCapacity,"0.000a")}`
	await printTable(ns,table);
	myData += tableToHTMLString( table );
	ns.print("");
    for (var i=(log.length-1) ; i >= (log.length-4) && i>=0 ; i-- )
    {
        ns.print(log[i]);
		myData += "<br>" + log[i];
    }
	myBox = printBox2( "hacknetServer " + ns.args[0], myData );
	if (!myBox.head.getAttribute("data-listener")) { myBox.head.querySelector(".kill").addEventListener('click', () => { passInstruction="kill" } ); }
    myBox.head.setAttribute( 'data-listener', "true" ); 
}

function spendHash( ns ) {
    var timeStamp = currentTimeInHHMMSS();
    var totalProduction = 0;
	for (var i=0 ; i < ns.hacknet.numNodes() ; i++ )
	{
        let node = ns.hacknet.getNodeStats(i);
        totalProduction += node.production;
	}
	
        if (ns.hacknet.hashCost("Exchange for Corporation Research")< ns.hacknet.numHashes() && (ns.args[1]=="corp" || ns.args[1]=="corpboth")) {
            ns.hacknet.spendHashes("Exchange for Corporation Research");
            log.push(timeStamp + ": Exchange for Corporation Research");
        }
		if (ns.hacknet.hashCost("Sell for Corporation Funds")< ns.hacknet.numHashes() && (ns.args[1]=="corpcash" || ns.args[1]=="corpboth") ) {
			ns.hacknet.spendHashes("Sell for Corporation Funds");
			log.push(timeStamp + ": Sell for Corporation Funds");
		}
/*        if (ns.hacknet.hashCost("Exchange for Bladeburner SP")< ns.hacknet.numHashes()) {
            ns.hacknet.spendHashes("Exchange for Bladeburner SP");
            log.push(timeStamp + ": Buying Exchange for Bladeburner SP");
        }
        if (ns.hacknet.hashCost("Exchange for Bladeburner Rank")< ns.hacknet.numHashes()) {
            ns.hacknet.spendHashes("Exchange for Bladeburner Rank");
            log.push(timeStamp + ": Buying Exchange for Bladeburner Rank");
        }*/
		if (ns.hacknet.hashCost("Exchange for Bladeburner SP") < ns.hacknet.numHashes() && ns.args[1]=="bb") {
			ns.hacknet.spendHashes("Exchange for Bladeburner SP");
			log.push(timeStamp + ": Buying Exchange for Bladeburner SP");
		}
		if (ns.hacknet.hashCost("Exchange for Bladeburner Rank") < ns.hacknet.numHashes() && ns.args[1]=="bb") {
			ns.hacknet.spendHashes("Exchange for Bladeburner Rank");
			log.push(timeStamp + ": Buying Exchange for Bladeburner Rank");
		}
	
	if (totalProduction < 1 && (ns.hacknet.numHashes()>4)) {
		ns.hacknet.spendHashes("Sell for Money");
		log.push(timeStamp + ": Buying money.");
	} else if ( (ns.hacknet.numHashes()-4)>(ns.hacknet.hashCapacity()*0.95) ) { // if at 95% stored cache sell for money
		var amtToBuy = Math.floor( (ns.hacknet.numHashes()-(ns.hacknet.hashCapacity()*0.95)) /4 );
		log.push(timeStamp + ": Buying money " + amtToBuy + " times." );
		for (var i=0 ; i < amtToBuy ; i++) {
			ns.hacknet.spendHashes("Sell for Money");
		}
    }
}

function doCache(ns, limit = 100) {
	for ( var i = 0 ; i < ns.hacknet.numNodes() ; i++ ) {
		if ( ns.hacknet.getCacheUpgradeCost( i, 1) < ((ns.getPlayer().money-reserve)*(limit/100)) ) {
			ns.hacknet.upgradeCache( i, 1 );
			log.push( `Upgrading cache on node ${i}.`);
		}
	}
}

function doUpgrade(ns, limit) {
	var nodes = [];
	var upgraded = false;
//	var curTime = () => { currentTimeInHHMMSS(); }
	var curTime = currentTimeInHHMMSS();

	for (var i = 0 ; i < ns.hacknet.numNodes() ; i++ ) {
		var node = ns.hacknet.getNodeStats(i); // cores, level, ram
		var mult = ns.getPlayer().hacknet_node_money_mult;


		var upgradeProd = { number: i, 
							level:  ns.formulas.hacknetServers.hashGainRate( node.level+1, 0, node.ram, node.cores, mult ) - ns.formulas.hacknetServers.hashGainRate( node.level, 0, node.ram, node.cores, mult ),
							ram:    ns.formulas.hacknetServers.hashGainRate( node.level, 0, (node.ram*2), node.cores, mult ) - ns.formulas.hacknetServers.hashGainRate( node.level, 0, node.ram, node.cores, mult ),
							cores: ns.formulas.hacknetServers.hashGainRate( node.level, 0, node.ram, node.cores+1, mult ) - ns.formulas.hacknetServers.hashGainRate( node.level, 0, node.ram, node.cores, mult ), 	
							server: ns.formulas.hacknetServers.hashGainRate( 1, 0, 1, 1 ) - 0,
							};
		var upgradeCost = { number: i,
							level: ns.hacknet.getLevelUpgradeCost( i, 1 ),
							ram: ns.hacknet.getRamUpgradeCost( i, 1 ),
							cores: ns.hacknet.getCoreUpgradeCost( i, 1 ),
							server: ns.hacknet.getPurchaseNodeCost(),
							};							
		var upgradePerMoney = { number: i,
							level: upgradeProd.level / upgradeCost.level,
							ram:   upgradeProd.ram / upgradeCost.ram,
							cores: upgradeProd.cores / upgradeCost.cores,
							server: upgradeProd.server / upgradeCost.level,
							};							
		nodes.push( [upgradeProd, upgradeCost, upgradePerMoney ] );
	}

	// Best affordable upgrade
	var bestLevel = 0; var bestRam = 0; var bestCores = 0;
	for (var i = 0 ; i < ns.hacknet.numNodes() ; i++ ) {
		if ( ((ns.getPlayer().money-reserve)*(limit/100)) > ns.hacknet.getLevelUpgradeCost( i, 1 ) ) {
			if ( nodes[i][2].level > nodes[bestLevel][2].level ) {
				bestLevel = i;
			}
		}
		if ( (((ns.getPlayer().money-reserve)*(limit/100)) > ns.hacknet.getRamUpgradeCost( i,1 )) ) {
			if ( nodes[i][2].ram > nodes[bestLevel][2].ram  ) {
				bestRam = i;
			}
		}
		if ( (((ns.getPlayer().money-reserve)*(limit/100)) > ns.hacknet.getCoreUpgradeCost( i,1 )) ) {
			if ( nodes[i][2].cores > nodes[bestLevel][2].cores  ) {
				bestCores = i;
			}
		}
	}

	if ( nodes[bestLevel][2].level > nodes[bestRam][2].ram ) { // level better ram
		if ( nodes[bestLevel][2].level > nodes[bestCores][2].cores ) { // level also better than cores
			// buy level
			if ((((ns.getPlayer().money-reserve)*(limit/100)) > ns.hacknet.getLevelUpgradeCost( bestLevel, 1 ))) {
				ns.hacknet.upgradeLevel( bestLevel, 1 );
				upgraded = true;
				log.push( `${curTime}: Upgrading node ${bestLevel} level.`);
			}
		} else {
			// buy cores
			if (((ns.getPlayer().money-reserve)*(limit/100)) > ns.hacknet.getCoreUpgradeCost( bestCores,1 )) {
				ns.hacknet.upgradeCore( bestCores, 1 );
				upgraded = true;
				log.push( `${curTime}: Upgrading node ${bestCores} cores.`);
			}
		}
	} else if ( nodes[bestRam][2].ram > nodes[bestCores][2].cores ) { // ram better than cores
		// buy ram
		if (((ns.getPlayer().money-reserve)*(limit/100)) > ns.hacknet.getRamUpgradeCost( bestRam,1 )) {
			ns.hacknet.upgradeRam( bestRam, 1 );
			upgraded = true;
			log.push( `${curTime}: Upgrading node ${bestRam} ram.`);
		}
	} else {
		// buy cores
		if (((ns.getPlayer().money-reserve)*(limit/100)) > ns.hacknet.getCoreUpgradeCost( bestCores,1 )) {
			ns.hacknet.upgradeCore( bestCores, 1 );
			upgraded = true;
			log.push( `${curTime}: Upgrading node ${bestCores} cores.`);
		}
	}
	/*	for (var i = 0 ; i < ns.hacknet.numNodes() ; i++ ) {
			var node = nodes[i];
			ns.print( `${node[0].number} ${fmt(node[0].level)} ${fmt(node[0].ram)} ${fmt(node[0].cores)} ${fmt2(node[2].level)} ${fmt2(node[2].ram)} ${fmt2(node[2].cores)}` );
		}*/
	//		ns.print( `Best - Level ${bestLevel} Ram ${bestRam} Cores ${bestCores}`);
	return upgraded;
}

function fmt( a ) {
	return (Math.round( a * 1000 ) / 1000);
}

function fmt2( a ) {
	return a;
	return (Math.round( a * 100000000000 ) / 100000000000);
}


/*
  var stockItem = {
        sym : sym,
        tick : tick,
        value : ( ns.stock.getAskPrice(sym) + ns.stock.getBidPrice(sym) ) / 2,
        volume : ns.stock.getMaxShares(sym),
        delta : 0,
        gainPercentage : 0,
        gainFromPreviousTick : 0,
        rating : 0,
        forecast : fcast,
		*/