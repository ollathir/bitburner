/** @param {NS} ns **/
export async function main(ns) {
  	const args = ns.flags([["help", false],["size",8]]);

    if ( ns.args[0] == "help" ) {
      ns.tprint( "Usage: ");
      ns.tprint( "<size> server size to buy, must be valid size. Loops until max purchased.");
      ns.tprint( "<server level> <''/replace> 5-20 = 32GB to 1TB");
      ns.tprint( "display" );
      ns.tprint( "kill all / kill <= <size>");
      ns.tprint( "cost <size/level>");
      return;
    }

    if ( ns.args[0] == null ) { ns.tprint("No args."); return; }

    if (ns.args[0] == "display" || ns.args[0] == "list")
    {
      var purchasedServers = ns.getPurchasedServers();
      ns.tail();
      ns.disableLog('ALL');
      ns.clearLog();
      for (const server of purchasedServers)
      {
        
        ns.print( `${server} (${ns.getServerMaxRam(server)}).`);
      
      }
      return;
    }

    if ( ns.args[0] == "cost" ) 
    {
      var size = ns.args[1];
      if (ns.args[1] >= 10 && ns.args[1] <=20 ) {
        ns.tprint( "Cost of level " + size + " server: $" + ns.nFormat(ns.getPurchasedServerCost(Math.pow(2,size)),"0.000a") + 
        " Total: " + ns.nFormat(ns.getPurchasedServerCost(Math.pow(2,size))*25,"0.000a") );
      } else {
        ns.tprint( "Cost of " + size + " GB server: " + ns.nFormat(ns.getPurchasedServerCost(size),"0.000a") + 
        " Total: " + ns.nFormat(ns.getPurchasedServerCost(size)*25,"0.000a") );
      }
      return;
    }

    if ( (ns.args[0] == "kill" && ns.args[1] == "all" ) || (ns.args[1] == "replace" ) )
    {
      const servers = ns.getPurchasedServers();
      var killed = 0;
      for ( const server of servers )
      {
        ns.killall(server);
        if (ns.deleteServer(server)) 
        { 
          killed++; 
        }
      }
      ns.tprint( `Deleted ${killed} out of ${servers.length} servers.`);
      if (!ns.args[1] == "replace")
      { return; }
    }

    if (ns.args[0]=="kill" && !isNaN(ns.args[1]))
    { // remove all servers with less than args[1] ram
      var servers = ns.getPurchasedServers();
      var killed = 0;
      for ( const server of servers )
      {
        if (ns.getServerMaxRam(server)<=ns.args[1])
        {
          ns.killall(server);
          if (ns.deleteServer(server))
          {
            killed++;
          }
        }
      }
      ns.tprint( `Deleted ${killed} servers with less than ${ns.args[1]} RAM.`);
      return;
    }

    if (isNaN(ns.args[0]))
    {
      ns.tprint( ns.args[0] + " is not a number.");
      return;
    }

    var size = args._[0]; // Server size
    var i = 0;
    var purchasedServers = ns.getPurchasedServers();
    // Check is size is greater than max.
    if (size > ns.getPurchasedServerMaxRam() )
    {
	    ns.print( `Server size cannot be set to ${size}, reduced to ${ns.getPurchasedServerMaxRam()}.`);
	    size = ns.getPurchasedServerMaxRam();	   
    }
    if ( size >= 10 && size <=20 )
    {
        size = Math.pow(2,size);
    }

    
    for ( const server of purchasedServers )
    { 
     // ns.tprint( server ); 
    }
    var owned = purchasedServers.length; 
    var tobuy = ns.getPurchasedServerLimit() - purchasedServers.length;
    const limit = ns.getPurchasedServerLimit();
    ns.tprint( `${owned} already owned buying ${tobuy} new servers. Cost per server ${ns.nFormat(ns.getPurchasedServerCost(size),"$0.000a")}).`);

    var i = owned;
    ns.disableLog("ALL");
    ns.tail();
    if (i>=limit)
    {
        ns.tprint( "All servers purchased." );
        return;
    }
    while (ns.getPurchasedServers.length < limit )
    {
      ns.clearLog();
      var purServers = ns.getPurchasedServers();
      ns.print( "Servers Owned: " + purServers.length + "/25" + " Cost of next server: ", ns.nFormat(ns.getPurchasedServerCost(size), "0.000a") );
      for (var purServer of purServers)
      {
          ns.print( purServer, " Ram: ", ns.getServerMaxRam( purServer )/1000, " TB" );
      }

	    while( ns.getServerMoneyAvailable('home') < ns.getPurchasedServerCost(size) )
	    {
  		  //ns.print( `Not enough money, waiting. ${ns.getServerMoneyAvailable("home")} / ${ns.getPurchasedServerCost(size)}` );
		    await ns.sleep(100);
	    }	    
      i++;
      ns.tprint( `Buying server pserv-${i}, ram ${size}.`);
	    if (!ns.purchaseServer( 'pserv-'+i, size))
      {
        var attempts=0;
        while (!ns.purchaseServer('pserv-'+i, size))
        {
          i++;
          attempts++;
          if (attempts > 10)
          {
            ns.tprint( "Could not find a valid name");
            return;
          }
        }        
      }
    }
    ns.tprint( "All servers purchased." );
}