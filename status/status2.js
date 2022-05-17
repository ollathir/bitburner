/** @param {NS} ns */
import {createBox, createSidebarItem} from "/box/box.js";
import {list_servers, list_open_servers, list_hack_servers} from "getServers.js";
import {formatMem} from "functions.js";

var listenerPID=null;

/*function terminal(command) { // only works when on terminal tab
    const doc = eval("document");
    // Get the terminal input field from the DOM
    const terminal = doc.getElementById("terminal-input");

    // Print the command to the terminal input field
    terminal.value = command;

    // Get a reference to the React event handler.
    const handler = Object.keys(terminal)[1];

    // Perform an onChange event to set some internal values.
    terminal[handler].onChange({ target: terminal });

    // Simulate an enter press
    terminal[handler].onKeyDown({ keyCode: 13, preventDefault: () => null });

    terminal.dispatchEvent(new KeyboardEvent('keydown', {
         code: 'Enter',
         key: 'Enter',
         charCode: 13,
         keyCode: 13,
         view: window,
         bubbles: true
         }));
}*/

//function listener(e, pid) {
function listener(e) {    
    const doc = eval("document");

    var elem = e.target;
    listenerPID = elem.getAttribute("data-listener");

/*    var sbItem = findSidebarItem( "Hacknet" );
    if (sbItem) { 
        sbItem.body.innerHTML += elem.getAttribute("data-listener");//["data-listener"];
    }
    var cmd = "tail " + elem.getAttribute("data-listener");*/
//    terminal( cmd );


}

function addClick( sidebarName ) {
    var sidebarBody = findSidebarItem( sidebarName );
    if (!sidebarBody) {return;}
    if (!sidebarBody.hasAttribute("data-listener") ) 
    { 
        sidebarBody.addEventListener('click', listener ); // default setup, definately works to send the event                
    }
}



export async function main(ns) {
//    ns.tail();
    //ns.disableLog("ALL");
    ns.disableLog("scan"); ns.disableLog("getServerMaxRam"); ns.disableLog("getServerUsedRam"); ns.disableLog("getServerMaxMoney");
    ns.disableLog("sleep");
    ns.clearLog();

    if ( !findSidebarItem("overview") ) { 
        await ns.exec( "/box/overview.js", "home", 1 );
        await ns.sleep(500);
        var overview = findSidebarItem( "overview")
    }
    if ( overview ) { 
        overview.style["height"]="440px";
    }

    exitRoutine(ns);

    listenerPID=null;
	while (true) {
		overviewBox(ns);
		hacknetBox(ns);
        gangBox(ns);
        await hackBox(ns);
        corpBox(ns);
        stocksBox(ns);
        bladeburnerBox(ns);
        utilityScriptBox(ns);

        addClick(ns);

        changeStyle();

        if (listenerPID != null) {
            ns.print( "Opening tail for: '" + listenerPID + "'" );
            ns.tail( Number(listenerPID) );
            listenerPID=null;
        }

		await ns.sleep(200);
	}
}

function changeStyle() {
    const doc = eval("document");
    var sb = doc.querySelector( ".sb" ); // main sidebar 

    if (!sb) { return; }

    sb.style.color = "rgb( 39 142 158)";
    sb.style["border-left"] = "5px solid var(--welllt)";
    sb.style.width = "247px";
 
    var sbItem = sb.querySelector( ".sbitem" );
    while (sbItem) {
        sbItem.head.style["background"] = "rgb( 6 73 93)";
        sbItem.head.style["color"] = "rgb( 255 255 255)";
        sbItem.head["font-weight"] = "normal";
        sbItem.style["border-bottom"] = "1px solid";
        sbItem.body.style["font-size"] = "13px";

        sbItem = sbItem.nextSibling;
    }

}

function insertColor( string, color ) {
    return ("<span style='color: " + color + "'>" + string + "</span>");
}

