/** @param {NS} ns **/
import {printTable, tableToHTMLString, printBox} from "printTable.js";
import {convertMSToHHMMSS, findBox} from "functions.js";


// buyForecast, shortForecast, fundsReserve, minPurchasePrice, holdingsPerFund, holdingsLimit

const buyForecast = 0.6;
const shortForecast = 0.4;
const sellAt = 1.03;
const lossLimitAbsolute = 0.95;
const lossLimitFalling = 0.97;
const minPurchasePrice = 10000000; // 10m

//const fundsReserve = 50000000; // 50m
//const fundsReserve = 1000000000; // 1bn
var fundsReserve = 100000000000; // 100bn
//const holdingsPerFund = 5000000000; // 5bn
//const holdingsPerFund = 20000000000; // 20bn
//const holdingsPerFund = 30000000000; // 30bn
var holdingsPerFund = 500000000000; // 500bn
var totalEarnings = 0;    
var holdingsLimit = 2000000000000; // limit to max amount of stocks held - 2tn
var portfolio = false;

var log=[];

function scaleLimits(ns) {
    holdingsLimit = (ns.getPlayer().money + totalStocksValue(ns)) * 1;
    fundsReserve = (ns.getPlayer().money + totalStocksValue(ns)) * 0.05;
    holdingsPerFund = holdingsLimit * 0.25;
}

export async function main(ns) 
{
	const syms = ns.stock.getSymbols();

    ns.disableLog("ALL")
	ns.clearLog();
	//ns.tail();

    if (ns.args[0] == "portfolio") {
        portfolio = true;
    }

    if (!isNaN(ns.args[0])) { holdingsLimit = ns.args[0]; }

	while (true)
	{
        scaleLimits(ns);
		for (var sym of syms) {
            buyStock2(ns, sym);
            sellStock(ns,sym);
        }
     
        ns.clearLog();
        await summary(ns, portfolio);
    
        // display log
        ns.print( "Log: " );
        for (var i = (log.length-1); i > (log.length-10) ; i--) {
            if (i<0) { continue; }
            ns.print( log[i] );
        }

		await ns.sleep(6000);
	}
}

function totalValueOfAllStocks( ns ) {
    var syms = ns.stock.getSymbols();
    var totalValue = 0;
    for (var sym of syms) {
        totalValue += ns.stock.getMaxShares(sym) * ns.stock.getBidPrice(sym);
    }
    return totalValue;
}


