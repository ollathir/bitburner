export async function main(ns) {
    const args = ns.flags([['help', false]]);
    const hostname = args._[0];
    if(args.help || !hostname) {
        ns.tprint("This script will generate money by hacking a target server.");
        ns.tprint(`USAGE: run ${ns.getScriptName()} SERVER_NAME`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} n00dles`);
        return;
    }
    while (true) {
        {
            var cur = ns.getServerMoneyAvailable(hostname);
            var max = ns.getServerMaxMoney(hostname);
            // only hack when over 90% available cash
            if ( cur > (max * 0.7) ) {
                await ns.hack(hostname);
            }
            await ns.sleep(200);
        }
    }
}