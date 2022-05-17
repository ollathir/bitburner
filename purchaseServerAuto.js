import { tableToHTMLString, printBox, printBox2,printTable, currentTimeInHHMMSS } from "printTable.js";
import { formatMem } from "functions.js";
/** @param {NS} ns **/

var log=[];
var myBox=null;
var passInstruction="run";
var reserve=0;
var percentageSpendLimit = 50;


export async function main(ns) {
  // Aims to continuously upgrade purchased servers. After each purchase it will run hackScript which.
  const args = ns.flags([["help", false], ["size", 8]]);
  ns.print( "Test " + ns.args[0] );

  if (ns.args[0] == "help") {
    ns.tprint("Usage: <funds> <script>");
    ns.tprint("<funds> max % of funds to use. If <funds> is greater than 100 this will instead be the reserve funds not to be spent.");
    return;
  }
  if (isNaN(ns.args[0])) {
    percentageSpendLimit = 50;
    reserve = 0;
  }
  else {
    if (ns.args[0] > 100) {
      percentageSpendLimit = 100;
      reserve = ns.args[0];
    } else {
      percentageSpendLimit = ns.args[0];
      reserve = 0;
    }
  }

  ns.print( "Reserve: " + ns.nFormat(reserve,"0.000a") );
  ns.print( "Percentage spend limit: " + percentageSpendLimit + "%" );

//  return;
  ns.disableLog("ALL");
  //ns.tail();
  ns.clearLog();

  const limit = ns.getPurchasedServerLimit();


  passInstruction = "run";
  while (passInstruction!="kill") {
    var maxFunds = ns.getServerMoneyAvailable("home") * (percentageSpendLimit / 100);
    var curFunds = ns.getPlayer().money;
    var purchasedServers = ns.getPurchasedServers();
    var owned = purchasedServers.length;
    var tobuy = ns.getPurchasedServerLimit() - purchasedServers.length;
    var havePurchased = false;

    // buy the biggest server we can until max servers reached
    if (tobuy >= 1) {
      for (var i = 20; i > 2; i--) { // min 8Gb server
        var serverCost = ns.getPurchasedServerCost(Math.pow(2, i));
        if (serverCost < (maxFunds-reserve) && !havePurchased) {

          var serverName = "pserv-" + (purchasedServers.length + 1);
          ns.purchaseServer(serverName, Math.pow(2,i) );
          log.push( currentTimeInHHMMSS() + ": Purchased new " + ns.nFormat(Math.pow(2,i),"0.000a") +" server " + serverName + "(" + ns.nFormat(serverCost,"0.000a") + ").");
          havePurchased = true; 
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
          if ((serverCost < (maxFunds-reserve)) && (size > purServRam) && !havePurchased) // have the money, bigger server...
          {
            var servName = purchasedServer;
            ns.killall(servName);
            ns.deleteServer(servName);
            ns.purchaseServer(servName, size);

            log.push( currentTimeInHHMMSS() + ": Upgraded " + servName + " from " + ns.nFormat(purServRam, "0.000a") + " to " + ns.nFormat(size, "0.000a") + " at a cost of " + ns.nFormat(serverCost,"0.000a"));
            havePurchased = true;
          }
        }
      }
    }

    await display(ns, maxFunds);

    await ns.sleep(1000);
  }
  //ns.tprint("All servers purchased.");
  myBox.remove();
  ns.tail();
}

async function display(ns, maxFunds) {
// Display
    var serversList = [];
    for (var i = 0 ; i <= 20 ; i++) {
      if (i==20) {
        var serverObject = { size:Math.pow(2,i), costToUpgrade:"MAX", names:[] }  
      } else {
        var serverObject = { size:Math.pow(2,i), costToUpgrade:ns.getPurchasedServerCost(Math.pow(2,i+1)), names:[] };  
      }
      serversList.push( serverObject );
    }

    var purchasedServers = ns.getPurchasedServers();
    for (var pServ of purchasedServers) {
      var serverObject = serversList[serversList.map((el) => el.size).indexOf(ns.getServerMaxRam(pServ))];
      serverObject.names.push(pServ);
    }

    var table = [["Size", "Cost to Upgrade", "Servers"]];
    for (var i=0 ; i<=20 ; i++) {
      var serverObject = serversList[i];
      if (serverObject.names.length==0) { continue; }
      if (isNaN(serverObject.costToUpgrade)) {
        //var tableRow = [ns.nFormat(serverObject.size,"0.000a")+ " GB", "MAX", serverObject.names.length];
        var tableRow = [formatMem(serverObject.size), "MAX", serverObject.names.length];
      } else {
        var tableRow = [formatMem(serverObject.size), "$"+ns.nFormat(serverObject.costToUpgrade,"0.000a"), serverObject.names.length];
      }
      table.push(tableRow);
    }
    ns.clearLog();
//    ns.print(`Max spend: ${ns.nFormat(maxFunds, "0.000a")} Max RAM:${ns.nFormat(ns.getPurchasedServerMaxRam(),"0.000a")}`);
    ns.print(`Max spend: ${ns.nFormat(maxFunds, "0.000a")} Max RAM:${formatMem(ns.getPurchasedServerMaxRam())}`);
    var myData = `Max spend: ${ns.nFormat(maxFunds, "0.000a")} Max RAM:${formatMem(ns.getPurchasedServerMaxRam())}`;
    myData += `Spend no more than ${percentageSpendLimit}% of funds, keeping a ${ns.nFormat(reserve,"0.000a")} reserve.`;
    await printTable( ns, table);
    myData += tableToHTMLString( table );

    for (var i=(log.length-1) ; i >= (log.length-4) && i>=0 ; i-- )
    {
        ns.print(log[i]);
        myData += "<br>" + log[i];
    }

    myBox = printBox2( "purchaseServerAuto " + ns.args[0], myData );
  	if (!myBox.head.getAttribute("data-listener")) { myBox.head.querySelector(".kill").addEventListener('click', () => { passInstruction="kill" } ); }
    myBox.head.setAttribute( 'data-listener', "true" ); 
}