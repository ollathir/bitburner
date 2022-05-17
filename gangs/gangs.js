import { printTable, currentTimeInHHMMSS, tableToHTMLString, printBox2 } from "printTable.js"
import { timeStamp } from "functions.js";

const debug = 0;
const warfare=true; // Do we engage in gang warfare?
const spendLimit = 50; // % server money to spend on equipment
const augSpendLimit = 10; // % server money to spend on augmentations
const maxWantedGainRate = 0.5;
const minAscGain = 3; // min primary stat gain from ascension
const minAscRes = 100000; // all members must have this amount of respect before ascension
const minWantedAscGainMult = 1.3; // tweak this to begin with was 1.5
const maxRespect = 2000000; // want this much lower to begin with was 1000000
const maxWanted = 0.0095; // max Wanted level penalty (%)
const maxRespectMult = 7500;

var passInstruction = "";
var myBox = null;
var gangSize = 12;
var tick=0;

var log=[];


/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("ALL");
	ns.clearLog();

    if (!ns.gang.inGang()) {
        if (!ns.gang.createGang("Slum Snakes")) {
            ns.print( timeStamp() + "Waiting to create gang..." );
        }
        await ns.sleep(10000);
}

    passInstruction = "run";
    while (passInstruction != "kill") {
 //        var members = ns.gang.getMemberNames();
 //        var gangInfo = ns.gang.getGangInformation();
        ns.clearLog();

        // tasks
        doRecruit( ns );
        setActions( ns );
        checkDeclareWar( ns );
        doBuyItems( ns );
        doBuyAugmentations( ns );
        checkAscend( ns );
        await showDisplay(ns);
	    await ns.sleep(2000);
        tick++;
    }
    myBox.remove();
    ns.tail();
}


function setActions( ns ) {
    var vigilanteSet = false;
    var terroristSet = false;
    var members = ns.gang.getMemberNames();
    for (var member of members)
    {
        var members = ns.gang.getMemberNames();
        var gangInfo = ns.gang.getGangInformation();
        var memberInfo = ns.gang.getMemberInformation(member);
        var gangInfo = ns.gang.getGangInformation();
        var oldTask = memberInfo.task;
        var task = oldTask;

        // Manage wanted level
        if (memberInfo.str < 40) { // Basic training
            task = "Train Combat";
        } else if (members.length < 4) {
            task = "Mug People";
        } else if (oldTask=="Vigilante Justice" && gangInfo.wantedLevel > 1)
        {
            // don't switch
        } else if (gangInfo.wantedPenalty <= maxWantedGainRate && !vigilanteSet ) {
            task = "Vigilante Justice";
        } else if (memberInfo.str >= 40 && memberInfo.str < 150 && members.length < gangSize) { // Mid level crimes - Mug People to gain respect
            task = "Mug People";
        } else if (memberInfo.str >= 150 && memberInfo.str < 300 ) {
            task = "Strongarm Civilians";
        } else if (memberInfo.str >= 300) { // High level crimes
            // if we don't have a full gang then prioritise respect gain. 
            // This needs some more work as members towards the top get pulled more towards vigilante duties.
            // Should I add a cap to respect / member?
            //var desiredRespect = maxRespect;
            var desiredRespect = ns.formulas.gang.respectGain(gangInfo, memberInfo, ns.gang.getTaskStats("Terrorism")) * maxRespectMult;
            if (debug==1) { 
                log.push(member + ", " + memberInfo.earnedRespect); 
            } else if (oldTask=="Terrorism" && memberInfo.earnedRespect<(desiredRespect*1.05)) {
                // stick with task
            } else if ((members.length < gangSize && !terroristSet) || (memberInfo.earnedRespect<desiredRespect && !terroristSet)) { // dont want to switch until uvershot by 5% - NEED CODE
                task = "Terrorism";
                if (task!=oldTask) {
                    terroristSet = true;
                    if (debug==1) {
                        log.push(`Set ${member} to ${task} from ${oldTask}`);
                    }
                }
            } else if (memberInfo.str >= 450 ) { // full gang, go for cash & territory
                // switch which half of the gang does what at high level
                if (warfare) {
                    if (tick<100) {
                        if (members.indexOf(member) < 6 && !powerIsDouble(ns)) {
                            task = "Territory Warfare";
                        } else {
                            task = "Traffick Illegal Arms";
                        }
                    } else {
                        if (members.indexOf(member) >= 6 && !powerIsDouble(ns)) {
                            task = "Territory Warfare";
                        } else {
                            task = "Traffick Illegal Arms";
                        }
                        if (tick>=200) { tick = 0; }
                    }
                } else {
                    if (tick<100) {
                        task = "Traffick Illegal Arms";
                    } else {
                        task = "Human Trafficking"; // put this on main script
                    }
                    if (tick>=200) {
                        tick = 0;
                    }
                }

                if (task!=oldTask) {
                    terroristSet = true;
                    if (debug==1) {log.push(`Set ${member} to ${task} from ${oldTask}`);}
                }
            }
        }
        if (task != oldTask) {
            ns.gang.setMemberTask(member, task);
            if (debug==1) { log.push(currentTimeInHHMMSS() + ": " + `Set ${member} to ${task} from ${oldTask}`); }
        }
	}
}

