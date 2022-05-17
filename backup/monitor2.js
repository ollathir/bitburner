function scan(ns, parent, server, list) {
    const children = ns.scan(server);
    for (let child of children) {
        if (parent == child) {
            continue;
        }
        list.push(child);
        
        scan(ns, server, child, list);
    }
}

export function list_servers(ns) {
    const list = [];
    scan(ns, '', 'home', list);
    list.push('home');
    return list;
}

export async function main(ns) {
    const script = 'justhack.js';
    const growWeaken = 'growweaken.js';
    const flags = ns.flags([
        ['refreshrate', 200],
        ['help', false],
    ])
    if (flags._.length === 0 || flags.help) {
        ns.tprint("This script helps visualize the money and security of a server.");
        ns.tprint(`USAGE: run ${ns.getScriptName()} SERVER_NAME`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} n00dles`)
        return;
    }
    ns.tail();
    ns.disableLog('ALL');
    while (true) {
        const server = flags._[0];
        let money = ns.getServerMoneyAvailable(server);
        if (money === 0) money = 1;
        const maxMoney = ns.getServerMaxMoney(server);
        const minSec = ns.getServerMinSecurityLevel(server);
        const sec = ns.getServerSecurityLevel(server);

        // are we currently hacking or weakening? if so, how many threads?
        var hServers = list_servers(ns);
        var scriptCount = 0; var weakenCount = 0;
        for (var hServer of hServers) {
            if (ns.isRunning(script, hServer, server )) { // hacking script
                var processes = ns.ps(hServer);
                for (var process of processes) {
                    if (process.filename==script && process.args==server) {
                        scriptCount = scriptCount + process.threads;
                    }
                }
            }
            if (ns.isRunning(growWeaken, hServer, server )) { // grow/weaken script
                var processes = ns.ps(hServer);
                for (var process of processes) {
                    if (process.filename==growWeaken && process.args==server) {
                        weakenCount = weakenCount + process.threads;
                    }
                }
            }
        }

        ns.clearLog(server);
        ns.print(`${server}:`);
        ns.print(` $_______: ${ns.nFormat(money, "$0.000a")} / ${ns.nFormat(maxMoney, "$0.000a")} (${(money / maxMoney * 100).toFixed(2)}%)`);
        ns.print(` security: +${(sec - minSec).toFixed(2)}`);
        ns.print(` hack____: ${ns.tFormat(ns.getHackTime(server))} (t=${Math.ceil(ns.hackAnalyzeThreads(server, money))})`);
        ns.print(` grow____: ${ns.tFormat(ns.getGrowTime(server))} (t=${Math.ceil(ns.growthAnalyze(server, maxMoney / money))})`);
        ns.print(` weaken__: ${ns.tFormat(ns.getWeakenTime(server))} (t=${Math.ceil((sec - minSec) * 20)})`);
        ns.print(` threads_: Hacking: ${scriptCount} Grow/Weaken: ${weakenCount}`)
        await ns.sleep(flags.refreshrate);
    } 
}

export function autocomplete(data, args) {
    return data.servers;
}