/** @param {NS} ns */
import {printTable, tableToHTMLString, printBox2} from "printTable.js";
import {nf, timeStamp, currentTimeInMS, convertMSToHHMMSS} from "functions.js";

const chance = 0.7;
const maxChaos = 40; 
const highStam = 0.99;
const lowStam = 0.5;
var resting=false;
var log=[];
var passInstruction = "";
var myBox = null;
var nextAction = 0;
const cityPop = 500000000;

export async function main(ns) {
	ns.disableLog("ALL");
	ns.clearLog();
	ns.tail();

	passInstruction="run";
	nextAction = ns.getTimeSinceLastAug();
	resting = false;
	while (passInstruction!="kill") {
		if ( ns.getPlayer().inBladeburner ) {
			await summary( ns );
			moveCity( ns );
			doPopChaos( ns );
			checkFinishedAction( ns );
			doAction2( ns );
			buySkills2( ns );
			checkHealth( ns);
		} else {
			var player = ns.getPlayer();
			const requiredStat = 100;
			if (player.strength > requiredStat && player.defense > requiredStat && player.dexterity > requiredStat && player.agility > requiredStat) {
				ns.bladeburner.joinBladeburnerDivision();
			}
		}
		await ns.sleep(1000);
	}
	myBox.remove();
	ns.tail();
}

function checkFinishedAction( ns ) {
	if (ns.getTimeSinceLastAug() > nextAction ) {
		ns.bladeburner.stopBladeburnerAction();
	}
}

function checkHealth(ns) {
	var curHp = ns.getPlayer().hp
	var maxHp = ns.getPlayer().max_hp

	if (curHp < (maxHp*0.8)) { // less than 80% health
		ns.singularity.hospitalize();
	}	
}

function addLog( text ) {
	log.push( timeStamp() + text );
}

function buySkills2(ns) {
	var bb = ns.bladeburner;
	var purchased = false;
	var skillPoints = bb.getSkillPoints();
	for (var skill of bbSkills) {
		if (purchased) { continue; }
		if (skill.skill == "Overclock" && bb.getSkillLevel(skill.skill) >= 90) { continue; }

		if ( (bb.getSkillUpgradeCost(skill.skill)*skill.mult) < skillPoints ) {
			if (bb.upgradeSkill(skill.skill)) {
				addLog( "Upgrading " + skill.skill );
				purchased=true;
			}
		}
	}
}

function moveCity(ns) {
	var bb = ns.bladeburner;
	// find city with lowest chaos and acceptable population and move there
	var cityInfo = { city: "", pop: 0, chaos: -1 };
	for (var city of cities) {
		//if (bb.getCityEstimatedPopulation(city) > cityInfo.pop) {
		if ( ((bb.getCityChaos(city) < cityInfo.chaos) && bb.getCityEstimatedPopulation(city)>cityPop) || (cityInfo.chaos==-1) ) {
			cityInfo.city = city;
			cityInfo.pop = bb.getCityEstimatedPopulation(city);
			cityInfo.chaos = bb.getCityChaos(city);
		}
	}
	if (cityInfo.city != bb.getCity() ) {
		ns.print( "Move to " + cityInfo.city );
		bb.switchCity( cityInfo.city );
	}
}

function doPopChaos(ns) {
	var bb = ns.bladeburner;
	var viableCity = false;
	var cityName = null;
	for (var city of cities) {
		if (bb.getCityEstimatedPopulation(city) > cityPop && bb.getCityChaos(city)<40) {
			viableCity = true;
			cityName = city;
		}
	}

	if (!viableCity) { // work on current city
		if ( bb.getCityEstimatedPopulation(bb.getCity()) < cityPop && ns.getTimeSinceLastAug() > nextAction ) {
			bb.startAction( "General", "Field Analysis" ); 
			nextAction = ns.getTimeSinceLastAug() + bb.getActionTime("General", "Field Analysis" ) + 100;
			addLog( "No viable cities, starting Field Analysis.")
		} else if ( bb.getCityChaos(bb.getCity() ) > maxChaos && ns.getTimeSinceLastAug() > nextAction) {
			ns.print( "Starting diplomacy" );
			bb.startAction( "General", "Diplomacy" ); 			
			nextAction = ns.getTimeSinceLastAug() + bb.getActionTime("General", "Diplomacy" ) + 100;
			addLog( "No viable cities, starting diplomacy.")
		}
	} 
}

