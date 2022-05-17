/** @param {NS} ns */
import {printTable, tableToHTMLString, printBox2} from "printTable.js";
import {convertMSToHHMMSS, nf} from "functions.js";

var myBox=null;
var passInstruction="";

export async function main(ns) {
	//ns.tail();
	ns.disableLog("ALL"); ns.clearLog();
	passInstruction="run";
	while (passInstruction!="kill") {
		for (var hackingAug of hackingAugs) {
			if (ns.grafting.getGraftableAugmentations().indexOf(hackingAug)>-1 && ns.args[0]=="buy") {
				// enough money?
				if (ns.grafting.getAugmentationGraftPrice(hackingAug) < ns.getPlayer().money) {
					if (!ns.singularity.isBusy()) {
						ns.grafting.graftAugmentation(hackingAug, false);
					}
				}
			}
		}
		display(ns);
		await ns.sleep(1000);
	}
	myBox.remove();
	ns.tail();
}

function display(ns) {
    var myData = ""; 

	var table = [["Name", "Cost", "Time", "HackExpMulti", "HackMulti"]];
	for (var hackingAug of hackingAugs) {
		if (ns.grafting.getGraftableAugmentations().indexOf(hackingAug)>-1) {
			var tableRow = [];
			tableRow.push( hackingAug );
			tableRow.push( ns.nFormat( ns.grafting.getAugmentationGraftPrice(hackingAug), "0.000a") );
			tableRow.push(  convertMSToHHMMSS( ns.grafting.getAugmentationGraftTime(hackingAug) ) ); 
			var stats = ns.singularity.getAugmentationStats(hackingAug);
			if (stats.hacking_exp_mult) {
				tableRow.push( nf((stats.hacking_exp_mult-1)*100) );
			} else {
				tableRow.push("");
			}
			if (stats.hacking_mult) {
				tableRow.push( nf((stats.hacking_mult-1)*100) );
			} else {
				tableRow.push( "" );
			}
			table.push( tableRow );
		}
	}
	myData += tableToHTMLString(table);

    myBox = printBox2( "VitaLife", myData );
  	if (!myBox.head.getAttribute("data-listener")) { myBox.head.querySelector(".kill").addEventListener('click', () => { passInstruction="kill" } ); }

}

const hackingAugs = [
'Artificial Bio-neural Network Implant', 
'Artificial Synaptic Potentiation', 
'BitRunners Neurolink', 
'BitWire', 
'Cranial Signal Processors - Gen I', 
'Cranial Signal Processors - Gen II', 
'Cranial Signal Processors - Gen III', 
'Cranial Signal Processors - Gen V', 
'CRTX42-AA Gene Modification', 
'Embedded Netburner Module', 
'Embedded Netburner Module Core Implant', 
'Embedded Netburner Module Core V2 Upgrade', 
'Embedded Netburner Module Core V3 Upgrade', 
'Enhanced Myelin Sheathing', 
'FocusWire', 
'Neural Accelerator', 
'Neural-Retention Enhancement', 
'Neuralstimulator', 
'Neuregen Gene Modification', 
'Neuronal Densification', 
'Neurotrainer I', 
'Neurotrainer II', 
'Neurotrainer III', 
'nextSENS Gene Modification', 
'OmniTek InfoLoad', 
'PC Direct-Neural Interface', 
'PC Direct-Neural Interface NeuroNet Injector', 
'PC Direct-Neural Interface Optimization Submodule', 
'Power Recirculation Core', 
'QLink', 
'SPTN-97 Gene Modification', 
'The Black Hand', 
'Xanipher', 
];