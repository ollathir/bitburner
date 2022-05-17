// various functions. 
// numberWithCommas() add's comma thousand seperators
// currentTimeInHHMMSS() returns time stamp
// printTable( ns, [ [],[] ] ) displays a formatted table
import {findBox} from "functions.js";
import {createBox, createBox2, createSidebarItem} from "/box/box.js";



export function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export function currentTimeInHHMMSS() {
  return convertMSToHHMMSS(new Date().getTime() );
}

export function convertMSToHHMMSS(ms = 0) {
  if (ms <= 0) {
    return '00:00:00'
  }

  if (!ms) {
    ms = new Date().getTime()
  }

  return new Date(ms).toISOString().substr(11, 8)
}

export function spaceleft ( a, l ) {
    var length = a.length;
    var spaces = l - length;
    var space = " ";

    if (spaces<0) { spaces = 0; }
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

async function makeTable( ns, table )
{
    var printTable=[];
    // Seems very badly coded, below blocks return the max column length for each column.
    // Check max number of columns
    var maxcols = 0; var totalWidth=0;
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
            if (tableCol.toString().length > colsizes[c]) { 
                colsizes[c] = tableCol.toString().length }
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
    printTable.push(printrow);
    
//    await ns.clearLog();

    var isHeader=true;
    for (var tablerow of table)
    {
        var printrow = '║ '; var col = 0;
        for (var tablecol of tablerow)
        {
            if (isNaN(tablecol) && (tablecol[0]!="$" )) {
                printrow = printrow + space(tablecol.toString(), colsizes[col]+1);
            } else {
                printrow = printrow + spaceleft(tablecol.toString(), colsizes[col]) + ' ';
            }
            printrow = printrow + "║ ";
            col++;
        }
        if (isHeader)
        {
            printTable.push(printrow);
            isHeader=false;
            var printrow = "╠"; var col=0;
            for (var tablecol of tablerow)
            {
                if (tablerow.indexOf(tablecol)==tablerow.length-1) // last col
                {
                    printrow = printrow + "═".repeat(colsizes[col]+2)+"╣";
                } else {
                printrow = printrow + "═".repeat(colsizes[col]+2) + "╬";
                }
                col++;
            }   
        }
        printTable.push(printrow);
        if (printrow.length>totalWidth) {totalWidth=printrow.length;}
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
    printTable.push(printrow);

    return printTable;
}

export async function printTable( ns, table )
{
    var printTable = await makeTable( ns, table );
    for (var i=0 ; i < printTable.length ; i++) {
        ns.print(printTable[i]);
    }
    return true;
}

export async function printTableFromPort( ns, port )
{
    var portData="";
    var portData = ns.readPort(port);
    while( portData != "NULL PORT DATA")
    {
        ns.print( portData );
        var portData = ns.readPort(port);
    }
}

export async function printTableToPort( ns, table, port )
{
    if (isNaN(port)) return 0;
    var printTable = await makeTable( ns, table );

    for (var i=0 ; i < printTable.length ; i++) {
        await ns.writePort(port, printTable[i]);
    }
    return true;
}


export async function printTableF( ns, table )
{
    // Seems very badly coded, below blocks return the max column length for each column.
    // Check max number of columns
    for (var tablerow of table) {
        for (var tablecol of tablerow) {
            if ( !isNaN(tablecol) ) {
                var temp = Math.round(tablecol*1000)/1000;
                tablerow[tablerow.indexOf(tablecol)] = temp;
            }
        }
    }

    var maxcols = 0; var totalWidth=0;
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

    var isHeader=true;
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
        if (isHeader)
        {
            ns.print(printrow);
            isHeader=false;
            var printrow = "╠"; var col=0;
            for (var tablecol of tablerow)
            {
                if (tablerow.indexOf(tablecol)==tablerow.length-1) // last col
                {
                    printrow = printrow + "═".repeat(colsizes[col]+2)+"╣";
                } else {
                printrow = printrow + "═".repeat(colsizes[col]+2) + "╬";
                }
                col++;
            }   
        }
        ns.print(printrow);
        if (printrow.length>totalWidth) {totalWidth=printrow.length;}
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
    return totalWidth;
}

export function tableToHTMLString( table ) {
    var myData = ""; 

    myData += "<style>tr.border-bottom td {border-bottom: 1pt solid #ffffff;}</style>"

    myData += `<table cellspacing="5" cellpadding="1" border="0"><tbody>`;
    var isFirst = true;
    for (var tableRow of table) {
        if (isFirst) {
            myData += `<tr class="border-bottom">`;
            isFirst = false;
        } else {
            myData += "<tr>";
        }
        for (var tableCol of tableRow) {
            myData += "<td>" + tableCol + "</td>";
        }
        myData += "</tr>";
    }
    myData += "</tbody></table>";

    return myData;
}

export function printBox( title, myData ) {
    var myBox = findBox( title );
    if (!myBox) {
        myBox = createBox( title, myData );
    } else {
       myBox.body.innerHTML = myData;
    }
    return myBox;
}

export function printBox2( title, myData ) {
    var myBox = findBox( title );
    if (!myBox) {
        myBox = createBox2( title, myData );
    } else {
       myBox.body.innerHTML = myData;
		if (parseInt(myBox.style.height,10) > (globalThis.innerHeight-20) ) {
			myBox.style.height = globalThis.innerHeight-20 + "px";
    			myBox.style.top = "1px";
		}
    }
    myBox.body.style.overflow="scroll";
    return myBox;
}