function overviewBox(ns) {
    var sidebarBody = "";
    var sidebarTitle = "overview";

    const doc = eval("document");
    const hook0 = doc.getElementById('overview-extra-hook-0');
    const hook1 = doc.getElementById('overview-extra-hook-1');
    
    try {
        const headers = []
        const values = [];

        headers.push("Karma");
        values.push(ns.heart.break());

        headers.push("");
        values.push("");

        // Now drop it into the placeholder elements
        hook0.innerText = headers.join(" \n");
        hook1.innerText = values.join("\n");
    } catch (err) { // This might come in handy later
        ns.print("ERROR: Update Skipped: " + String(err));
        hook0.innerText = "";
        hook1.innerText = "";
    }

}

function utilityScriptBox(ns) {
    var sidebarBody = "";
    var sidebarTitle = "Utility";

    // utility - coding contracts
    sidebarBody += insertColor( "Coding Contracts", "rgb(255,255,255)");// <br />";
    var script = cctScript;
    var servers = list_servers(ns);
    var contracts = 0;
    for (var server of servers) {
        var files = ns.ls(server, "cct");
        contracts += files.length;
    }
    sidebarBody += contracts + " open" + "<br />";
    if (isRunning3(ns, script)) { 
	    sidebarBody += "Script: (" + isRunning3(ns,script).pid + ") " + isRunning3(ns,script).filename + "<br />";
	} else {
		sidebarBody += "Script: None" + "<br />";
	}
    sidebarBody += "<br />";

//    sidebarBody += "Purchased servers" + "<br />";
    sidebarBody += insertColor( "Purchased servers", "rgb(255,255,255)");
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

    for (var i=0 ; i<=20 ; i++) {
      var serverObject = serversList[i];
      if (serverObject.names.length==0) { continue; }
      if (isNaN(serverObject.costToUpgrade)) {
        //var tableRow = [ns.nFormat(serverObject.size,"0.000a")+ " GB", "MAX", serverObject.names.length];
        sidebarBody += serverObject.names.length +"x " + formatMem(serverObject.size) + " (MAX)" + "<br />";
      } else {
        sidebarBody += serverObject.names.length + "x " + formatMem(serverObject.size) + " ($"+ns.nFormat(serverObject.costToUpgrade,"0.000a") + ")<br />";
      }
    }

    script = purchasedServerScript;
    if (isRunning3(ns, script)) { 
	    sidebarBody += "Script: (" + isRunning3(ns,script).pid + ") " + isRunning3(ns,script).filename + "<br />";
	} else {
		sidebarBody += "Script: None" + "<br />";
	}
    sidebarBody += "<br />";

//    sidebarBody += "Darkweb Programs" + "<br />";
    sidebarBody += insertColor( "Darkweb Programs", "rgb(255,255,255)");
    script = torScript;
    const dwProgs = ns.singularity.getDarkwebPrograms();
    var dwReport = ""; var myDW = 0;
    if (!ns.getPlayer().tor) {
        sidebarBody += "TOR not yet purchased<br />";
    } else {
        for (var dwProg of dwProgs) {
            dwReport += dwProg + " " + ns.fileExists(dwProg) + "<br />";
            if (ns.fileExists(dwProg)) { myDW++; }
        }
    }
    
    if (myDW < dwProgs.length || !ns.getPlayer().tor) {
        sidebarBody += dwReport;
        if (isRunning3(ns, script)) { 
	        sidebarBody += "Script: (" + isRunning3(ns,script).pid + ") " + isRunning3(ns,script).filename + "<br />";
	    } else {
		    sidebarBody += "Script: None" + "<br />";
	    }
    } else {
        sidebarBody += "All owned." + "<br />";
    }
    sidebarBody += "<br />";

//    sidebarBody += "Intelligence grind"  + "<br />";
    sidebarBody += insertColor("Intelligence Grind", "rgb(255,255,255");
    script = manualHackScript;
//    sidebarBody += "Current server: " + ns.singularity.getCurrentServer() + "<br />";
    if (isRunning3(ns, script)) { 
	    sidebarBody += "Script: (" + isRunning3(ns,script).pid + ") " + isRunning3(ns,script).filename + "<br />";
	} else {
		sidebarBody += "Script: None" + "<br />";
	}
    sidebarBody += "<br />";

//    sidebarBody += "Backdoors" + "<br />";
    sidebarBody += insertColor("Backdoors","rgb(255,255,255)");
    script = backdoorScript;
    if (isRunning3(ns, script)) { 
	    sidebarBody += "Script: (" + isRunning3(ns,script).pid + ") " + isRunning3(ns,script).filename + "<br />";
	} else {
		sidebarBody += "Script: None" + "<br />";
	}
    sidebarBody += "<br />";

    sidebarBody += insertColor("Hospital","rgb(255,255,255)");
    script = autoHospital;
    if (isRunning3(ns, script)) { 
	    sidebarBody += "Script: (" + isRunning3(ns,script).pid + ") " + isRunning3(ns,script).filename + "<br />";
	} else {
		sidebarBody += "Script: None" + "<br />";
	}
    sidebarBody += "<br />";

    updateSidebar( sidebarTitle, sidebarBody );
    findSidebarItem( sidebarTitle ).recalcHeight();
}