function doAction2(ns) { // always perform the most advanced action at the highest level where chance to succeed is > 75%
	var bb = ns.bladeburner;

	if ( ns.getTimeSinceLastAug() <= nextAction ) { return; }

	// switch to/from resting
	var curStamina = ns.bladeburner.getStamina()[0];
	var maxStamina = ns.bladeburner.getStamina()[1];
	var stamPercentage = curStamina / maxStamina;
	if (resting && stamPercentage>=highStam) {
		resting = false;
	} else if (!resting && stamPercentage<lowStam) {
		resting = true;
	}

	if (!resting) {
		var actions = [];
		for ( var ops of bb.getContractNames() ) {
			bb.setActionAutolevel( "contract", ops, true );
			if (bb.getActionCountRemaining("contract", ops) > 1 ) {
				actions.push( { type: "contract", name: ops } ); 
			}
		}
		for ( var ops of bb.getOperationNames() ) {
			bb.setActionAutolevel( "operation", ops, true );
			if (bb.getActionCountRemaining("operation", ops) > 1) {
				actions.push( { type: "operation", name: ops } ); 
			}
		}

		if ( nextBlackOp(ns) && nextAction < ns.getTimeSinceLastAug() ) {
			if ( ns.bladeburner.getBlackOpRank( nextBlackOp(ns) ) < ns.bladeburner.getRank() ) {
				if ( ns.bladeburner.getActionEstimatedSuccessChance("BlackOp", nextBlackOp(ns))[0] > 0.95 ) {
					actions.push( { type: "BlackOp", name: nextBlackOp(ns) } );
				}
			}
		}

		var myNextAction = null;
		ns.print( "" );
		for ( var i = 0 ; i < actions.length ; i++ ) {
			var avgChance = (bb.getActionEstimatedSuccessChance( actions[i].type, actions[i].name )[0] + bb.getActionEstimatedSuccessChance( actions[i].type, actions[i].name )[1])/2;
			ns.print( actions[i].type + " " + actions[i].name + " " + ns.nFormat(avgChance,"0.00") );
			if ( avgChance > 0.75 ) {
				myNextAction = actions[i];
			}
		}
		// if no action found then set to tracking.
		if (!myNextAction && bb.getActionCountRemaining("contract", "Tracking")>1) {
			myNextAction = { type: "contract", name: "Tracking" };
		}

		if (myNextAction) {
			bb.startAction( myNextAction.type, myNextAction.name );
			nextAction = ns.getTimeSinceLastAug() + bb.getActionTime( myNextAction.type, myNextAction.name ) + 100;
			addLog( "Starting [" + myNextAction.type + "] " + myNextAction.name );
		} else {
			bb.startAction( "General", "Incite Violence" );
			nextAction = ns.getTimeSinceLastAug() + bb.getActionTime( "General", "Incite Violence") + 100;
			addLog( "Could not find an action to perform, inciting violence." );
		}
	} else {
		// do something here until stamina regens
		var unavail=[];
		for (var ops of bb.getOperationNames()) {
			if (bb.getActionCountRemaining("operation", ops) < 5 ) { 
				unavail.push( ops ); 
			}
		}
		for (var ops of bb.getContractNames()) {
			if (bb.getActionCountRemaining("contract", ops) < 5 ) { 
				unavail.push( ops ); }
		}

		if ( (unavail.length >0) && stamPercentage > 0.75 ) { // this action requires stamina
			if ((bb.getCurrentAction().name != "Incite Violence" ) ) {
				bb.startAction( "General", "Incite Violence" );
				nextAction = ns.getTimeSinceLastAug() + bb.getActionTime( "General", "Incite Violence" ) + 100;
				addLog( "Low stamina, inciting violence" );
			}
		} else {
			if (bb.getCurrentAction().name != "Hyperbolic Regeneration Chamber" ) {
				bb.startAction( "General", "Hyperbolic Regeneration Chamber");
				nextAction = ns.getTimeSinceLastAug() + bb.getActionTime( "General", "Hyperbolic Regeneration Chamber" ) + 100;
				addLog( "Low stamina, regenerating." );
			}
		}
	}

}

function nextBlackOp(ns) {
	for (var blackOp of ns.bladeburner.getBlackOpNames() ) {
		if (ns.bladeburner.getActionCountRemaining("BlackOp", blackOp) == 1 ) return blackOp;
	}
	return null;
}