async function summary(ns, portfolio = false)
{
	var stocks = [];
	var list = ["SYM", "Bid", "Ask", "Forecast", "Volatility", "Owned", "Avg Pur", "Gain", "Total Purchase", "Gain", "Server", "Hack time", "Grow time"];
	stocks.push(list);
    var syms = ns.stock.getSymbols();

	for (var sym of syms)
	{
		if (ns.stock.getBidPrice(sym) > 1 ) 
		{
			var list = [];
			var forecast = ns.stock.getForecast(sym);

            var myPos = ns.stock.getPosition(sym);
            var myStock = myPos[0] + myPos[2];
            if (portfolio && myStock == 0) { continue; }

			list[0] = sym;
			list[1] = ns.nFormat(ns.stock.getBidPrice(sym), "0.000a");
            list[2] = ns.nFormat(ns.stock.getAskPrice(sym), "0.000a");
			list[3] = ns.nFormat(forecast*100,"0.00") + "%";
			list[4] = ns.nFormat( ns.stock.getVolatility(sym)*100, "0.00" )+"%";
            var myPos = ns.stock.getPosition(sym);
            if (myPos[0]>0) {
                var purPrice = myPos[0] * myPos[1];
                var gain = ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long");
                var gainPer = ((gain-purPrice) / purPrice);                
                //var st = ns.stock.getPosition(sym);
                var curHolding = ns.nFormat( ((myPos[0]+myPos[2]) / ns.stock.getMaxShares(sym)), "0%" );
				list[5] = ns.nFormat(myPos[0],"0.000a") + " (" + curHolding + ")";
    			list[6] = ns.nFormat(myPos[1],"0.000a");
                list[7] = ns.nFormat(gain-purPrice, "0.000a");
                if (purPrice>0 && !isNaN(purPrice)) 
				{
                    list[8] = ns.nFormat(purPrice, "0.000a"); 
				}
                if (!isNaN(gainPer)) 
				{
                    var myGain = ns.nFormat((gainPer)*100,"0.00");
                    list[9] = myGain + "%";
                }
            } 
			if (myPos[2]>0) {
                var purPrice = myPos[2] * myPos[3];
                var gain = ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[2], "Short");
                var gainPer = ((gain-purPrice) / purPrice);                
                var curHolding = ns.nFormat( ((myPos[0]+myPos[2]) / ns.stock.getMaxShares(sym)), "0%" );
				list[5] = ns.nFormat(myPos[2]*-1,"0.000a") + ` (${curHolding})`;
    			list[6] = ns.nFormat(myPos[3],"0.000a");
                list[7] = ns.nFormat(gain-purPrice, "0.000a");
                if (purPrice>0 && !isNaN(purPrice)) 
				{
                    list[8] = ns.nFormat(purPrice, "0.000a"); 
				}
                if (!isNaN(gainPer)) 
				{
                    var myGain = ns.nFormat((gainPer)*100,"0.00");
                    list[9] = myGain + "%";
                }
            }
            if (myPos[0]==0 && myPos[2]==0)
			{
                list[5] = "-";
                list[6] = "-";
                list[7] = "-";
                list[8] = "-";
                list[9] = "-";
            }

            var target = lookupServer(sym);
            if (target != null) {
                list.push( lookupServer(sym) );
                list.push( convertMSToHHMMSS( ns.formulas.hacking.hackTime( ns.getServer(lookupServer(sym)), ns.getPlayer() ) ) );
                list.push( convertMSToHHMMSS( ns.formulas.hacking.growTime( ns.getServer(lookupServer(sym)), ns.getPlayer() ) ) );
            } else {
                list.push( "" );
            }

			stocks.push(list);
		}
	}

    var totalSaleValue=0; var totalPurchase=0;
    for (var sym of syms)
    {
        myPos = ns.stock.getPosition(sym);
        totalSaleValue += ns.stock.getSaleGain(sym, myPos[0], "Long" );
        totalSaleValue += ns.stock.getSaleGain(sym, myPos[2], "Short" );


        totalPurchase += myPos[0] * myPos[1];
        totalPurchase += myPos[2] * myPos[3];
    }

    ns.print( `Total value of owned stocks ${ns.nFormat(totalSaleValue,"0.000a")}, purchased for ${ns.nFormat(totalPurchase,"0.000a")}`);
    ns.print( `Total value of all available stocks on the market: ${ns.nFormat(totalValueOfAllStocks(ns),"0.000a")}`);
    ns.print( `>> Buy Forecast: ${buyForecast} << >> Short Forecast ${shortForecast} <<`);
    ns.print( `>> Reserve funds ${ns.nFormat(fundsReserve,"0.000a")} << >> Minimum purchase price: ${ns.nFormat(minPurchasePrice,"0.000a")} << >> Max holdings per fund: ${ns.nFormat(holdingsPerFund,"0.000a")} << >> Max holdings: ${ns.nFormat(holdingsLimit,"0.000a")} <<`);

// buyForecast, shortForecast, fundsReserve, minPurchasePrice, holdingsPerFund, holdingsLimit

    await printTable(ns, stocks);

// Make a new display window 
    var myData = ""; //await printTable(ns, stocks);
    var table=stocks;

    myData += `<table cellspacing="5" cellpadding="1" border="1">`;
    myData += `<tr>`;
    myData += `<td>Total value of owned stocks</td><td> ${ns.nFormat(totalSaleValue,"0.000a")}</td><td>Purchased for</td><td> ${ns.nFormat(totalPurchase,"0.000a")}</td><td>Profit</td><td>${ns.nFormat(totalSaleValue-totalPurchase,"0.000a")}</td></tr>`;
    ;
    myData += `<tr><td>Total market value</td><td>${ns.nFormat(totalValueOfAllStocks(ns),"0.000a")}</td><td>Buy forecast</td><td>${buyForecast}</td><td>Short forecast</td><td>${shortForecast}</td></tr>`;
    myData += `<tr><td>Reserve funds</td><td>${ns.nFormat(fundsReserve,"0.000a")}</td><td>Minimum purchase price</td><td>${ns.nFormat(minPurchasePrice,"0.000a")}</td><td>Max holdings per fund</td><td>${ns.nFormat(holdingsPerFund,"0.000a")}</td><td>Max holdings</td><td>${ns.nFormat(holdingsLimit,"0.000a")}</td></tr>`;
   // ns.print( `>> Buy Forecast: ${buyForecast} << >> Short Forecast ${shortForecast} <<`);
   // ns.print( `>> Reserve funds ${ns.nFormat(fundsReserve,"0.000a")} << >> Minimum purchase price: ${ns.nFormat(minPurchasePrice,"0.000a")} << >> Max holdings per fund: ${ns.nFormat(holdingsPerFund,"0.000a")} << >> Max holdings: ${ns.nFormat(holdingsLimit,"0.000a")} <<`);
    myData += "</table>";

    myData += tableToHTMLString( table );

    // print log
    myData += `<table border="2">`;
    
    myData += "<tr><td>Log</td></tr>";
    for (var i = (log.length-1); i > (log.length-10) ; i--) {
        if (i<0) { continue; }
        myData += "<tr><td>" + log[i] + "</td></tr>";
    }

    var myBox = printBox( "Stock Summary", myData );
    exitRoutine(ns);

    if (!myBox.body.getAttribute("data-listener")) { 
        //myBox.body.addEventListener('click', listener );
    }
    myBox.body.setAttribute( 'data-listener', "0" ); // should send the event and the pid number to listener            
