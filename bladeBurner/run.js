function getStaminaPercentage(ns) {
  const res = ns.bladeburner.getStamina();
  return 100 * (res[0] / res[1]);
}

function canWork(ns) {
  return getStaminaPercentage(ns) > 0.5;
}

function shouldTrain(ns) {
  const res = ns.bladeburner.getStamina();
  return res[1] > 400;
}

function rest(ns) {
  if (shouldTrain(ns)) {
    ns.bladeburner.startAction("general", "Training");
    return ns.bladeburner.getActionTime("general", "Training") * 1000;
  }
  ns.bladeburner.startAction("general", "Field Analysis");
  return ns.bladeburner.getActionTime * 1000;
}

const getChance = (type, name, ns) =>
  ns.bladeburner.getActionEstimatedSuccessChance(type, name);

function work(ns) {
  const contracts = ns.bladeburner.getContractNames();
  const operations = ns.bladeburner.getOperationNames();

  const bestContract = contracts
    .map(contract => {
      return {
        type: "contract",
        name: contract,
        chance: getChance("contract", contract, ns)
      };
    })
    .reduce((a, b) => (a.chance > b.chance ? a : b));

  const bestOp = operations
    .map(operation => {
      return {
        type: "operation",
        name: operation,
        chance: getChance("operation", operation, ns)
      };
    })
    .reduce((a, b) => (a.chance > b.chance ? a : b));

  if (bestOp.chance >= bestContract.chance) {
    ns.bladeburner.startAction(bestOp.type, bestOp.name);
    return ns.bladeburner.getActionTime(bestOp.type, bestOp.name) * 1000;
  }
  ns.bladeburner.startAction(bestContract.type, bestContract.name);
  return (
    ns.bladeburner.getActionTime(bestContract.type, bestContract.name) * 1000
  );
}

function checkSkills(ns) {
  const skills = ns.bladeburner.getSkillNames().map(skill => {
    return {
      name: skill,
      level: ns.bladeburner.getSkillLevel(skill),
      cost: ns.bladeburner.getSkillUpgradeCost(skill)
    };
  });
  skills.forEach(skill => {
    if (skill.cost < ns.bladeburner.getSkillPoints())
      ns.bladeburner.upgradeSkill(skill.name);
  });
}

export async function main(ns) {
  // Set max autolevel of everything.
  const contracts = ns.bladeburner.getContractNames();
  const operations = ns.bladeburner.getOperationNames();

  contracts.forEach(contract =>
    ns.bladeburner.setActionAutolevel("contract", contract, true)
  );
  operations.forEach(operation =>
    ns.bladeburner.setActionAutolevel("operation", operation, true)
  );
  while (true) {
    const sleepTime = canWork(ns) ? work(ns) : rest(ns);
    await ns.sleep(sleepTime);
    checkSkills(ns);
  }
}