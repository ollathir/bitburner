/** @param {NS} ns */
import {convertMSToHHMMSS, printTable, printTableF} from "printTable.js";
import {list_servers, list_hack_servers} from "getServers.js";
import {deploy_hack, fmt} from "functions.js";


export async function main(ns) {
	ns.tail();
	ns.disableLog("ALL");

	while (true){
		const servers = await list_hack_servers(ns, 0.8);
		const purchasedServers = await ns.getPurchasedServers();
		const player = ns.getPlayer();

		// Sort currentTargets by max server cash
        var len = servers.length;
        var bSwap=true;
        while (bSwap)
        {
            bSwap=false;
            for (var i = 1 ; i <= (len-1) ; i++ )
            {
                if ( ns.getServerMaxMoney(servers[i-1]) < ns.getServerMaxMoney(servers[i]) )
                {
                    var tempCurrentTarget=servers[i-1];
                    servers[i-1] = servers[i];
                    servers[i] = tempCurrentTarget;
                    bSwap=true;
                }
            }
        }


		var table = [];
		var tablerow=["Target", "growTime", "weakenTime", "hackTime", "hackChance", "currentMoney", "maxMoney", "growPerReq", "growThreadsReq", "growSecInc"];
		table.push(tablerow);
		for (var server of servers) {
			var target=ns.getServer(server);
			var vGrowTime = ns.formulas.hacking.growTime(target, player );
			var vWeakenTime = ns.formulas.hacking.weakenTime(target, player );
			var vHackTime = ns.formulas.hacking.hackTime(target, player);
			var vHackChance = ns.formulas.hacking.hackChance(target, player);

			var currentMoney = ns.getServerMoneyAvailable(server);
			var maxMoney = ns.getServerMaxMoney(server);
			var growPerReq = Math.floor((maxMoney / currentMoney)*100);
			if ( !isFinite(growPerReq) ) { growPerReq=1 };
			if (isNaN(growPerReq) || (growPerReq==0) || (growPerReq<1) ) {
				growPerReq=0; var growThreadsReq=0;
			} else {
				var growThreadsReq = ns.growthAnalyze( server, growPerReq );
			}
			var growSecInc = ns.growthAnalyzeSecurity(growThreadsReq);

			var currentSec = ns.getServerSecurityLevel(server);
			var minSec = ns.getServerMinSecurityLevel(server);

			// ns.weakenAnalyze( threads, cores) : the security decrease that would occur.

			ns.clearLog();


			var tableRow = [];
			tableRow.push( server );
			tableRow.push( convertMSToHHMMSS(vGrowTime) );
			tableRow.push( convertMSToHHMMSS(vWeakenTime) );
			tableRow.push( convertMSToHHMMSS(vHackTime) );
			tableRow.push( ns.nFormat(vHackChance*100,"0") + "%" );
			tableRow.push( "$"+ns.nFormat( currentMoney, "0.000a" ));
			tableRow.push( "$"+ns.nFormat( maxMoney, "0.000a" ));
			tableRow.push( fmt(growPerReq) );
			tableRow.push( fmt(growThreadsReq) );
			tableRow.push( fmt( growSecInc ));

			table.push( tableRow );

		}
		await printTable( ns, table );

		await ns.sleep(100);
	}
}