function stocksBox(ns) {
    var sidebarBody = "";
    var sidebarTitle = "Stocks";
    var script = stockScript;
    var pid = 0;

    var holdings = 0;
    var purchase = 0;
    for ( var sym of ns.stock.getSymbols() ) {
        var position = ns.stock.getPosition(sym);
        holdings += ns.stock.getSaleGain( sym, position[0], "Long" );
        holdings += ns.stock.getSaleGain( sym, position[2], "Short" );
        purchase += position[0] * position[1];
        purchase += position[2] * position[3];
    }

    // add in current holdings / profit on current will require marketdata api
    sidebarBody += "Portfolio value: $" + ns.nFormat( holdings, "0.000a" );
    sidebarBody += "<br>Profit: $" + ns.nFormat( (holdings-purchase),"0.000a" ) + "<br>";

    if (isRunning3(ns, script)) { 
        pid = isRunning3(ns,script).pid;
	    sidebarBody += "Script: (" + pid + ") " + isRunning3(ns,script).filename;
	} else {
		sidebarBody += "Script: None";
	}


    updateSidebar( sidebarTitle, sidebarBody, pid );
    findSidebarItem( sidebarTitle ).recalcHeight();
}

function bladeburnerBox(ns) {
    var sidebarBody = "";
    var sidebarTitle = "BladeBurner";
    var script = bladeburnerScript;
    var pid = 0;

    if ( !ns.getPlayer().inBladeburner ) { return; }

    // add in current holdings / profit on current will require marketdata api

    if (isRunning3(ns, script)) { 
        pid = isRunning3(ns,script).pid;
	    sidebarBody += "Script: (" + pid + ") " + isRunning3(ns,script).filename;
	} else {
		sidebarBody += "Script: None";
	}

    updateSidebar( sidebarTitle, sidebarBody, pid );
    findSidebarItem( sidebarTitle ).recalcHeight();
}

function corpBox(ns) {
    var sidebarBody = "";
    var sidebarTitle = "Corporation";
    var script = corpScript;
    var pid = 0;

    if (ns.getPlayer().hasCorporation) {
        sidebarItem += "Lighweight mode <br />";
        if (isRunning3(ns, script)) { 
            pid = isRunning3(ns,script).pid 
	        sidebarBody += "Script: (" + pid + ") " + isRunning3(ns,script).filename;
	    } else {
		    sidebarBody += "Script: None";
	    }
//            for (var division of corp.divisions) {
//                table.push( [`${corp.name}: ${division.name} ` , ns.nFormat((division.lastCycleRevenue-division.lastCycleExpenses)/1,"0.000a"), corppid, tempCorp] );
//                corpProfit += (division.lastCycleRevenue-division.lastCycleExpenses)/1;
//            }
        updateSidebar( sidebarTitle, sidebarBody, pid );
        findSidebarItem( sidebarTitle ).recalcHeight();
    } else {
        var sidebarItem = findSidebarItem(sidebarTitle);
        if ( sidebarItem ) { // box exists but gang does not
            sidebarItem.remove();
        }
    }
}

