import {timeStamp} from "functions.js";

const commission = 100000;
const samplingLength = 30;
const batchAmount = 100000;
var log=[];
var holdings=[];

function predictState(samples) {
  const limits = [null, null, null, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 12, 12, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 19, 19, 20];
  let inc = 0;
  for (let i = 0; i < samples.length; ++i) {
    const total = i + 1;
    const idx = samples.length - total;
    if (samples[idx] > 1.) {
      ++inc;
    }
    const limit = limits[i];
    if (limit === null) {
      continue;
    }
    if (inc >= limit) {
      return 1;
    }
    if ((total-inc) >= limit) {
      return -1;
    }
  }
  return 0;
}

function format(money) {
    const prefixes = ["", "k", "m", "b", "t", "q"];
    for (let i = 0; i < prefixes.length; i++) {
        if (Math.abs(money) < 1000) {
            return `${Math.floor(money * 10) / 10}${prefixes[i]}`;
        } else {
            money /= 1000;
        }
    }
    return `${Math.floor(money * 10) / 10}${prefixes[prefixes.length - 1]}`;
}

function posNegDiff(samples) {
  const pos = samples.reduce((acc, curr) => acc + (curr > 1. ? 1 : 0), 0);
  return Math.abs(samples.length - 2*pos);
}

function posNegRatio(samples) {
  const pos = samples.reduce((acc, curr) => acc + (curr > 1. ? 1 : 0), 0);
  return Math.round(100*(2*pos / samples.length - 1));
}

function getPortfolioValue( ns ) {
  var total = 0;
  for (var sym of ns.stock.getSymbols()) {
      total += ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long" );
      total += ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[2], "Short" );
  }
  return total;
}

function sellPortfolio( ns ) {
    for (var sym of ns.stock.getSymbols()) {
        var position = ns.stock.getPosition( sym );
        if (position[0]>0) {
            ns.stock.sell( sym, position[0] );
        }
        if (position[2]>0) {
            ns.stock.sellShort( sym, position[2] );
        }
    }
}

