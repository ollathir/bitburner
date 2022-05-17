/** @param {NS} ns **/
export async function main(ns) {
  // just weakens and hacks. Meant for use on a server with no funds for maximum exp gain.
  const args = ns.flags([["help", false]]);
  const hostname = ns.args[0];
  
  while(true) {
      if ((ns.getServerSecurityLevel(hostname)*2)>ns.getServerMinSecurityLevel(hostname))
      {    await ns.weaken(hostname); }
      await ns.sleep(10);
      await ns.hack(hostname);
  }
}