function getOp( ns, actions, type, ops, avg=false ) {
	var bb = ns.bladeburner;
	var max = bb.getActionMaxLevel( type, ops );
	var prevLevel = bb.getActionCurrentLevel( type, ops );
	for (var level = 1 ; level <= max ; level++ ) {
		var myOp = { name : "", type : "", success : 0 , rep : 0 , time : 0, repSec : 0, count : 0 };
		myOp.name = ops;
		myOp.type = type;
		myOp.level = level;
		bb.setActionLevel( myOp.type, myOp.name, myOp.level );
		if (avg) {
			myOp.success = (bb.getActionEstimatedSuccessChance(type, ops)[0]+bb.getActionEstimatedSuccessChance(type, ops)[1])/2;
		} else {
			myOp.success = bb.getActionEstimatedSuccessChance(type, ops)[0];
		}
		myOp.rep = bb.getActionRepGain( type, ops, level);
		myOp.time = bb.getActionTime( type, ops );
		myOp.repSec = ((myOp.rep / myOp.time)*1000) * myOp.success;
		myOp.count = bb.getActionCountRemaining(type, ops);
		if ( myOp.success > chance && myOp.count>0 ) { // if > 80% chance add to action list
			actions.push( myOp );
		}
	}
	bb.setActionLevel( type, ops, prevLevel );
	return actions;
}

async function summary(ns) {
	const br = ns.bladeburner;

	var skillTable = [["Skill", "Rank", "Upgrade Cost", "Skill", "Rank", "Upgrade Cost"]];
	var first = true;
	var tableRow=[];
	for (var skill of br.getSkillNames()) {
		if (first) {
			tableRow=[];
		}

		tableRow.push( skill );
		tableRow.push( br.getSkillLevel(skill) );
		tableRow.push( nf(br.getSkillUpgradeCost(skill)) );

		if (first) {
			first = false;
		} else {
			skillTable.push( tableRow );
			first = true;
		}
	}

	var table=[["City", "Chaos", "Communities", "Est Pop"]];
	for (var city of cities) {
		var tableRow=[];
		if (city == br.getCity()) {
			tableRow.push( city+"*" );
		} else {
			tableRow.push( city );
		}
		tableRow.push( nf( br.getCityChaos(city) ) );
		tableRow.push( br.getCityCommunities(city) );
		tableRow.push( nf( br.getCityEstimatedPopulation(city) ) );

		table.push( tableRow );
	}

	var curLevel = 0;
	if (br.getCurrentAction().type!="Idle") {
		curLevel = br.getActionCurrentLevel( br.getCurrentAction().type, br.getCurrentAction().name );
	}
	var header="";
	header += "Current Action: [" + br.getCurrentAction().type + "] " + br.getCurrentAction().name + ` (${curLevel})<br>`;
	header += "Stamina: " + nf(br.getStamina()[0]) + " / " + nf(br.getStamina()[1]) + "<br>";
	header += "Skill points: " + br.getSkillPoints() + "<br>";
	header += "Rank: " + nf(br.getRank()) + "<br>";
	header += `Resting: ${resting}` + "<br>";
	header += "Next action in: " + convertMSToHHMMSS(nextAction - ns.getTimeSinceLastAug());

	var logString = "Log:<br>";
	for (var i = log.length-10 ; i < log.length ; i++ ) {
		if (i>0) {
			logString += log[i] + "<br>";
		}
	}

	var myData = "";
	myData += header;
	myData += "<br>";
	myData += tableToHTMLString(skillTable);
	myData += "<br>";
	myData += tableToHTMLString(table);
	myData += logString;
	myBox = printBox2( "Blade Burner", myData ); 	
  	if (!myBox.head.getAttribute("data-listener")) { myBox.head.querySelector(".kill").addEventListener('click', () => { passInstruction="kill" } ); }
    myBox.head.setAttribute( 'data-listener', "true" ); 
}

const cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"];

const bbSkills = [
{skill: "Blade's Intuition", mult: 1},
{skill: 'Cloak', mult: 2},
{skill: 'Short-Circuit', mult: 2},
{skill: 'Digital Observer', mult: 1.5},
{skill: 'Tracer', mult: 2},
{skill: 'Overclock', mult: 2},
{skill: 'Reaper', mult: 3},
{skill: 'Evasive System', mult: 3},
{skill: 'Datamancer', mult: 6},
{skill: "Cyber's Edge", mult: 4},
{skill: 'Hands of Midas', mult: 4},
{skill: 'Hyperdrive', mult: 2},
];

// DISUSED FUNCTIONS