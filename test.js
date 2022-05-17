import { list_open_servers, list_hack_servers_sorted }from "getServers.js";
import { nf, convertMSToHHMMSS, currentTimeInHHMMSS, findBox} from "functions.js";
import {createBox, createBox2, createSidebarItem} from "/box/box.js";
import {printTable, tableToHTMLString, printBox2} from "printTable.js";

var passInstruction = null;
var myBox = null;
var passInstruction = "run";

/** @param {NS} ns */
export async function main(ns) {
	//ns.tail(); 
    ns.clearLog(); ns.disableLog("ALL");
    passInstruction = "run";
    while (passInstruction!="kill") {
        ns.clearLog();
        ns.print("");
        displayWindow(ns);
        setSleevesAction( ns, "Homicide" );
        await ns.sleep(500);
    }
    myBox.remove();
    ns.tail();
}

function setSleevesAction( ns, action ) {
    for (var i = 0 ; i < ns.sleeve.getNumSleeves() ; i++ ) {
        if (crimes.indexOf(action) > 0) {
            var sAction = ns.sleeve.getTask(i);
            if (sAction.crime != action) {
                ns.sleeve.setToCommitCrime( i, action );
            }
        }
    }
}

var crimes = ["Rob Store", "Homicide"];

function displayWindow(ns) {
    var myData = ""; //await printTable(ns, stocks);
    myData += tableToHTMLString( showFactionSummary(ns) );
    myData += "<br>";
        var invitations = "";
        var isFirst = true;
        for (var faction of ns.singularity.checkFactionInvitations() ) {
            if (isFirst) {
                invitations += faction;
            } else {
                invitations += ", " + faction;
            }
        }
        if (invitations != "") {
            myData += `Invitations from: ${invitations}`;
            myData += "<br>";
        }
    myData += tableToHTMLString( showSleeveSummary(ns) );
    myBox = printBox2( "test", myData );
  	if (!myBox.head.getAttribute("data-listener")) { myBox.head.querySelector(".kill").addEventListener('click', () => { passInstruction="kill" } ); }
}

function showFactionSummary(ns) {
    var table = [["Faction", "Rep", "Favour"]];
    for (var faction of ns.getPlayer().factions) {
        var tableRow = [];
        tableRow.push( faction );
        tableRow.push( nf(ns.singularity.getFactionRep(faction)) );
        tableRow.push( nf(ns.singularity.getFactionFavor(faction)) );
        table.push(tableRow);
    }
    return table;
}

function showSleeveSummary(ns) {
    var table=[];
    tableRow = ["Sleeve", "Shock", "Sync", "Str", "Def", "Dex", "Agi", "Cha", "Hack", "Avail Augs", "Crime", "Work Type", "Stat", "Location", "Task"];
    table.push(tableRow);
    for (var i = 0 ; i < ns.sleeve.getNumSleeves() ; i++) {
        var mySleeve = ns.sleeve.getInformation(i);
        var myStats = ns.sleeve.getSleeveStats(i);
        var myTask = ns.sleeve.getTask(i);
        var tableRow = [];
        tableRow.push( i );
        tableRow.push( nf(myStats.shock) );
        tableRow.push( nf(myStats.sync) );

        tableRow.push( nf(myStats.strength) );
        tableRow.push( nf(myStats.defense) );
        tableRow.push( nf(myStats.dexterity) );
        tableRow.push( nf(myStats.agility) );
        tableRow.push( nf(myStats.charisma) );
        tableRow.push( nf(myStats.hacking) );
        tableRow.push( ns.sleeve.getSleevePurchasableAugs(i).length );
        tableRow.push( myTask.crime );
        tableRow.push( myTask.factionWorkType );
        tableRow.push( myTask.gymStatType );
        tableRow.push( myTask.location );
        tableRow.push( myTask.task );
       
        table.push( tableRow );            
    }
    return table;
}