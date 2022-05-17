/** @param {NS} ns */
export async function main(ns) {
  // just weakens and hacks. Meant for use on a server with no funds for maximum exp gain.
  const args = ns.flags([["help", false]]);
  const hostname = ns.args[0];
  
  if (ns.args[1]=="noloop") {
    await ns.hack(hostname);
  } else {
    while(true) 
    {
        await ns.hack(hostname);
        await ns.sleep(10);
    }
  }
}