function checkDeclareWar( ns ) {
    // Should we declare war? want our power to be double anyone elses? ideally want to check the clash win chance %
    if (powerIsDouble(ns) && warfare && ns.gang.getGangInformation().territory < 0.99 ) { 
        ns.gang.setTerritoryWarfare(true) 
    } else {
        ns.gang.setTerritoryWarfare(false);
    }
}

function doBuyItems( ns ) {
    var members = ns.gang.getMemberNames();
    for ( var i=0 ; i <= 3 ; i++ )
    {
        buyItems( ns, log, members, spendLimit, i );
    }
}

function doBuyAugmentations( ns ) {
    var members = ns.gang.getMemberNames();
    var purchased = false;
    var augmentations = equipmentList(ns)[4];
    for (var toBuy of augmentations) {
        for (var member of members) {
            var memberInfo = ns.gang.getMemberInformation(member);
            var augmentations = memberInfo.augmentations;
            var augCost = ns.gang.getEquipmentCost("Bionic Arms");
            var spend = ns.getServerMoneyAvailable("home") * (augSpendLimit / 100);
            // Augmentations for everyone...
            if ( (augmentations.indexOf(toBuy)==-1) && (augCost<spend) && !purchased) { // don't already have, do have enough funds
                if (ns.gang.purchaseEquipment(member,toBuy)) {
                    log.push(currentTimeInHHMMSS() + ": " +  `Purchased ${toBuy} for ${member} (${ns.nFormat(augCost,"0.000a")})`);
                    purchased = true;
                }
            }   
        }
    }
}

function checkAscend( ns ) {
    var members = ns.gang.getMemberNames();
    //should we ascend a gang member? 
    // don't do it too frequently or we loose all respect
    // check how much will be gained?
    var ascRes = true;
    for (var member of members) { // do all members meet the minimum respect - should scale the respect level somehow
        var mInfo = ns.gang.getMemberInformation(member);
        if (mInfo.earnedRespect < minAscRes) {
            ascRes = false;
        }
    }

    var ascSet = false;
    if (ascRes==true) { // all members have min respect
        if (!ns.fileExists("Formulas.exe")) {
            var hasAscended = false;
            for (var member of members) {
                if (hasAscended) { continue; }
                var mInfo = ns.gang.getMemberInformation(member);
                var ascInfo = ns.gang.getAscensionResult(member);
                if (ascInfo == null) { continue; } // ascension not possible
                var okToAsc = false;
                if (ascInfo.str > minAscGain) { okToAsc=true; }
                if (ascInfo.def > minAscGain) { okToAsc=true; }
                if (ascInfo.dex > minAscGain) { okToAsc=true; }
                if (ascInfo.agi > minAscGain) { okToAsc=true; }
                if (ascInfo.cha > minAscGain) { okToAsc=true; }
                if (ascInfo.hack > minAscGain) { okToAsc=true; }
                if (okToAsc) {
                    var ascResult = ns.gang.ascendMember(member);
                    if (ascResult != null) {
                        var myAscResult = "Str " + fmt2(ascResult.str) + " Def " + fmt2(ascResult.def) + " Dex " + fmt2(ascResult.dex) 
                                    + " Agi " + fmt2(ascResult.agi) + " Cha " + fmt2(ascResult.cha) + " Hack " + fmt2(ascResult.hack);
                        log.push(currentTimeInHHMMSS() + ": " + `${member} ascended. ${myAscResult}`);
                        hasAscended = true;
                    }
                }
            }
        } else {
            // check for ascension based on percentage gain over current multiplier
            var hasAscended = false;
            for (var member of members) {
                if (hasAscended) { continue };
                var ascPtGain=[]; var curMult=[]; var newMult=[]; var gainFact=[];
                var mInfo = ns.gang.getMemberInformation(member);
                var ascInfo = ns.gang.getAscensionResult( member );
                // 0 str - 1 def - 2 dex - 3 agi - 4 cha - 5 hack
                ascPtGain[0] = ascInfo.str; curMult[0] = mInfo.str_asc_mult; 
                ascPtGain[1] = ascInfo.def; curMult[1] = mInfo.def_asc_mult; 
                ascPtGain[2] = ascInfo.dex; curMult[2] = mInfo.dex_asc_mult; 
                ascPtGain[3] = ascInfo.agi; curMult[3] = mInfo.agi_asc_mult; 
                ascPtGain[4] = ascInfo.cha; curMult[4] = mInfo.cha_asc_mult; 
                ascPtGain[5] = ascInfo.hack; curMult[5] = mInfo.hack_asc_mult; 
                var myStr = member + " ";
                var shouldAscend = false;
                for (var i = 0 ; i <=5 ; i++ ) { 
                    newMult[i] = curMult[i] * ascPtGain[i];
                    gainFact[i] = newMult[i] / curMult[i]; // should I look at changing this to a static increase rather than %?
                    if (gainFact[i] > minWantedAscGainMult)
                    {   shouldAscend=true; }

                    // test code
                    // ns.tprint( member + " " + (newMult[i]-curMult[i]) );


                    myStr = myStr + ns.nFormat(newMult[i],"0.0") + " (" + ns.nFormat(gainFact[i],"0.000") + ") "; 
                }
                if (shouldAscend) {
                    var ascResult = ns.gang.ascendMember(member);
                    if (ascResult != null) {
                        var myAscResult = "Str " + fmt2(ascResult.str) + " Def " + fmt2(ascResult.def) + " Dex " + fmt2(ascResult.dex) 
                                    + " Agi " + fmt2(ascResult.agi) + " Cha " + fmt2(ascResult.cha) + " Hack " + fmt2(ascResult.hack);
                        log.push(currentTimeInHHMMSS() + ": " + `${member} ascended. ${myAscResult}`);
                        hasAscended = true;
                    }
                }
            }
        }    
    }
}

