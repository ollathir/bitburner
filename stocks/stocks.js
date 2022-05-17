/** @param {NS} ns **/
import {printTable} from "printTable.js";

const buyForecast = 0.6;
const sellAt = 1.03;
const lossLimitAbsolute = 0.95;
const lossLimitFalling = 0.97;
const fundsReserve = 50000000; // 1 bn
const minPurchasePrice = 10000000; // 1 bn
    
var holdingsLimit = 1000000000000; // limit to max amount of stocks held - 1tn

var tick = 0;
var totalEarnings = 0;
var log=[];

function convertMSToHHMMSS(ms = 0) {
  if (ms <= 0) {
    return '00:00:00'
  }

  if (!ms) {
    ms = new Date().getTime()
  }

  return new Date(ms).toISOString().substr(11, 8)
}

function totalStocksValue(ns)
{
    const syms = ns.stock.getSymbols();
    var totalStocks=0;
    for (var sym of syms)
    {
        var myPos = ns.stock.getPosition(sym);
       // totalStocks += (myPos[0] * ns.stock.getBidPrice(sym));
        totalStocks += (myPos[0] * myPos[1]);
    }

    return totalStocks;
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

        var stockToBuy = Math.round( (funds) / ns.stock.getAskPrice(sym) );

        var owned = ns.stock.getPosition(sym)[0];
        if (stockToBuy>(ns.stock.getMaxShares(sym)-owned)) { 
            stockToBuy = ns.stock.getMaxShares(sym) - owned; }
        var expectedPrice = stockToBuy * ns.stock.getAskPrice(sym);
        if (!isNaN(stockToBuy) && stockToBuy>0 && expectedPrice > minPurchasePrice) { // set min purchased value to offset trading fee.
			var totPur = ns.stock.buy( sym, stockToBuy ); 
            log.push( timeStamp + ": Buying " + ns.nFormat(stockToBuy,"0.000a") + " shares in " + sym + " at " + ns.nFormat(totPur, "0.000a") + " per share (" + ns.nFormat(stockToBuy*totPur,"0.000a") + ")" );
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
    var salePrice = myPos[0] * ns.stock.getBidPrice(sym);
    var gain = ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long");
    var gainPer = Math.round( (gain / purPrice) *100 )/100;                
    if (myPos[0] > 0 )
    {
        if ( gainPer >= sellAt || (forecast <0.45 && gainPer>1))
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
}

function getInfoAtTick( ns, stockItems, symb, tickDelta ) { // tickDelta e.g. -10 is one minute ago. Returns null if not found.
  //  var syms = ns.stock.getSymbols();
//    for (var sym of syms) 
    {
        for (var stockItem of stockItems) {
            if (stockItem.sym==symb && stockItem.tick==(tick + tickDelta)) {
                return stockItem;
            }
        }
    }
    return null;
}

async function summaryTracker( ns, stockItems )
{
    var table = [];
//    var headers = ["SYM", "Avg", "Price -2m", "Delta -2m", "Per -2m", "Price -5m", "Delta -5m", "Per -5m", "Price -10m", "Delta -10m", "Per -10m"];
    var headers = ["SYM", "Cur", "-1m", "-2m", "-3m", "-4m", "-5m", "Rising?", "Owned", "Avg Pur", "Gain", "Total Purchase", "Gain"];
    table.push(headers);

    var syms = ns.stock.getSymbols();
    var stockItem = null;
    var totalOfPurchases = 0;
    for (var sym of syms) {
        var tableRow = [];
        tableRow.push( sym );
        var stockAvg = ( ns.stock.getBidPrice(sym) + ns.stock.getAskPrice(sym) ) / 2;
        tableRow.push( ns.nFormat(stockAvg,"0.000a") );

/*        if ( stockItem = getInfoAtTick( ns, stockItems, sym, (60/-6) ) ) {
            tableRow.push( ns.nFormat( stockItem.gainPercentage, "0.00" ) + "%"); } else { tableRow.push("-"); }
        if ( stockItem = getInfoAtTick( ns, stockItems, sym, (120/-6) ) ) {
            tableRow.push( ns.nFormat( stockItem.gainPercentage, "0.00" ) + "%"); } else { tableRow.push("-"); }
        if ( stockItem = getInfoAtTick( ns, stockItems, sym, (300/-6) ) ) {
            tableRow.push( ns.nFormat( stockItem.gainPercentage, "0.00" ) + "%"); } else { tableRow.push("-"); }*/
/*        tableRow.push( gainPeriodToPeriodF(ns, stockItems, sym, 0, (60/-6)) );
        tableRow.push( gainPeriodToPeriodF(ns, stockItems, sym, -10, (120/-6)) );
        tableRow.push( gainPeriodToPeriodF(ns, stockItems, sym, -20, (180/-6)) );
        tableRow.push( gainPeriodToPeriodF(ns, stockItems, sym, -30, (240/-6)) );
        tableRow.push( gainPeriodToPeriodF(ns, stockItems, sym, -40, (300/-6)) );*/
        if ( stockItem = getInfoAtTick( ns, stockItems, sym, (60/-6) ) ) {
            tableRow.push( ns.nFormat( stockItem.value, "0.000a") ) } else { tableRow.push("-"); }
        if ( stockItem = getInfoAtTick( ns, stockItems, sym, (120/-6) ) ) {
            tableRow.push( ns.nFormat( stockItem.value, "0.000a") ) } else { tableRow.push("-"); }
        if ( stockItem = getInfoAtTick( ns, stockItems, sym, (180/-6) ) ) {
            tableRow.push( ns.nFormat( stockItem.value, "0.000a") ) } else { tableRow.push("-"); }
        if ( stockItem = getInfoAtTick( ns, stockItems, sym, (240/-6) ) ) {
            tableRow.push( ns.nFormat( stockItem.value, "0.000a") ) } else { tableRow.push("-"); }
        if ( stockItem = getInfoAtTick( ns, stockItems, sym, (300/-6) ) ) {
            tableRow.push( ns.nFormat( stockItem.value, "0.000a") ) } else { tableRow.push("-"); }

        if (ns.getPlayer().has4SDataTixApi) {
            //rising = ns.stock.getForecast(sym);
            rising = (ns.nFormat( (ns.stock.getForecast(sym)-0.5)*100,"0.00") );
        } else {
            var rising = isRising( ns, stockItems, sym );
        }
        tableRow.push(rising);

        // my holdings
        var gain = ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long");
        var myPos = ns.stock.getPosition(sym);
        var purPrice = myPos[0] * myPos[1];
        var gainPer = Math.round( (gain / purPrice) *100 )/100;                

        if (myPos[0]>0) {
			tableRow.push( ns.nFormat(myPos[0],"0.000a") );
    		tableRow.push( ns.nFormat(myPos[1],"0.000a") );
            tableRow.push( ns.nFormat(gain-purPrice, "0.000a") );
            if (purPrice>0 && !isNaN(purPrice)) 
			{
                tableRow.push( ns.nFormat(purPrice, "0.000a") ); 
                totalOfPurchases += purPrice;
			}
            if (!isNaN(gainPer)) 
			{
                var myGain = Math.round((gainPer-1)*100);
                tableRow.push( myGain + "%" );
            }
        } 
		else 
		{
            tableRow.push( "-" );
            tableRow.push( "-" );
            tableRow.push( "-" );
            tableRow.push( "-" );
            tableRow.push( "-" );
        }


        table.push(tableRow);
    }
    totalOfPurchases = ns.nFormat(totalOfPurchases,"0.000a");
    ns.print( `Running for ${tick} ticks. (Approx. ${convertMSToHHMMSS(tick*6*1000)}). Total earnings: ${ns.nFormat(totalEarnings,"0.000a")}. ${stockItems.length} stored.`);
    ns.print( `Portfolio value: ${totalOfPurchases}. Holdings limit ${ns.nFormat(holdingsLimit,"0.000a")}.`);
    ns.clearPort(19);
    var earningsPerSecond = totalEarnings / tick / 6;
    if (!isNaN(earningsPerSecond)) { earningsPerSecond = ns.nFormat(earningsPerSecond,"0.000a"); }
    ns.writePort(19, earningsPerSecond);
    await printTable( ns, table );
}

function summary(ns)
{
	var stocks = [];
	var list = ["SYM", "Bid", "Ask", "Forecast", "Volatility", "Owned", "Avg Pur", "Gain", "Total Purchase", "Gain"];
	stocks.push(list);
	for (var sym of syms)
	{
		if (ns.stock.getBidPrice(sym) > 10000 ) 
		{
			var list = [];
			var forecast = ns.stock.getForecast(sym);

            var myPos = ns.stock.getPosition(sym);
            var purPrice = myPos[0] * myPos[1];
            var salePrice = myPos[0] * ns.stock.getBidPrice(sym);
            var gain = ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long");
            var gainPer = Math.round( (gain / purPrice) *100 )/100;                

			list[0] = sym;
			list[1] = ns.nFormat(ns.stock.getBidPrice(sym), "0.000a");
            list[2] = ns.nFormat(ns.stock.getAskPrice(sym), "0.000a");
			list[3] = Math.round(forecast*100) + "%";
			list[4] = ns.nFormat( ns.stock.getVolatility(sym)*100, "0.00" )+"%";
            var myPos = ns.stock.getPosition(sym);
            if (myPos[0]>0) {
				list[5] = ns.nFormat(myPos[0],"0.000a");
    			list[6] = ns.nFormat(myPos[1],"0.000a");
                list[7] = ns.nFormat(gain-purPrice, "0.000a");
                if (purPrice>0 && !isNaN(purPrice)) 
				{
                    list[8] = ns.nFormat(purPrice, "0.000a"); 
				}
                if (!isNaN(gainPer)) 
				{
                    var myGain = Math.round((gainPer-1)*100);
                    list[9] = myGain + "%";
                }
            } 
			else 
			{
                list[5] = "-";
                list[6] = "-";
                list[7] = "-";
                list[8] = "-";
                list[9] = "-";
            }

			stocks.push(list);
		}
	}

    var totalStocks=0; var totalPurchase=0;
    for (var sym of syms)
    {
        myPos = ns.stock.getPosition(sym);
        totalStocks += myPos[0] * ns.stock.getBidPrice(sym);
        totalPurchase += myPos[0] * myPos[1];
    }

    ns.print( `Total value of owned stocks ${ns.nFormat(totalStocks,"0.000a")}, purchased for ${ns.nFormat(totalPurchase,"0.000a")}`);
    printTable(ns, stocks);
}

function updateTracker( ns, sym ) {
    
    if (ns.getPlayer().has4SDataTixApi) {
        var fcast = ns.stock.getForecast(sym);
    } else {
        var fcast = 0;
    }

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
    }
    return stockItem;
}

function updateMetrics( ns, stockTracker ) {
    // Updates the delta and gainPercentage from the logged price to current. 
    for (var stockItem of stockTracker) {
        var stockAvg = ( ns.stock.getAskPrice(stockItem.sym) + ns.stock.getBidPrice(stockItem.sym) ) /2;
        stockItem.delta = stockAvg - stockItem.value;
        stockItem.gainPercentage = ((stockAvg-stockItem.value) / stockAvg)*100; // percentage gain from now back to the data point
        var stockItemPrevious;
        if ( stockItemPrevious = getInfoAtTick( ns, stockTracker, stockItem.sym, -1 ) ) {
            stockItem.percentageGainFromPreviousTick = stockItem.value / stockItemPrevious.value;
        } else {
            stockItem.percentageGainFromPreviousTick = 1;
        }
    }
}

function gainPeriodToPeriodF( ns, stockItems, sym, period1ticks, period2ticks )
{
    var period1; var period2; var gain = 1;
    if ( (period1 = getInfoAtTick( ns, stockItems, sym, period1ticks )) && (period2 = getInfoAtTick( ns, stockItems, sym, period2ticks)) ) { 
        return ns.nFormat( 
            (1-(period1.value / period2.value))*100
            , "0.00" ) + "%";
    } else { return "-"; }
}

function gainPeriodToPeriod( ns, stockItems, sym, period1ticks, period2ticks )
{
    var period1; var period2; var gain = 1;
    if ( (period1 = getInfoAtTick( ns, stockItems, sym, period1ticks )) && (period2 = getInfoAtTick( ns, stockItems, sym, period2ticks)) ) { 
        gain = period1.value / period2.value;
    } 
    return gain;
}

function isRising( ns, stockItems, sym )
{
    if (tick<50) return false;
// make an array relating just to sym
    var sValues=[];
    for (var i = 0 ; i < stockItems.length ; i++ ) {
        if (stockItems[i].sym == sym ) {
            if (!isNaN(stockItems[i].value) ) { sValues.push(stockItems[i].value); } else { log.push( stockItems.value + " is not a number" ); }
        }
    } // as we are posting tick by tick the order should be correct off the bat, with older items at the start of the list

// don't use period to period, use every data point between to make an average, compare averages.
    var avg10total=0;
    for (var i = (sValues.length-10) ; i < sValues.length ; i++ ) {
        avg10total += sValues[i];
    }
    var avg10 = avg10total/10;
    
    var avg50total=0;
    for (var i = (sValues.length-50) ; i < sValues.length ; i++ ) {
        avg50total += sValues[i];
    }
    var avg50 = avg50total/50;

//    if (sym=="ECP") { log.push( `${sym}: Avg10: ${avg10} (${avg10total}) Avg50: ${avg50} (${avg50total})`); log.push(sValues); }
//    if (sym=="MGCP") { log.push( `${sym}: Avg10: ${avg10} (${avg10total}) Avg50: ${avg50} (${avg50total})`); }

    var rising = avg10 > avg50;
    return rising;
/*
    var rising = 0;
    var period=[];

    period[0] = gainPeriodToPeriod( ns, stockItems, sym, 0, -10 );
    period[1] = gainPeriodToPeriod( ns, stockItems, sym, -10, -20 );
    period[2] = gainPeriodToPeriod( ns, stockItems, sym, -20, -30 );
    period[3] = gainPeriodToPeriod( ns, stockItems, sym, -30, -40 );
    period[4] = gainPeriodToPeriod( ns, stockItems, sym, -40, -50 );

// average the lot
    var totalGain = 0;
    for (var i = 0 ; i < 5 ; i++) {
        totalGain += period[i];
    }
    var averageGain = totalGain / 5;

// how many periods are higher than the previous one?
    var risers=0; var fallers=0;
    for (var i = 0 ; i < 4 ; i++) {
        if (period[i] > period[i+1]) { risers++; } 
        if (period[i] < period[i+1]) { fallers++; }
    }

// how many periods are positive
    var gains=0; var loses=0;
    for (var i = 0 ; i < 4 ; i++) {
        if (period[i] > 1) { gains++; } 
        if (period[i] < 1) { loses++; }
    }

    if (averageGain > 1) { rising++; } 
    if (averageGain < 1) { rising--; }
    if (risers>=3) { rising++; }
    if (fallers>=3) { rising--; }
    if (gains >=3) { rising++; }
    if (loses >=3) { rising--; }

    if (sym=="ECP") {
    log.push( `${sym} ${rising} : avg gain ${averageGain} risers ${risers} fallers ${fallers} gains ${gains} loses ${loses}`);
    }
    return rising;*/
}

function buyStock2( ns, stockTracker, sym ) {
    
    if (tick < 51) { return; } // no buying for first 5 minutes

    var timeStamp = convertMSToHHMMSS( (new Date().getTime()) );

	var rising = isRising( ns, stockTracker, sym );
                
	// Strong earner, buy!
	if ( rising  )//&& (ns.stock.getPosition(sym).shares < 1) ) 
    {

        var funds = holdingsLimit - totalStocksValue(ns);
        if (funds<0) { funds = 0; }
        if (funds > ns.getServerMoneyAvailable("home")) { funds = ns.getServerMoneyAvailable("home") }
        funds -= 100000; // trading fee;
        funds -= fundsReserve; // cash reserve.

        var stockToBuy = Math.round( (funds) / ns.stock.getAskPrice(sym) );

        var owned = ns.stock.getPosition(sym)[0];
        if (stockToBuy>(ns.stock.getMaxShares(sym)-owned)) { 
            stockToBuy = ns.stock.getMaxShares(sym) - owned; }
        var expectedPrice = stockToBuy * ns.stock.getAskPrice(sym);
        if (!isNaN(stockToBuy) && stockToBuy>0 && expectedPrice > minPurchasePrice) { // set min purchased value of 1bn to offset trading fee.
			var totPur = ns.stock.buy( sym, stockToBuy ); 
            log.push( timeStamp + ": Buying " + ns.nFormat(stockToBuy,"0.000a") + " shares in " + sym + " for " + ns.nFormat(totPur, "0.000a") );
        }
	}
}

function sellStock2( ns, stockTracker, sym )
{
    var timeStamp = convertMSToHHMMSS( (new Date().getTime()) );

	var rising = isRising( ns, stockTracker, sym );

    // Profit, sell.
    var myPos = ns.stock.getPosition(sym);
    var purPrice = myPos[0] * myPos[1];
    var salePrice = myPos[0] * ns.stock.getBidPrice(sym);
    var gain = ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long");
    var gainPer = Math.round( (gain / purPrice) *100 )/100;                
    if (myPos[0] > 0 )
    {
        if ( (gainPer >= sellAt) || (!rising && gainPer > 1) ) // desired target gain or it's a faller but still in profit.
        {
            var salePrice = ns.stock.sell( sym, myPos[0] );     
            log.push( timeStamp + `: Purchased ${sym} for ${ns.nFormat(purPrice,"0.000a")}, sold for ${ns.nFormat(gain,"0.000a")}, profit ${ns.nFormat(gain-purPrice,"0.000a")} `);
            totalEarnings += (gain-purPrice);
        }
    }

    // Need a stop limit. Forecast swings to negative, gainPer < 0.95 ?
    if ( ((gainPer <= lossLimitAbsolute) || (!rising && gainPer <= lossLimitFalling)) & myPos[0] > 0 )
    {
        var salePrice = ns.stock.sell( sym, myPos[0] );     
        log.push( `${timeStamp}: Loss limit sale: ${sym} for ${ns.nFormat(purPrice,"0.000a")}, sold for ${ns.nFormat(gain,"0.000a")}, profit ${ns.nFormat(gain-purPrice,"0.000a")} `);
        totalEarnings += (gain-purPrice);
    }
}

/*function getAverageMovement( ns, stockTracker, sym, ticks ) {
    // average growth over last 10 ticks. 
    var avg = 0; var total = 0; var count = 0;
    for ( var i = 1 ; i < ticks ; i++ ) {
        var stockItem;
        if ( stockItem = getInfoAtTick( ns, stockTracker, sym, i*-1 ) ) {
            total += stockItem.percentageGainFromPreviousTick;
            count += 1; // catch all in case data point is missing
        }
    }
    avg = total / count;
    var rating = Math.round((avg-1)*100);
    return rating;
}*/

export async function main(ns) 
{
	const syms = ns.stock.getSymbols();
    var stockMonitor="stock-activity.js";

    ns.disableLog("ALL")
	ns.clearLog();
	ns.tail();

    if (!isNaN(ns.args[0])) { holdingsLimit = ns.args[0]; }

    var stockTracker=[];

	while (true)
	{
		for (var sym of syms) {
            stockTracker.push( updateTracker( ns, sym ) );
            // need to drop off the oldest items here...
            if (tick>100) { stockTracker.shift(); }
		}
        updateMetrics(ns, stockTracker);

		for (var sym of syms) {
            if (ns.getPlayer().has4SDataTixApi) {
                buyStock(ns, sym);
                sellStock(ns,sym);
            } else {
                buyStock2( ns, stockTracker, sym );
                sellStock2( ns, stockTracker, sym );
            }
        }
     

    // user summary
        ns.clearLog();
    // price tracker display
        await summaryTracker(ns,stockTracker);
    // display log
        ns.print( "Log: " );
        for (var i = (log.length-1); i > (log.length-10) ; i--) {
            if (i<0) { continue; }
            ns.print( log[i] );
        }

		await ns.sleep(6000);
        tick++;
	}
}