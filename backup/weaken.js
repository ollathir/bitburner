export async function main(ns) {
    const args = ns.flags([['help', false]]);
    const hostname = args._[0];
    if(args.help || !hostname) {
        ns.tprint("This script will weaken a target server.");
        ns.tprint(`USAGE: run ${ns.getScriptName()} SERVER_NAME`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} n00dles`);
        return;
    }
    while (true) {
        
            await ns.weaken(hostname);
        
    }
}