export async function main(ns) {
    ns.disableLog("ALL");
    let symLastPrice = {};
    let symChanges = {};
    for (const sym of ns.stock.getSymbols()) {
      symLastPrice[sym] = ns.stock.getPrice(sym);
      symChanges[sym] = []
    }

    while (true) {
        ns.clearLog();

        // check if we have enough money to buy the Tix API, if so, do so and switch script
        if ( (ns.getPlayer().money+getPortfolioValue(ns)) > 35000000000) {
//        if ( (ns.getPlayer().money) > 35000000000) {
          sellPortfolio(ns);
          if ( ns.stock.purchase4SMarketDataTixApi() ) {
            ns.spawn( "/stocks/stocks3.js", 1 );
          }
        }

        var purchasePrice = 0;
        var currentPrice = 0;
        for (var sym of ns.stock.getSymbols()) {
          purchasePrice += (ns.stock.getPosition(sym)[0] * ns.stock.getPosition(sym)[1] );
          purchasePrice += (ns.stock.getPosition(sym)[2] * ns.stock.getPosition(sym)[3] );
          //currentPrice += (ns.stock.getBidPrice(sym) * ns.stock.getPosition(sym)[0]);
          currentPrice += ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long" );
          //currentPrice += ((ns.stock.getAskPrice(sym) * ns.stock.getPosition(sym)[2])*1);
          currentPrice += ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[2], "Short" );
        }

        ns.print( "Current portfolio value: $" + ns.nFormat(currentPrice,"0.000a") );
        ns.print( "Purchased for: $" + ns.nFormat(purchasePrice,"0.000a") );
        ns.print( "Profit: $" + ns.nFormat(currentPrice-purchasePrice,"0.000a") );

        ns.print("");
        for (var i = (holdings.length-1) ; i >= (holdings.length-5) ; i-- ) {
          if (i>0) { 
            ns.print(holdings[i]);
          }
        }

        ns.print("");
        for (var i = (log.length-1) ; i >= (log.length-10) ; i-- ) {
          if (i>0) { 
            ns.print(log[i]);
          }
        }


        await ns.sleep(2000);

        if (symLastPrice['FSIG'] === ns.stock.getPrice('FSIG')) {
          continue;
        }

        for (const sym of ns.stock.getSymbols()) {
          const current = ns.stock.getPrice(sym);
          symChanges[sym].push(current/symLastPrice[sym]);
          symLastPrice[sym] = current;
          if (symChanges[sym].length > samplingLength) {
            symChanges[sym] = symChanges[sym].slice(symChanges[sym].length - samplingLength);
          }
        }

        const prioritizedSymbols = [...ns.stock.getSymbols()];
        prioritizedSymbols.sort((a, b) => posNegDiff(symChanges[b]) - posNegDiff(symChanges[a]));
        
        for (const sym of prioritizedSymbols) {
          const positions = ns.stock.getPosition(sym);
          const longShares = positions[0];
          const longPrice = positions[1];
          const shortShares = positions[2];
          const shortPrice = positions[3];
          const state = predictState(symChanges[sym]);
          const ratio = posNegRatio(symChanges[sym]);
          const bidPrice = ns.stock.getBidPrice(sym);
          const askPrice = ns.stock.getAskPrice(sym);
          if (longShares <= 0 && shortShares <= 0 && ns.stock.getPrice(sym) < 30000) {
            continue;
          }

          if (longShares > 0) {
            const cost = longShares * longPrice;
            const profit = longShares * (bidPrice - longPrice) - 2 * commission;
            if (state < 0) {
              const sellPrice = ns.stock.sell(sym, longShares);
              if (sellPrice > 0) {
//                  ns.print(`SOLD (long) ${sym}. Profit: ${format(profit)}`);
                  log.push(timeStamp() + `SOLD (long) ${sym}. Profit: ${format(profit)}`);
              }
            } else {
//                ns.print(`${sym} (${ratio}): ${format(profit+cost)} / ${format(profit)} (${Math.round(profit/cost*10000)/100}%)`);
                holdings.push(`${sym} (${ratio}): ${format(profit+cost)} / ${format(profit)} (${Math.round(profit/cost*10000)/100}%)`);
            }
          } else if (shortShares > 0) {
            const cost = shortShares * shortPrice;
            const profit = shortShares * (shortPrice - askPrice) - 2 * commission;
            if (state > 0) {
              const sellPrice = ns.stock.sellShort(sym, shortShares);
              if (sellPrice > 0) {
//                  ns.print(`SOLD (short) ${sym}. Profit: ${format(profit)}`);
                  log.push(timeStamp() + `SOLD (short) ${sym}. Profit: ${format(profit)}`);
              }
            } else {
//                ns.print(`${sym} (${ratio}): ${format(profit+cost)} / ${format(profit)} (${Math.round(profit/cost*10000)/100}%)`);
                holdings.push(`${sym} (${ratio}): ${format(profit+cost)} / ${format(profit)} (${Math.round(profit/cost*10000)/100}%)`);
            }
          } else {
            const money = ns.getServerMoneyAvailable("home");
            if (state > 0) {
              const sharesToBuy = Math.min(batchAmount, ns.stock.getMaxShares(sym), Math.floor((money - commission) / askPrice));
              if (ns.stock.buy(sym, sharesToBuy) > 0) {
//                  ns.print(`BOUGHT (long) ${sym}.`);
                  log.push(timeStamp() + `BOUGHT (long) ${sym}.`);
              }
            } else if (state < 0) {
              const sharesToBuy = Math.min(batchAmount, ns.stock.getMaxShares(sym), Math.floor((money - commission) / bidPrice));
              if (ns.stock.short(sym, sharesToBuy) > 0) {
//                  ns.print(`BOUGHT (short) ${sym}.`);
                  log.push(timeStamp() + `BOUGHT (short) ${sym}.`);
              }
            }
          }
        }
    }
}