/*    var head = myBox.getElementsByClassName( "head" );
    ns.print( myBox.children[0].classList );
    var btn = document.createTextNode("Kill");
    var bMatch = false;
    for (var i = 0 ; i < myBox.children[0].children.length ; i++ ) {
        if (myBox.children[0].children[1].title=="Kill") { bMatch = true; }
    }
    if (!bMatch) {
        myBox.children[0].appendChild(btn);
    }*/

    return myBox;
}

function totalStocksValue(ns)
{
    const syms = ns.stock.getSymbols();
    var totalStocks=0;
    for (var sym of syms)
    {
        var myPos = ns.stock.getPosition(sym);
        totalStocks += (myPos[0] * myPos[1]);
        totalStocks += (myPos[2] * myPos[3]);
    }

    return totalStocks;
}

function buyStock2( ns, sym ) {
    var timeStamp = convertMSToHHMMSS( (new Date().getTime()) );    
    var position = ns.stock.getPosition(sym);
    var currentExposure = (position[0]*position[1]) + (position[2]*position[3]);

    // Have we reached any limits?
    if (totalStocksValue(ns) >= holdingsLimit) { return };
    if (currentExposure >= holdingsPerFund) { return };

    // Do we want to buy?
    var forecast = ns.stock.getForecast(sym);
    if (forecast < buyForecast && forecast > shortForecast ) { return };

    // How much more cash do we want to invest?
    var availableFunds = ns.getPlayer().money - fundsReserve - 100000; 
    var fundsForStock = holdingsPerFund - currentExposure;
    if (fundsForStock > availableFunds) { 
        fundsForStock = availableFunds;
    }

    if ( (fundsForStock + totalStocksValue(ns)) > holdingsLimit) {
        fundsForStock = holdingsLimit - totalStocksValue(ns);
    }
    if (fundsForStock<0) { return; }

    // how much can we buy?
    var stockToBuy = Math.round( (fundsForStock) / ns.stock.getAskPrice(sym) );
    
    // is this more than is available?
    if ( (stockToBuy+position[0]+position[2]) > ns.stock.getMaxShares(sym) ) {
        stockToBuy = ns.stock.getMaxShares(sym) - position[0] - position[2];
    }
    if ( stockToBuy <= 0 ) { return; }

    if (forecast > buyForecast) { // Rising stock
        var costPrice = ns.stock.getPurchaseCost( sym, stockToBuy, "Long" );
        if (costPrice < minPurchasePrice) { // Does not reach our minimum transaction limit
            return; 
        }
        var totPur = ns.stock.buy( sym, stockToBuy );
        log.push( timeStamp + ": Buying " + ns.nFormat(stockToBuy,"0.000a") + " shares in " + sym + " at " + ns.nFormat(totPur, "0.000a") + " per share (" + ns.nFormat(stockToBuy*totPur,"0.000a") + ")" );
    } 
    
    if (forecast < shortForecast) { // Falling stock
        var costPrice = ns.stock.getPurchaseCost( sym, stockToBuy, "Short" );
        if (costPrice < minPurchasePrice) { // Does not reach our minimum transaction limit
            return; 
        }
        var totPur = ns.stock.short( sym, stockToBuy );
        log.push( timeStamp + ": Shorting " + ns.nFormat(stockToBuy,"0.000a") + " shares in " + sym + " at " + ns.nFormat(totPur, "0.000a") + " per share (" + ns.nFormat(stockToBuy*totPur,"0.000a") + ")" );
    }
}

