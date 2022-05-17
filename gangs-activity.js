import { printTable } from 'printTable.js';

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

    var printrow = "╔"; var col=0;
    for (var tablecol of tablerow)
    {
        if (tablerow.indexOf(tablecol)==tablerow.length-1) // last col
        {
            printrow = printrow + "═".repeat(colsizes[col]+2)+"╗";
        } else {
            printrow = printrow + "═".repeat(colsizes[col]+2)+"╦";
        }
        col++;
    }   
    ns.print(printrow);
    
//    await ns.clearLog();

    for (var tablerow of table)
    {
        var printrow = '║ '; var col = 0;
        for (var tablecol of tablerow)
        {
            if (isNaN(tablecol)) {
                printrow = printrow + space(tablecol.toString(), colsizes[col]+1);
            } else {
                printrow = printrow + spaceleft(tablecol.toString(), colsizes[col]) + ' ';
            }
            printrow = printrow + "║ ";
            col++;
        }
        ns.print(printrow);
    }
    var printrow = "╚"; var col=0;
    for (var tablecol of tablerow)
    {
        if (tablerow.indexOf(tablecol)==tablerow.length-1) // last col
        {
            printrow = printrow + "═".repeat(colsizes[col]+2)+"╝";
        } else {
        printrow = printrow + "═".repeat(colsizes[col]+2) + "╩";
        }
        col++;
    }   
    ns.print(printrow);
        
}
*/
export function fmt(ns, a)
{
    return ns.nFormat( a, "0.000a" );
}


/** @param {NS} ns **/
export async function main(ns) {
    const equipmentTypes = ["Weapon","Armor","Vehicle","Rootkit","Augs"];
    const ticks = 5;
    const gangNames = [ "Slum Snakes", "Speakers for the Dead", "The Black Hand", "The Dark Army", "The Syndicate", "NiteSec", "Tetrads"];

	ns.tail();
	ns.disableLog("ALL");
    while (true) {
	    ns.clearLog();

    	var members = ns.gang.getMemberNames();
        var gangInfo = ns.gang.getGangInformation();
        var wantedPenalty = (1-gangInfo.wantedPenalty) * 100;

        ns.print( `Repect: ${fmt(ns,gangInfo.respect)} (${fmt(ns,gangInfo.respectGainRate*5)}/sec) Wanted Level: ${fmt(ns,gangInfo.wantedLevel)} (${fmt(ns,gangInfo.wantedLevelGainRate*5)}/sec) Cash: ${fmt(ns,gangInfo.moneyGainRate*5)}/sec`)
        ns.print( `Wanted level penalty: ${ns.nFormat(wantedPenalty,"0.00")}% (${ns.nFormat(gangInfo.wantedPenalty,"0.0000")}) Power: ${ns.nFormat(gangInfo.power,"0.000a")}`);
        ns.print( `Territory warfare engaged: ${gangInfo.territoryWarfareEngaged}`);
        ns.print( "" );

        var gangs = ns.gang.getOtherGangInformation();
        var rows = [];
        var row = ["Gang", "Power", "Territory", "Clash Win %"];
        rows.push(row);
        for (var gangName of gangNames)
        {
            if (gangName == gangInfo.faction) { continue; }
//            ns.print( gangName + " P:" + ns.nFormat(gangs[gangName].power,"0.000a") + " T: " + gangs[gangName].territory + " C: " + ns.nFormat(ns.gang.getChanceToWinClash(gangName)*100,"0.00") + "%" );
            var row = [];
            row.push( gangName );
            row.push( ns.nFormat(gangs[gangName].power,"0.000a") );
            row.push( ns.nFormat(gangs[gangName].territory*100,"0.00")+"%" );
            row.push( ns.nFormat(ns.gang.getChanceToWinClash(gangName)*100,"0.00") + "%" );
            rows.push(row);
        }
        await printTable(ns,rows);
        ns.print("");

    	var rows = [];
        var row = ["Name", "Action", "Respect", "Str", "Def", "Dex", "Agi", "Cha", "Augs", "$ Gain", "Resp Gain", "Wanted Gain" ];

        rows.push(row);
    	for (var member of members)
    	{
    		var row=[];
            var mInfo = ns.gang.getMemberInformation(member);
    		var taskStats = ns.gang.getTaskStats(mInfo.task);
            row.push( member );

            row.push( mInfo.task );            
            row.push( ns.nFormat(mInfo.earnedRespect,"0.000a") );
            row.push( ns.nFormat(mInfo.str,"0.000a") );
            row.push( ns.nFormat(mInfo.def,"0.000a") );
            row.push( ns.nFormat(mInfo.dex,"0.000a") );
            row.push( ns.nFormat(mInfo.agi,"0.000a") );
            row.push( ns.nFormat(mInfo.cha,"0.000a") );

            row.push( mInfo.augmentations.length );

            if (ns.fileExists("Formulas.exe"))
            {
                row.push( "$"+ns.nFormat(ns.formulas.gang.moneyGain(gangInfo,mInfo,taskStats)*ticks,"0.000a") );
                row.push( ns.nFormat( ns.formulas.gang.respectGain(gangInfo,mInfo,taskStats)*ticks,"0.000a"));
                row.push( ns.nFormat( ns.formulas.gang.wantedLevelGain(gangInfo,mInfo,taskStats)*ticks,"0.000a"));

              //  ns.formulas.gang.ascensionPointsGain(mInfo.)
            }
            else
            {
                row.push( "-" );
                row.push( "-" );
                row.push( "-" );
            }

            rows.push( row );
	    }
	    await printTable(ns,rows);
        await ns.sleep(100);
    }
}