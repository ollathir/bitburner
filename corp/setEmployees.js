/** @param {NS} ns */
export async function main(ns) {
	var corp = ns.corporation.getCorporation();
	var productCity = "Aevum";
	for ( const division of corp.divisions.reverse() ) {
		// set jobs after hiring people just in case we hire lots of people at once and setting jobs is slow
		for (const city of cities) {
			var employees = ns.corporation.getOffice(division.name, city).employees.length;
			if (ns.corporation.hasResearched(division.name, "Market-TA.II")) {
				// TODO: Simplify here. ProductCity config can always be used
				if (city == productCity) {
					await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", Math.ceil(employees / 5));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", Math.ceil(employees / 5));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Business", Math.ceil(employees / 5));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Management", Math.ceil(employees / 10));
					var remainingEmployees = employees - (3 * Math.ceil(employees / 5) + Math.ceil(employees / 10));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Training", Math.ceil(remainingEmployees));
				}
				else {
					await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", Math.floor(employees / 10));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", 1);
					await ns.corporation.setAutoJobAssignment(division.name, city, "Business", Math.floor(employees / 5));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Management", Math.ceil(employees / 100));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Research & Development", Math.ceil(employees / 2));
					var remainingEmployees = employees - (Math.floor(employees / 5) + Math.floor(employees / 10) + 1 + Math.ceil(employees / 100) + Math.ceil(employees / 2));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Training", Math.floor(remainingEmployees));
				}
			}
			else {
				if (city == productCity) {
					await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", Math.floor((employees - 2) / 2));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", Math.ceil((employees - 2) / 2));
					await ns.corporation.setAutoJobAssignment(division.name, city, "Management", 2);
				}
				else {
					await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", 1);
					await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", 1);
					await ns.corporation.setAutoJobAssignment(division.name, city, "Research & Development", (employees - 2));
				}
			}
		}
	}
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