/** @param {NS} ns */
export async function main(ns) {
	ns.tail();
	ns.disableLog("ALL");
	for (var task of ns.gang.getTaskNames()) {
		var taskInfo = ns.gang.getTaskStats(task);
		ns.print(taskInfo.name + " " + taskInfo.baseRespect + " " + taskInfo.difficulty + " " + taskInfo.baseMoney + " " + taskInfo.strWeight);
	}
}