function buyStock( ns, sym )
{
	var forecast = ns.stock.getForecast(sym);
    var timeStamp = convertMSToHHMMSS( (new Date().getTime()) );
                
	// Strong earner, buy!
	if ( (forecast >= buyForecast) )//&& (ns.stock.getPosition(sym).shares < 1) ) 
    {
        var funds = holdingsLimit - totalStocksValue(ns);


        if (funds<0) { funds = 0; }
        if (funds > ns.getServerMoneyAvailable("home")) { funds = ns.getServerMoneyAvailable("home") }
        funds -= 100000; // trading fee;
        funds -= fundsReserve; // cash reserve.
     
        var owned = ns.stock.getPosition(sym)[0];
        var valueOwned = ns.stock.getPosition(sym)[0] * ns.stock.getPosition(sym)[1];

        // how much should we buy? 
        var stockToBuy = Math.round( (funds) / ns.stock.getAskPrice(sym) );

        if (stockToBuy>(ns.stock.getMaxShares(sym)-owned)) { 
            stockToBuy = ns.stock.getMaxShares(sym) - owned; }
        var expectedPrice = stockToBuy * ns.stock.getAskPrice(sym);

        if ( (expectedPrice+valueOwned) > holdingsPerFund ) {
            stockToBuy = (holdingsPerFund - valueOwned) / ns.stock.getAskPrice(sym);
        }

        if (!isNaN(stockToBuy) && stockToBuy>0 && expectedPrice > minPurchasePrice) { // set min purchased value to offset trading fee.
			var totPur = ns.stock.buy( sym, stockToBuy ); 
            log.push( timeStamp + ": Buying " + ns.nFormat(stockToBuy,"0.000a") + " shares in " + sym + " at " + ns.nFormat(totPur, "0.000a") + " per share (" + ns.nFormat(stockToBuy*totPur,"0.000a") + ")" );
        }
	}
    if ( ( forecast <= shortForecast ) ) {
        var funds = holdingsLimit - totalStocksValue(ns);
        if (funds<0) { funds = 0; }
        if (funds > ns.getServerMoneyAvailable("home")) { funds = ns.getServerMoneyAvailable("home") }
        funds -= 100000; // trading fee;
        funds -= fundsReserve; // cash reserve.
     
        var owned = ns.stock.getPosition(sym)[2];
        var valueOwned = ns.stock.getPosition(sym)[2] * ns.stock.getPosition(sym)[3];

        // how much should we buy? 
        var stockToBuy = Math.round( (funds) / ns.stock.getAskPrice(sym) );

        if (stockToBuy>(ns.stock.getMaxShares(sym)-owned)) { 
            stockToBuy = ns.stock.getMaxShares(sym) - owned; }
        var expectedPrice = stockToBuy * ns.stock.getAskPrice(sym);

        if ( (expectedPrice+valueOwned) > holdingsPerFund ) {
            stockToBuy = (holdingsPerFund - valueOwned) / ns.stock.getAskPrice(sym);
        }

        if (!isNaN(stockToBuy) && stockToBuy>0 && expectedPrice > minPurchasePrice) { // set min purchased value to offset trading fee.
			var totPur = ns.stock.short( sym, stockToBuy ); 
            log.push( timeStamp + ": Shorting " + ns.nFormat(stockToBuy,"0.000a") + " shares in " + sym + " at " + ns.nFormat(totPur, "0.000a") + " per share (" + ns.nFormat(stockToBuy*totPur,"0.000a") + ")" );
        }
    }
}

