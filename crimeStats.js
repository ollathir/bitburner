import {printTable, convertMSToHHMMSS} from "printTable.js";

const crimeNames=["shoplift", "rob store", "mug someone", "larceny", "deal drugs", "bond forgery", "traffick illegal arms", "homicide", "grand theft auto", "kidnap and ransom", "assassinate", "heist"];

/** @param {NS} ns */
export async function main(ns) {
	var table=[["crime", "chance", "time", "karma", "money", "karma/sec", "money/sec"]];
	
	for (var crime of crimeNames) {
		var tableRow = [];
		var crimeStats = ns.singularity.getCrimeStats(crime);
		tableRow.push( crime );
		tableRow.push( Math.round(ns.singularity.getCrimeChance(crime)*100) );
		tableRow.push( convertMSToHHMMSS(crimeStats.time) );
		tableRow.push( crimeStats.karma );
		tableRow.push( ns.nFormat(crimeStats.money,"0.000") );
		var karmaPerMS = crimeStats.karma / crimeStats.time;
		var moneyPerMS = crimeStats.money / crimeStats.time;
		var karmaPerSec = ns.nFormat((karmaPerMS*1000),"0.00");
		var moneyPerSec = ns.nFormat((moneyPerMS*1000),"0.00");
		tableRow.push( karmaPerSec );
		tableRow.push( moneyPerSec );
		table.push( tableRow );		
	}
	ns.tail();
	ns.disableLog("ALL");
	ns.clearLog();
	printTable(ns,table);
}