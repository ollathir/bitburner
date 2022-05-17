import { printTable, currentTimeInHHMMSS } from "printTable.js";
/** @param {NS} ns **/



export async function main(ns) {
  // Aims to continuously upgrade purchased servers. After each purchase it will run hackScript which.
  const args = ns.flags([["help", false], ["size", 8]]);

  if (ns.args[0] == "help") {
    ns.tprint("Usage: <funds> <script>");
    ns.tprint("<funds> max % of funds to use.");
    ns.tprint("<script> which hack script to use.");
    return;
  }
  if (isNaN(ns.args[0])) {
    var percentageSpendLimit = 50;
  }
  else {
    var percentageSpendLimit = ns.args[0];
  }

  if (ns.args[1]) {
    var hackScript = ns.args[1];
  } else {
    hackScript = "hackall-bs2.js";
  }

  ns.disableLog("ALL");
  ns.tail();
  ns.clearLog();
  var log=[];

  const limit = ns.getPurchasedServerLimit();
  var tick=0;
  var restartScripts=false;
  while (true) {
    var maxFunds = ns.getServerMoneyAvailable("home") * (percentageSpendLimit / 100);
//    ns.tprint(maxFunds + " " + ns.getServerMoneyAvailable("home") + " " + percentageSpendLimit);
    var purchasedServers = ns.getPurchasedServers();
    var owned = purchasedServers.length;
    var tobuy = ns.getPurchasedServerLimit() - purchasedServers.length;
    var havePurchased = false;

    // buy the biggest server we can until max servers reached
    if (tobuy >= 1) {
      for (var i = 20; i > 2; i--) { // min 8Gb server
        var serverCost = ns.getPurchasedServerCost(Math.pow(2, i));
        if (serverCost < maxFunds && !havePurchased) {
          var serverName = "pserv-" + (purchasedServers.length + 1);
          ns.purchaseServer(serverName, Math.pow(2,i) );
          log.push( currentTimeInHHMMSS() + ": Purchased new " + ns.nFormat(Math.pow(2,i),"0.000a") +" server " + serverName + "(" + ns.nFormat(serverCost,"0.000a") + ").");
          havePurchased = true; restartScripts=true;
        }
      }
    }
    else {
      // can we upgrade?
      for (var purchasedServer of purchasedServers) {
        var purServRam = ns.getServerMaxRam(purchasedServer);
        if (ns.getPurchasedServerMaxRam() == purServRam) { continue; } // already max RAM, skip.

        if (havePurchased) { continue; } // already purchased or upgraded a server this cycle, skip.

        for (var i = 20; i > 1; i--) {
          var size = Math.pow(2, i);
          var serverCost = ns.getPurchasedServerCost(size);

         // ns.print( `ServerCost ${ns.nFormat(serverCost,"0.000a")} maxFunds ${ns.nFormat(maxFunds,"0.000a")}` );
         // ns.print( `size ${size} existing size ${purServRam}`);
          if ((serverCost < maxFunds) && (size > purServRam) && !havePurchased) // have the money, bigger server...
          {
            var servName = purchasedServer;
            ns.killall(servName);
            ns.deleteServer(servName);
            ns.purchaseServer(servName, size);

            log.push( currentTimeInHHMMSS() + ": Upgraded " + servName + " from " + ns.nFormat(purServRam, "0.000a") + " to " + ns.nFormat(size, "0.000a") + " at a cost of " + ns.nFormat(serverCost,"0.000a"));
            havePurchased = true; restartScripts=true;
          }
        }
      }
    }

    var myServers = ns.getPurchasedServers();
    var table = [["Server", "MaxRAM", "Cost to Upgrade"]];
    for (var myServer of myServers) {
      var tablerow = [myServer, ns.nFormat(ns.getServerMaxRam(myServer), "0.000a")];
      // cost to upgrade 
      var nextLevel = ns.getServerMaxRam(myServer)*2;
      var costToUpgrade = ns.getPurchasedServerCost(nextLevel);
      tablerow.push(ns.nFormat(costToUpgrade,"0.000a"));
      table.push(tablerow);
    }
    ns.clearLog();
    ns.print(`Tick: ${tick} Max spend: ${ns.nFormat(maxFunds, "0.000a")} Max RAM:${ns.nFormat(ns.getPurchasedServerMaxRam(),"0.000a")}`);

    await printTable(ns, table);

    for (var i=(log.length-1) ; i >= (log.length-4) && i>=0 ; i-- )
    {
        ns.print(log[i]);
    }

    await ns.sleep(1000);
    tick++;
    if (tick >= 600) 
    { // only restart scripts every two minutes
      tick=0;
      if (restartScripts) { 
        log.push(currentTimeInHHMMSS() + ": Restarting scripts.");
      //  ns.exec(hackScript, "home", 1); 
        restartScripts=false;
      }
    }
  }
  ns.tprint("All servers purchased.");
}