function sellStock( ns, sym )
{
	var forecast = ns.stock.getForecast(sym);
    var timeStamp = convertMSToHHMMSS( (new Date().getTime()) );

    // Profit, sell.
    var myPos = ns.stock.getPosition(sym);
    var purPrice = myPos[0] * myPos[1];
    var gain = ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long");
    var gainPer = Math.round( (gain / purPrice) *100 )/100;                
    if (myPos[0] > 0 )
    {
//        if ( gainPer >= sellAt || (forecast <0.45 && gainPer>1))
        if ( forecast<0.49 )// || (forecast <0.45 && gainPer>1))
        {
            var salePrice = ns.stock.sell( sym, myPos[0] );     
            log.push( timeStamp + `: Purchased ${sym} for ${ns.nFormat(purPrice,"0.000a")}, sold for ${ns.nFormat(gain,"0.000a")}, profit ${ns.nFormat(gain-purPrice,"0.000a")} `);
            totalEarnings += (gain-purPrice);
        }
    }

    // Need a stop limit. Forecast swings to negative, gainPer < 0.95 ?
    if ((forecast < 0.5 && gainPer <= lossLimitFalling & myPos[0] > 0) || (gainPer <= lossLimitAbsolute) )
    {
        var salePrice = ns.stock.sell( sym, myPos[0] );     
        log.push( `${timeStamp}: Loss limit sale: ${sym} for ${ns.nFormat(purPrice,"0.000a")}, sold for ${ns.nFormat(gain,"0.000a")}, profit ${ns.nFormat(gain-purPrice,"0.000a")} `);
        totalEarnings += (gain-purPrice);
    }


    // Profit, sell.
    var myPos = ns.stock.getPosition(sym);
    var purPrice = myPos[2] * myPos[3];
    var gain = ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[2], "Short");
    var gainPer = Math.round( (gain / purPrice) *100 )/100;                
    if (myPos[2] > 0 )
    {
//        if ( gainPer >= sellAt || (forecast <0.45 && gainPer>1))
        if ( forecast>0.51 )// || (forecast <0.45 && gainPer>1))
        {
            var salePrice = ns.stock.sellShort( sym, myPos[2] );     
            log.push( timeStamp + `: Purchased short ${sym} for ${ns.nFormat(purPrice,"0.000a")}, sold for ${ns.nFormat(gain,"0.000a")}, profit ${ns.nFormat(gain-purPrice,"0.000a")} `);
            totalEarnings += (gain-purPrice);
        }
    }

    // Need a stop limit. Forecast swings to negative, gainPer < 0.95 ?
    if ((forecast > 0.5 && gainPer <= lossLimitFalling & myPos[2] > 0) || (gainPer <= lossLimitAbsolute) )
    {
        var salePrice = ns.stock.sellShort( sym, myPos[2] );     
        log.push( `${timeStamp}: Loss limit sale: ${sym} for ${ns.nFormat(purPrice,"0.000a")}, sold for ${ns.nFormat(gain,"0.000a")}, profit ${ns.nFormat(gain-purPrice,"0.000a")} `);
        totalEarnings += (gain-purPrice);
    }

}

function exitRoutine(ns) {
    ns.atExit( () => {
        const doc = eval("document");
        // remove items from overview
        var myBox = findBox( "Stock Summary" );
        myBox.remove();
    } );
}


function lookupServer( sym ) {
	for ( var stSymbol of symbolMap ) {
		if (stSymbol[0] == sym) {
			return stSymbol[2];
		}
	}
	return null;
}

var symbolMap = [
		["AERO","AeroCorp","aerocorp"],
		["APHE","Alpha Enterprises","alpha-ent"],
		["BLD","Blade Industries","blade"],
		["CLRK","Clarke Incorporated","clarkinc"],
		["CTK","CompuTek","computek"],
		["CTYS","Catalyst Ventures","catalyst"],
		["DCOMM","DefComm","defcomm"],
		["ECP","ECorp","ecorp"],
		["FLCM","Fulcrum Technologies","fulcrumassets"],
		["FNS","FoodNStuff","foodnstuff"],
		["FSIG","Four Sigma","4sigma"],
		["GPH","Global Pharmaceuticals","global-pharm"],
		["HLS","Helios Labs","helios"],
		["ICRS","Icarus Microsystems","icarus"],
		["JGN","Joe's Guns","joesguns"],
		["KGI","KuaiGong International","kuai-gong"],
		["LXO","LexoCorp","lexo-corp"],
		["MDYN","Microdyne Technologies","microdyne"],
		["MGCP","MegaCorp","megacorp"],
		["NTLK","NetLink Technologies","netlink"],
		["NVMD","Nova Medical","nova-med"],
		["OMGA","Omega Software","omega-net"],
		["OMN","Omnia Cybersystems","omnia"],
		["OMTK","OmniTek Incorporated","omnitek"],
		["RHOC","Rho Contruction","rho-construction"],
		["SGC","Sigma Cosmetics","sigma-cosmetics"],
		["SLRS","Solaris Space Systems","solaris"],
		["STM","Storm Technologies","stormtech"],
		["SYSC","SysCore Securities","syscore"],
		["TITN","Titan Laboratories","titan-labs"],
		["UNV","Universal Energy","univ-energy"],
		["VITA","VitaLife","vitalife"],
//		["WDS","Watchdog Security",""]
];