async function hackBox(ns) {
    var sidebarBody = "";
    var sidebarTitle = "Hacking";
    var script = hackScript;
    var pid = 0;

    var servers = list_servers(ns); 
    var hackableServers = await list_hack_servers(ns, 0.5);
    var backdoor=0;
    for (var server of servers) {
        if (ns.getServer(server).backdoorInstalled) { backdoor++; }
    }
    sidebarBody += "Open servers: " + list_open_servers(ns).length + " / " + (list_servers(ns).length+1) + "<br />"; 
    sidebarBody += "Hackable servers: " + hackableServers.length + "<br />";
    sidebarBody += "Backdoors: " + backdoor  + "<br />";
    sidebarBody += "Income: $" + ns.nFormat(ns.getScriptIncome()[1],"0.000a") + " /sec<br />";

    var totalram = 0; var usedram = 0;
    var servers = list_open_servers(ns); 
    for (var server of servers) {
        totalram += ns.getServerMaxRam( server );
        usedram += ns.getServerUsedRam( server );
    }
    sidebarBody += "Network ram " + formatMem(usedram) + " / " + formatMem(totalram) + "<br />";


    if (isRunning3(ns, script)) { 
	    sidebarBody += "Script: (" + isRunning3(ns,script).pid + ") " + isRunning3(ns,script).filename;
        pid = isRunning3(ns,script).pid;
	} else {
		sidebarBody += "Script: None";
	}
    updateSidebar( sidebarTitle, sidebarBody, pid );
    findSidebarItem( sidebarTitle ).recalcHeight();
}

function gangBox(ns) {
    var sidebarTitle = "Gang";
    if (ns.gang.inGang()) {
    	var sidebarBody = "";
        var script = gangScript;
        var pid = 0;

        var gangInfo = ns.gang.getGangInformation();
        var gangIncome = gangInfo.moneyGainRate*5;

        sidebarBody += "Income: $" + ns.nFormat(gangIncome,"0.000a") + " / sec <br />";

    	if (isRunning3(ns, script)) { 
            pid = isRunning3(ns,script).pid;
	    	sidebarBody += "Script: (" + pid + ") " + isRunning3(ns,script).filename;
	    } else {
		    sidebarBody += "Script: None";
	    }
        updateSidebar( sidebarTitle, sidebarBody, pid );
        findSidebarItem( sidebarTitle ).recalcHeight();
    } else {
        var sidebarItem = findSidebarItem(sidebarTitle);
        if ( sidebarItem ) { // box exists but gang does not
            sidebarItem.remove();
        }
    }
}

function hacknetBox(ns) {
	var sidebarBody = "";
    var sidebarTitle = "Hacknet";
    var script = hacknetScript;
    var pid = 0;

    var hacknetIncome = 0; var totalCapacity = 0;
    for (var i=0 ; i<ns.hacknet.numNodes() ; i++ ) {
        hacknetIncome += ns.hacknet.getNodeStats(i).production; 
        totalCapacity += ns.hacknet.getNodeStats(i).hashCapacity;
    }

	sidebarBody += "Production: $" + ns.nFormat(hacknetIncome,"0.000a") + " /sec" + "<br />";
	sidebarBody += "Num nodes: " + ns.hacknet.numNodes() + "<br />";
    sidebarBody += "Hashes: " + ns.nFormat(ns.hacknet.numHashes(),"0.000a") + " / " + ns.nFormat(totalCapacity,"0.000a") + "<br />";
	
	if (isRunning3(ns, script)) { 
        pid = isRunning3(ns,script).pid;
		sidebarBody += "Script: (" + pid + ") " + isRunning3(ns,script).filename;
	} else {
		sidebarBody += "Script: None";
	}

	updateSidebar( sidebarTitle, sidebarBody, pid );
    findSidebarItem( sidebarTitle ).recalcHeight();
}