function doRecruit( ns ) {
    if (ns.gang.canRecruitMember()) // recruit new member
    {
        var gangMemberName = "";
        var members = ns.gang.getMemberNames();
        for (var i=0 ; i<=memberNames.length ; i++)
        {
            if (members.indexOf(memberNames[i])==-1 && gangMemberName=="") 
            {
                gangMemberName = memberNames[i];
            }
        }
        if (debug==1) { log.push(`Trying to recruit member ${gangMemberName}(${ns.gang.getMemberNames().length+1})`);}
        if (ns.gang.recruitMember( gangMemberName ))
        {
            log.push( `Recruited ${gangMemberName}`);
            ns.gang.setMemberTask(gangMemberName,"Train Combat"); // Default task
            var members = ns.gang.getMemberNames();
        }
    }
}

export function equipmentList(ns)
{
    var eqTypes = ["weapon", "armor", "vehicle", "rootkit", "augmentation"];

    var equipment = [];
    var weapons=[];
    var armors=[];
    var vehicles=[];
    var rootkits=[];
    var augmentations=[];

    var eqNames = ns.gang.getEquipmentNames();
    for (var eqName of eqNames)
    {
        var myType = ns.gang.getEquipmentType(eqName);
        if ( myType == "Weapon" ) { weapons.push(eqName); }
        if ( myType == "Armor" ) { armors.push(eqName); }
        if ( myType == "Vehicle" ) { vehicles.push(eqName); }
        if ( myType == "Rootkit" ) { rootkits.push(eqName); }
        if ( myType == "Augmentation" ) { augmentations.push(eqName); }
    }

    equipment.push(weapons); equipment.push(armors); equipment.push(vehicles); equipment.push(rootkits); equipment.push(augmentations);
    return equipment;
}

export function buyItems( ns, log, members, spendLimit, itemType )
{
    var equipment = equipmentList( ns );
    var items = equipment[itemType];
    // buy some equipment?
    for (var item of items)
    {
        for (var member of members)
        {
            var memberInfo = ns.gang.getMemberInformation(member);
            var spend = ns.getServerMoneyAvailable("home") * (spendLimit / 100);
            var itemCost = ns.gang.getEquipmentCost(item);
            if (itemCost <= spend)
            {
                if (ns.gang.purchaseEquipment(member,item))
                {
                    if (debug==1) { log.push( currentTimeInHHMMSS() + ": " + "Purchased " + item + " for " + member + "(" + ns.nFormat(itemCost,"0.000a") + ")" ); }
                }
            }
        }
    }
}

function powerIsDouble(ns) {
    var gangInfo = ns.gang.getGangInformation();
    var gangs = ns.gang.getOtherGangInformation();
    var powerIsDouble = true;
    for (var gangName of gangNames)
    {
        if (gangName == gangInfo.faction) { continue; }
        if ((gangs[gangName].power*2) > (gangInfo.power)) { 
            powerIsDouble = false; 
        }
    }
    return powerIsDouble;
}

