/** @param {NS} ns */
import {printTable} from "printTable.js";


export async function main(ns) {
	var blackOps = ns.bladeburner.getBlackOpNames();
	ns.tail(); 
	ns.disableLog("ALL");

	while (true) {
		if ( ns.bladeburner.getCurrentAction().type == "Idle" ) {
			ns.bladeburner.startAction( "BlackOp", nextBlackOp(ns) );
		}

		var table = [];
		for (var blackOp of blackOps) {
			var tableRow = [];
			if ( ns.bladeburner.getCurrentAction().name == blackOp ) {
				tableRow.push( blackOp +"*" );
			} else {
				tableRow.push( blackOp );
			}
			tableRow.push( ns.bladeburner.getBlackOpRank(blackOp) );				
			tableRow.push( ns.bladeburner.getActionCountRemaining("BlackOp", blackOp) );
			tableRow.push( Math.round(ns.bladeburner.getActionEstimatedSuccessChance("BlackOp", blackOp)[0]*100)+"%" );
			tableRow.push( Math.round(ns.bladeburner.getActionEstimatedSuccessChance("BlackOp", blackOp)[1]*100)+"%" );
			table.push ( tableRow );
		}
		ns.clearLog();
		ns.print( "Current action: [" + ns.bladeburner.getCurrentAction().type + "] " + ns.bladeburner.getCurrentAction().name );
		ns.print( "Next black op: " + nextBlackOp(ns));

		await printTable( ns, table );
		await ns.sleep(100);
	}
}

function nextBlackOp(ns) {
	for (var blackOp of ns.bladeburner.getBlackOpNames() ) {
		if (ns.bladeburner.getActionCountRemaining("BlackOp", blackOp) == 1 ) return blackOp;
	}
	return null;
}