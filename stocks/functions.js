export function getPortfolioValue( ns ) {
  var total = 0;
  for (var sym of ns.stock.getSymbols()) {
      total += ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[0], "Long" );
      total += ns.stock.getSaleGain(sym, ns.stock.getPosition(sym)[2], "Short" );
  }
  ns.writePort( 16, total );
}

export function sellPortfolio( ns ) {
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
    if (ns.args[0]=="value") {
        getPortfolioValue(ns);
    } else if (ns.args[0]=="sell") {
        sellPortfolio(ns);
    }
}