export function fmt(ns, a)
{
    return ns.nFormat( a, "0.000a" );
}

function fmt2( a ) {
    return (Math.round( a * 100 ) / 100);
}

async function showDisplay(ns) {
    const equipmentTypes = ["Weapon","Armor","Vehicle","Rootkit","Augs"];
    const ticks = 5;
    const gangNames = [ "Slum Snakes", "Speakers for the Dead", "The Black Hand", "The Dark Army", "The Syndicate", "NiteSec", "Tetrads"];
   	var myData = "";

	ns.disableLog("ALL");
    {
	    ns.clearLog();

    	var members = ns.gang.getMemberNames();
        var gangInfo = ns.gang.getGangInformation();
        var wantedPenalty = (1-gangInfo.wantedPenalty) * 100;

        ns.print( `Repect: ${fmt(ns,gangInfo.respect)} (${fmt(ns,gangInfo.respectGainRate*5)}/sec) Wanted Level: ${fmt(ns,gangInfo.wantedLevel)} (${fmt(ns,gangInfo.wantedLevelGainRate*5)}/sec) Cash: ${fmt(ns,gangInfo.moneyGainRate*5)}/sec`);
        myData += `Repect: ${fmt(ns,gangInfo.respect)} (${fmt(ns,gangInfo.respectGainRate*5)}/sec) Wanted Level: ${fmt(ns,gangInfo.wantedLevel)} (${fmt(ns,gangInfo.wantedLevelGainRate*5)}/sec) Cash: ${fmt(ns,gangInfo.moneyGainRate*5)}/sec<br>`;
        ns.print( `Wanted level penalty: ${ns.nFormat(wantedPenalty,"0.00")}% (${ns.nFormat(gangInfo.wantedPenalty,"0.0000")}) Power: ${ns.nFormat(gangInfo.power,"0.000a")}`);
        myData += `Wanted level penalty: ${ns.nFormat(wantedPenalty,"0.00")}% (${ns.nFormat(gangInfo.wantedPenalty,"0.0000")}) Power: ${ns.nFormat(gangInfo.power,"0.000a")}<br>`;
        ns.print( `Territory warfare engaged: ${gangInfo.territoryWarfareEngaged}`);
        myData += `Territory warfare engaged: ${gangInfo.territoryWarfareEngaged}<br>`;
        ns.print( "" );

        var gangs = ns.gang.getOtherGangInformation();
        var rows = [];
        var row = ["Gang", "Power", "Territory", "Clash Win %"];
        rows.push(row);
        for (var gangName of gangNames)
        {
            var row = [];
            if (gangName == gangInfo.faction) {
                row.push( "** " + gangName + " **");
            } else {
                row.push( gangName );
            }

            row.push( ns.nFormat(gangs[gangName].power,"0.000a") );
            row.push( ns.nFormat(gangs[gangName].territory*100,"0.00")+"%" );
            row.push( ns.nFormat(ns.gang.getChanceToWinClash(gangName)*100,"0.00") + "%" );
            rows.push(row);
        }
        await printTable(ns,rows);
        myData += tableToHTMLString(rows);
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
            var desiredRespect = ns.formulas.gang.respectGain(gangInfo, mInfo, ns.gang.getTaskStats("Terrorism")) * maxRespectMult;
            row.push( ns.nFormat(mInfo.earnedRespect,"0.000a") + "/" + ns.nFormat(desiredRespect,"0.000a") );
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
        myData += tableToHTMLString( rows );

 		// print log
        myData += "Log:<br>";
		for (var i=(log.length-1) ; i > (log.length-10) ; i--) {
			if (i<0) { continue; }
			ns.print(log[i]);	
            myData += log[i]+"<br>";
		}

    }

	myBox = printBox2( "Gangs", myData ); 	
  	if (!myBox.head.getAttribute("data-listener")) { myBox.head.querySelector(".kill").addEventListener('click', () => { passInstruction="kill" } ); }
    myBox.head.setAttribute( 'data-listener', "true" ); 
}

const gangNames = [ "Slum Snakes", "Speakers for the Dead", "The Black Hand", "The Dark Army", "The Syndicate", "NiteSec", "Tetrads"];

const memberNames = [ "Aaron", "Billy", "Charlie", "Darren", "Eliott", "Fred", "George", "Harry",
    "Ian", "James", "Keith", "Larry", "Mathew", "Norman", "Oscar", "Peter", "Quentin", "Roger", "Steve", "Terry",
    "Ulrich", "Victor", "William", "Xavier", "Yoseph", "Zach", "Andy", "Bert", "Conor", "Dylan" ];