function updateSidebar( sidebarTitle, sidebarBody, pid=0 ) {
    var sbItem = findSidebarItem( sidebarTitle );
    if (!sbItem) { // doesn't exist, make a new one
        createSidebarItem( sidebarTitle, sidebarBody, "\uea77");
        sbItem = findSidebarItem( sidebarTitle );
        if (!sbItem) { // try to increase default height
            sbItem.body.addEventListener('click', listener ); 
            sbItem.body.setAttribute( 'data-listener', pid ); // should send the event and the number 3 to listener            
        }
    } else {
        var sbitemBody = sbItem.querySelector( ".body" );
        if (!sbItem.body.getAttribute("data-listener")) { sbItem.body.addEventListener('click', listener );}
        sbItem.body.setAttribute( 'data-listener', pid ); // should send the event and the pid number to listener            
        sbitemBody.innerHTML = sidebarBody;
    }
}

function findSidebarItem( name ) {
    const doc = eval("document");
//    var sb = doc.querySelector( ".sb" ); // main sidebar 

    var i=0; // catchall to prevent infinite loop
    var sibling = doc.querySelector( ".sbitem" );
    while (sibling && i < 10) {
        if (sibling) {
            var head = sibling.querySelector( ".title" );
//            ns.print ( "sibling.title.innerHTML: " + head.innerHTML );
//            var body = sibling.querySelector( ".body" );
//            ns.print( "sibling.body.innerHTML: " + body.innerHTML );
            if (head.innerHTML==name) { return sibling };
        } else {
            return null;
        }
        i++;
        sibling = sibling.nextSibling;
    }
    return null;
}

function exitRoutine(ns) {
    ns.atExit( () => {
        const doc = eval("document");
        // remove items from overview
        const hook0 = doc.getElementById('overview-extra-hook-0');
        const hook1 = doc.getElementById('overview-extra-hook-1');
        hook0.innerText = "";
        hook1.innerText = "";

// NEED TO UPDATE THIS TO ONLY REMOVE THE SIDEBAR ITEMS

        // remove sidebar
/*        var sidebar = doc.querySelector( ".sb" );
        if (sidebar) {
            sidebar.remove(); }*/
        var sidebarItem = doc.querySelector( ".sbitem" );
        while (sidebarItem) {
//            if (sidebarItem.head.title != "overview") 
            { 
                sidebarItem.remove();
            }
            sidebarItem = doc.querySelector( ".sbitem" );
        }
    } );
}

function isRunning2( ns, filename ) {
    var processes = ns.ps( "home" );
    var myResult = { args:"", filename:"", pid:"-", threads:0};
    for (var process of processes) {
        if (process.filename == filename) {
            myResult = process;
        }
    }
    return myResult;
}

function isRunning3( ns, filenames ) {
    var processes = ns.ps( "home" );
    for (var process of processes) {
		for (var filename of filenames) {
        	if (process.filename == filename) {
            	return process;
			}
        }
    }
    return null;
}


const hackScript = ["/hackAll_v4/main.js","/hackAll_v5/main.js","/hackExp/main.js","haackAll_v6/main.js"];
const corpScript = ["/corp/corp_start.js","/corp/corp_mid.js"];
const gangScript = ["/gangs/gangs.js"];
const hacknetScript = ["/hacknet/hacknetAuto.js", "/hacknet/hacknetServer.js"];
const stockScript = ["stocks.js", "/stocks/stocks.js", "/stocks/stocks2.js", "/stocks/stocks3.js" ];
const cctScript = ["/cct/solver.js"];
const purchasedServerScript = ["purchaseServerAuto.js"];
const torScript = ["/singularity/tor.js"];
const manualHackScript = ["/singularity/manualHack.js"];
const backdoorScript = ["/singularity/backdoorAll.js"];
const autoHospital = ["/bladeBurner/autoHospital.js"];
const bladeburnerScript = ["/bladeBurner/main.js"];