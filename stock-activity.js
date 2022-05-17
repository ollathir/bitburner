/** @param {NS} ns **/
import { printTable } from "printTable.js";

/*export function spaceleft ( a, l ) {
    var length = a.length;
    var spaces = l - length;
    var space = " ";

    var b = space.repeat(spaces) + a;

    return b;
}

export function space( a, l ) {
// need to change the return to being a string
    var length = a.length;
    var spaces = l - length;
    var space = " ";

    var b = a + space.repeat(spaces);

    return b;
}

async function printTable( ns, table )
{
    // Seems very badly coded, below blocks return the max column length for each column.
    // Check max number of columns
    var maxcols = 0;
    for (tablerow of table) {
        if (tablerow.length > maxcols) { 
            maxcols = tablerow.length; 
        }
    }

    // Define a colsizes array
    var colsizes = []; colsizes.length=maxcols;
    for( var i=0 ; i < colsizes.length ; i++ ) {
        colsizes[i] = 0;
    } // could do this block with a push in the main loop below?
    
    // get the highest value for each column within the table
    for (var tablerow of table) {
        var c = 0;
        for (var tableCol of tablerow) {
            if (tableCol.length > colsizes[c]) { 
                colsizes[c] = tableCol.length }
            c++;
        }
        
    }    
    
    for (var tablerow of table)
    {
        var printrow = ''; var col = 0;
        for (var tablecol of tablerow)
        {
            if (isNaN(tablecol)) {
                printrow = printrow + space(tablecol.toString(), colsizes[col]+1);
            } else {
                printrow = printrow + spaceleft(tablecol.toString(), colsizes[col]) + ' ';
            }
            col++;
        }
        ns.print(printrow);
    }
}
*/
export async function main(ns) 
{
	const syms = ns.stock.getSymbols();
	var list = [];

    ns.disableLog("ALL")
	ns.clearLog();
	ns.tail();
	while (true)
	{
		var stocks = [];
		var list = ["SYM", "Bid", "Ask", "Forecast", "Volatility", "Owned", "Avg Pur", "Gain", "Total Purchase", "Gain"];
		stocks.push(list);
		ns.clearLog();
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
        ns.clearLog();

        var totalStocks=0; var totalPurchase=0;
        for (var sym of syms)
        {
            myPos = ns.stock.getPosition(sym);
            totalStocks += myPos[0] * ns.stock.getBidPrice(sym);
            totalPurchase += myPos[0] * myPos[1];
        }

        ns.print( `Total value of owned stocks ${ns.nFormat(totalStocks,"0.000a")}, purchased for ${ns.nFormat(totalPurchase,"0.000a")}`);
      	printTable(ns, stocks);
		await ns.sleep(100);
	}
}