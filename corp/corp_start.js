/** @param {NS} ns */
import {convertMSToHHMMSS, timeStamp} from "functions.js";

var log=[];

export async function main(ns) {

	ns.disableLog("disableLog"); ns.disableLog("sleep");
	ns.tail();
	ns.clearLog();
	var stage = 0;

	if (ns.args[0]=="start") {
		if ( !ns.getPlayer().hasCorporation ) {
			ns.corporation.createCorporation("Darkgate", true );
		}
		var agri = null;
		for (var div of ns.corporation.getCorporation().divisions) {
			if (div.type=="Agriculture") { agri = div; }
		}
		if ( !div ) {
			ns.corporation.expandIndustry("Agriculture", "Greenwoods");
		}
		stage = 1;
	} else if (ns.args[0]!=1 && ns.args[0]!=2 && ns.args[0]!=3 && ns.args[0]!=4 && ns.args[0]!=5) {
		ns.tprint( "Usage: corp_start.js <stage number>/<start>" );
		ns.tprint( "1 - Setup corp, 2 - first investors, 3 - stage 2 growth, 4 - second investors, 5 - stage 3 growth" );
		return;
	} else {
		if (ns.args[0]==1) {
			stage = 1;
		} else if (ns.args[0]==2) {
			stage = 2;
		} else if (ns.args[0]==3) {
			stage = 3;
		} else if (ns.args[0]==4) {
			stage = 4;
		} else if (ns.args[0]==5) {
			stage = 5;
		}
	}

	if (!ns.getPlayer().hasCorporation) {
		ns.corporation.createCorporation("Darkgate");
	}

	var corp = ns.corporation.getCorporation();
	if (corp.divisions.length < 1) {
		// initial Company setup
		ns.corporation.expandIndustry("Agriculture", "Greenwoods");
		corp = ns.corporation.getCorporation();
	}

// need $100m for API's...

	if (ns.args[0] == 4) {
		await trickInvest( ns, corp.divisions[0] );
	}

	while (true) {
		corp = ns.corporation.getCorporation();

		if (stage == 1) { 
			if (await buyAgriculture1(ns)) { stage++; } // must be part of the main loop to pass the cancel sell order.
		}
		else if (stage == 2) {
			if (await trickInvest( ns, corp.divisions[0], stage ) {
			stage++; }
		}
		else if (stage == 3) { 
			if (await buyAgriculture2(ns)) { stage++; } // must be part of the main loop to pass the cancel sell order.
		} else if (stage == 4) {
			if (await trickInvest( ns, corp.divisions[0], stage ) {
				stage++; }
		} else if (stage == 5) {
			if (await buyAgriculture3(ns)) { stage++; } //jump to next script here
		} else if (stage == 6) {
			ns.spawn( "/corp/corp_mid.js", 1 );	
		}


		// Initial setup - these require office api and warehouse api...
		// 		Buy Smart Supply
		// 		Configure Smart Supply

		// 		Expand offices to all cities
		//			Hire 3 Employes - Ops, Engineer & Business

		// 		If all cities established then buy AdVert.Inc

		// 		Upgrade each office storage to 300
		//			Sell plants and food (MAX MP)

		// Grow
		//
		//		Buy:
		//			FocusWires
		//			Neural Accelerators
		//			Speech Processor Implants
		//			Nuoptimal Nootropic Injector Implants
		//			Smart Factories
		//		Repeat 2nd time.
		//
		//		Production multipliers:
		//		Buy:
		//			125 Hardware (12.5/s for one tick)
		//			75 AI Cores (7.5/s for one tick)
		//			27000 Real Estate (2700/s for one tick)
		//
		//	Trick Investors once $1.5m/s basic (210b)
		//
		// 2nd STAGE
		//
		//	Upgrade:
		//
		//		All offices TO 9 employees (2x 3 office size)
		//		Ops 2, Engineer 2, Business 1, Management 2, R&D 2
		//		Smart Factories and Smart Storage to level 10
		//		Warehouse sizes to 10
		//
		//		Buy:
		//			
		//			2675 Hardware (267.5/s for one tick)
		//			2445 AI Cores (244.5/s for one tick)
		//			119400 Real Estate (11940/s for one tick)
		//			96 Robots (9.6/s for one tick)
		//
		// Trick Investors (5t)
		//
		//	3rd STAGE
		//
		//		Warehouse sizes to 19 (3800 total)
		//
		//		Buy:
		//			
		//			6500 Hardware (650/s for one tick)
		//			3750 AI Cores (375/s for one tick)
		//			84000 Real Estate (8400/s for one tick)
		//			630 Robots (63/s for one tick)
		//
		// Establish product


		
		displayInfo( ns );

		await ns.sleep(1000);
	}

	
}

async function trickInvest(ns, division, stage=0, productCity = "Aevum" ) {
//	ns.print("Prepare to trick investors");
	log.push("Prepare to trick investors");
	for (var city of cities) {
		// stop selling products
		ns.corporation.sellMaterial(division.name, city, "Food", "0", "MP");
		ns.corporation.sellMaterial(division.name, city, "Plants", "0", "MP");
	}

	ns.print("Wait for warehouses to fill up");
	log.push("Wait for warehouses to fill up");
	//ns.print("Warehouse usage: " + refWarehouse.sizeUsed + " of " + refWarehouse.size);
	let allWarehousesFull = false;
	while (!allWarehousesFull) {
		allWarehousesFull = true;
		for (const city of cities) {
			if (ns.corporation.getWarehouse(division.name, city).sizeUsed <= (0.98 * ns.corporation.getWarehouse(division.name, city).size)) {
				allWarehousesFull = false;
				break;
			}
		}
		await ns.sleep(5000);
	}
	ns.print("Warehouses are full, start selling");
	log.push("Warehouses are full, start selling");

	var initialInvestFunds = ns.corporation.getInvestmentOffer().funds;
	ns.print("Initial investmant offer: " + ns.nFormat(initialInvestFunds, "0.0a"));
	log.push("Initial investmant offer: " + ns.nFormat(initialInvestFunds, "0.0a"));
	for (var city of cities) {
		// sell products again
		ns.corporation.sellMaterial(division.name, city, "Food", "MAX", "MP");
		ns.corporation.sellMaterial(division.name, city, "Plants", "MAX", "MP");
	}
// need an exit from these and throw back a return so that the stage is not incremented if the condition has not been met
	if (stage==2) {
		var timer = 0;
		while (ns.corporation.getInvestmentOffer().funds < 400000000000) { // wait for offer to be above 400bn
			ns.clearLog();
			ns.print("Initial investment offer: " + ns.nFormat(initialInvestFunds,"0.000a"));
			ns.print("Current investment offer: " + ns.nFormat(ns.corporation.getInvestmentOffer().funds, "0.0a"));
			ns.print("Funds before investment: " + ns.nFormat(ns.corporation.getCorporation().funds, "0.0a"));
			await ns.sleep(200);
			timer++; // CHECK THIS CODE WORKS!!
			if (timer > 300) { return false; }
		}
		if (ns.corporation.getInvestmentOffer().round == 1) {
			ns.corporation.acceptInvestmentOffer();
		} else { return false; }
	} else if (stage==4) {
		while (ns.corporation.getInvestmentOffer().funds < 8000000000000) { // wait for the offer to be above 8tn
			ns.clearLog();
			ns.print("Initial investment offer: " + ns.nFormat(initialInvestFunds,"0.000a"));
			ns.print("Current investment offer: " + ns.nFormat(ns.corporation.getInvestmentOffer().funds, "0.0a"));
			ns.print("Funds before investment: " + ns.nFormat(ns.corporation.getCorporation().funds, "0.0a"));
			await ns.sleep(200);
			timer++; // CHECK THIS CODE WORKS!!
			if (timer > 300) { return false; }
		}
		if (ns.corporation.getInvestmentOffer().round == 2) {
			ns.corporation.acceptInvestmentOffer();
		} else { return false; }
	}
	return true;
}

async function buyAgriculture3(ns) {
	var complete = true;
	var corp = ns.corporation.getCorporation();

	// find the agriculture division.
	var argiDivision = null;
	for (var division of corp.divisions) {
		if (division.type=="Agriculture") { var argiDivision = division; }
	}
	if (argiDivision==null) return; // no agriculture division

	const reqWarehouseSize = 3800;
	var upgraded = true;
	while (upgraded) {
		upgraded = false;
		for (var city of cities) {
			var cityWarehouse = ns.corporation.getWarehouse(division.name, city);
			log.push( city + " has " + cityWarehouse.size + " capacity." );
			if (cityWarehouse.size < reqWarehouseSize) {
				complete = false;
				ns.corporation.upgradeWarehouse(division.name, city);
				upgraded = true;
			}
		}
	}

	if (!upgradeProductMultipliers( ns, argiDivision, [ ["Hardware", 9300], ["Robots", 726], ["AI Cores", 6270], ["Real Estate",230400] ] )) { complete = false; }

	return complete;
}



async function buyAgriculture2(ns) {
	var complete = true;
	var corp = ns.corporation.getCorporation();

	//	Upgrade:
		//
		//		All offices TO 9 employees (2x 3 office size)
		//		Ops 2, Engineer 2, Business 1, Management 2, R&D 2
		//		Smart Factories and Smart Storage to level 10
		//		Warehouse sizes to 10
		//
	const reqSize = 9;
	var division = corp.divisions[0];

	const jobs = [["Operations", 2], ["Engineer", 2], ["Business", 1], ["Management", 2], ["Research & Development",2] ];

	// expand office size
	for (var city of cities) {
		var officeSize = ns.corporation.getOffice( division.name, city ).size;
		var expansionSize = reqSize - officeSize;
		if (expansionSize > 0 ) {
			complete = false; 
			ns.corporation.getOfficeSizeUpgradeCost( division.name, city, expansionSize );

			log.push( `Expanding ${division.name}: ${city} by ${expansionSize}.`);
			displayInfo(ns);
			ns.corporation.upgradeOfficeSize( division.name, city, expansionSize );
		}

		// hire employees
		var office = ns.corporation.getOffice( division.name, city );
		for ( var i = office.employees.length ; i < office.size ; i++ ) {
			complete = false;
			ns.corporation.hireEmployee( division.name, city );
		}

		// set jobs
		for (var job of jobs) {
			if (office.employeeJobs[job[0]] < job[1] ) {
				complete = false;
				await ns.corporation.setAutoJobAssignment( division.name, city, job[0], job[1] );
				log.push( `Setting ${division.name}:${city} ${job[0]} to ${job[1]}`);
			}
			displayInfo(ns);
		}
	}
	var lvlFactory = ns.corporation.getUpgradeLevel("Smart Factories");
	for (var i = lvlFactory ; i < 10 ; i++ ) {
		complete = false;
		ns.corporation.levelUpgrade( "Smart Factories" );
		log.push( "Levelling smart factories.")
		displayInfo(ns);
	}

	var lvlStorage = ns.corporation.getUpgradeLevel("Smart Storage");
	for (var i = lvlStorage ; i < 10 ; i++ ) {
		complete = false;
		ns.corporation.levelUpgrade( "Smart Storage" );
		log.push( "Levelling Smart Storage" );
		displayInfo(ns);
	}

	// Upgrade warehouses.
	log.push( "Upgrading warehouses" );
	displayInfo(ns);

	const reqWarehouseSize = 2000;
	var upgraded = true;
	while (upgraded) {
		upgraded = false;
		for (var city of cities) {
			var cityWarehouse = ns.corporation.getWarehouse(division.name, city);
			log.push( city + " has " + cityWarehouse.size + " capacity." );
			if (cityWarehouse.size < reqWarehouseSize) {
				complete = false;
				ns.corporation.upgradeWarehouse(division.name, city);
				upgraded = true;
			}
		}
	}


	displayInfo(ns);
	if (!upgradeProductMultipliers( ns, division, [ ["Hardware", 2800], ["Robots", 96], ["AI Cores", 2520], ["Real Estate",146400] ] )) { complete = false; }
	return complete;
}

		//			125 Hardware (12.5/s for one tick)
		//			75 AI Cores (7.5/s for one tick)
		//			27000 Real Estate (2700/s for one tick)



async function buyAgriculture1(ns) {
	var corp = ns.corporation.getCorporation();
	var complete = true;

	// buy smart supply
	if (!ns.corporation.hasUnlockUpgrade("Smart Supply")) {
		complete = false;
		ns.corporation.unlockUpgrade( "Smart Supply" );
		ns.print( "Unlocking smart supply." );
	}
	// turn on smart supply
	// expand offices - 3 employees in each of operations, engineer and business
	// one adVert

	// buy FocusWires, Neural Accelerators, Speech Processor Implants, Nuoptimal Nootropic Injector Implants, Smart Factories

	// find the agriculture division.
	var argiDivision = null;
	for (var division of corp.divisions) {
		if (division.type=="Agriculture") { var argiDivision = division; }
	}
	if (argiDivision==null) return; // no agriculture division

	if (ns.corporation.getHireAdVertCount(argiDivision.name) < 1) {
		complete = false;
		ns.corporation.hireAdVert(argiDivision.name);
		ns.print( "Hiring AdVert" );
	}

	var upgrades = [ ["FocusWires", 2], ["Neural Accelerators", 2], ["Speech Processor Implants",2], ["Nuoptimal Nootropic Injector Implants",2], ["Smart Factories",2] ];
	for (var upgrade of upgrades) {
		while (ns.corporation.getUpgradeLevel(upgrade[0]) < upgrade[1]) {
			complete = false;
			ns.corporation.levelUpgrade(upgrade[0]);
			ns.print( "Levelling " + upgrade[0] );
		}
	}


	ns.print( argiDivision.name );

	// expand to all cities
	for (var city of cities) {
		if (argiDivision.cities.indexOf(city) == -1) {
			complete = false;
			await ns.corporation.expandCity( argiDivision.name, city);
			ns.print( "Expanding to " + city );
		} else {
			//ns.print( "Already expanded to " + city );
		}
	}

	const reqWarehouseSize = 300;
	var upgraded = true;
	while (upgraded) {
		upgraded = false;
		for (var city of cities) {
			if (ns.corporation.hasWarehouse( argiDivision.name, city )) {
				var cityWarehouse = ns.corporation.getWarehouse(argiDivision.name, city);
				log.push( city + " has " + cityWarehouse.size + " capacity." );
			//	ns.print( city + " has " + cityWarehouse.size + " capacity." );
				if (cityWarehouse.size < reqWarehouseSize) {
					complete = false;
					ns.corporation.upgradeWarehouse(argiDivision.name, city);
					upgraded = true;
				}
			} else {
				complete = false;
				ns.corporation.purchaseWarehouse( argiDivision.name, city );
			}
			//ns.print( "checking next city" );
		}
	}


	for (var city of cities) {
		var employees = ns.corporation.getOffice(argiDivision.name, city).employees.length;
		const size = ns.corporation.getOffice(argiDivision.name, city).size;
		while ( employees < size ) {
			complete = false;
			ns.corporation.hireEmployee(argiDivision.name, city);
			employees = ns.corporation.getOffice(argiDivision.name, city).employees.length;
		}

		if (!await doAssign(ns, argiDivision.name, city, "Operations", 1)) { complete = false }
		if (!await doAssign(ns, argiDivision.name, city, "Engineer", 1)) { complete = false }
		if (!await doAssign(ns, argiDivision.name, city, "Business", 1)) { complete = false }
		if (!await doAssign(ns, argiDivision.name, city, "Management", 0)) { complete = false }
		if (!await doAssign(ns, argiDivision.name, city, "Research & Development", 0)) { complete = false }
		if (!await doAssign(ns, argiDivision.name, city, "Training", 0)) { complete = false }
	}

	for (var city of cities) {
		ns.corporation.setSmartSupply(argiDivision.name, city, true);
		ns.corporation.sellMaterial( argiDivision.name, city, "Food", "MAX", "MP" );
		ns.corporation.sellMaterial( argiDivision.name, city, "Plants", "MAX", "MP" );
	}


	if (!upgradeProductMultipliers( ns, argiDivision, [ ["Hardware", 125], ["AI Cores", 75], ["Real Estate",27000] ] )) { complete = false; }
	return complete;
}


function upgradeProductMultipliers( ns, division, shoppingList ) {
    var timeStamp = convertMSToHHMMSS( (new Date().getTime()) ) + ": ";
	var complete = true;

	for (const city of division.cities) {
		for (var shoppingListItem of shoppingList) {
			var material = ns.corporation.getMaterial( division.name, city, shoppingListItem[0] );
			var materialQty = Math.round(material.qty);
			var amtToBuy = (shoppingListItem[1] - materialQty)/10;
	
			if ( materialQty < shoppingListItem[1] ) { // less than amount on shopping list, need to buy
				complete = false;
				log.push( timeStamp + city + " wants to buy " + (amtToBuy*10) + ` (${amtToBuy}) of ` + material.name + ` currently have ${materialQty} needed ${shoppingListItem[1]}` );
				ns.corporation.buyMaterial( division.name, city, material.name, (amtToBuy) ); // set buy amount for 1 tick;
			} else if (materialQty == shoppingListItem[1]) { // have enough, cancel buy order.
				ns.corporation.buyMaterial( division.name, city, material.name, 0 ); //stop buying
				ns.corporation.sellMaterial( division.name, city, material.name, 0, "MP" ); //stop selling
			} /*else if (materialQty > shoppingListItem[1]) { // too much, sell some
				complete = false;
				ns.corporation.sellMaterial( division.name, city, material.name, (amtToBuy*-1), 0 ); //stop buying
				log.push( timeStamp + city + " wants to sell " + (amtToBuy*10) + ` (${amtToBuy}) of ` + material.name + ` currently have ${materialQty} needed ${shoppingListItem[1]}` );
			}*/
			displayInfo(ns);
		}
	}	
	return complete;
}


function displayInfo( ns ) {
	// Display corp info
	ns.clearLog();
	var corp = ns.corporation.getCorporation();
	ns.print( `Funds ${ns.nFormat(corp.funds,"0.000a")}`);
	for (const division of corp.divisions.reverse()) {
		ns.print( `${division.name} ${ns.nFormat(division.lastCycleRevenue-division.lastCycleExpenses,"0.000a")}`);
	}
	ns.print( "" );
	// print log
	for (var i=(log.length-1) ; i > (log.length-10) ; i--) {
		if (i<0) { continue; }
		ns.print(log[i]);	
	}
}


async function doAssign( ns, division, city, job, number ) {
	var complete = true;
	var officeEmps = ns.corporation.getOffice( division, city ).employeeJobs;
	if ( officeEmps[job] != number ) {
		complete = false;
		await ns.corporation.setAutoJobAssignment( division, city, job, number );
		log.push( timeStamp() + division + ": " + city + " " + job + " " + officeEmps[job] + "/" + number );
	} else {
		//log.push( division + ": " + city + " " + job + " " + officeEmps[job] + "/" + number );
	}
	return complete;
}


const cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"];

const upgradeList = [
	// lower priority value -> upgrade faster
	{ prio: 2, name: "Project Insight", },
	{ prio: 2, name: "DreamSense" },
	{ prio: 4, name: "ABC SalesBots" },
	{ prio: 4, name: "Smart Factories" },
	{ prio: 4, name: "Smart Storage" },
	{ prio: 8, name: "Neural Accelerators" },
	{ prio: 8, name: "Nuoptimal Nootropic Injector Implants" },
	{ prio: 8, name: "FocusWires" },
	{ prio: 8, name: "Speech Processor Implants" },
	{ prio: 8, name: "Wilson Analytics" },
];

const researchList = [
	// lower priority value -> upgrade faster
	{ prio: 10, name: "Overclock" },
	{ prio: 10, name: "uPgrade: Fulcrum" },
	{ prio: 3, name: "uPgrade: Capacity.I" },
	{ prio: 4, name: "uPgrade: Capacity.II" },
	{ prio: 10, name: "Self-Correcting Assemblers" },
	{ prio: 21, name: "Drones" },
	{ prio: 4, name: "Drones - Assembly" },
	{ prio: 10, name: "Drones - Transport" },
	{ prio: 26, name: "Automatic Drug Administration" },
	{ prio: 10, name: "CPH4 Injections" },
];