export async function main(ns) {
	for (var file of files) {
		await ns.wget( "https://raw.githubusercontent.com/ollathir/bitburner/main/" + file, file, "home");
	}
}

const files = [
"/backup/createGang.js",
"/backup/earlyHack.js",
"/backup/findserver.js",
"/backup/growweaken.js",
"/backup/hack.js",
"/backup/hackAll_v4.js",
"/backup/hackall-bs2.js",
"/backup/hackall.js",
"/backup/hackallv3.js",
"/backup/hackgrowall2.js",
"/backup/hacknet-upgrades.js",
"/backup/justWeaken.js",
"/backup/justhack.js",
"/backup/main-hack.js",
"/backup/manHack.js",
"/backup/monitor2.js",
"/backup/purchaseServer.js",
"/backup/purchaseServerAuto.js",
"/backup/weaken.js",
"/backup/weakenall.js",
"/bb-vue/AppFactory.js",
"/bb-vue/ComponentManager.js",
"/bb-vue/MittLoader.js",
"/bb-vue/SassLoader.js",
"/bb-vue/VueLoader.js",
"/bb-vue/components/Button.js",
"/bb-vue/components/JsonDisplay.js",
"/bb-vue/components/LogDisplay.js",
"/bb-vue/components/ObjectDisplay.js",
"/bb-vue/components/Tabs.js",
"/bb-vue/components/concerns/useDraggableWin.js",
"/bb-vue/components/internal/AppRoot.Styles.js",
"/bb-vue/components/internal/AppRoot.js",
"/bb-vue/components/internal/AppTray.js",
"/bb-vue/components/internal/AppTrayGroup.js",
"/bb-vue/components/internal/ConsumerRoot.js",
"/bb-vue/components/internal/CssManager.js",
"/bb-vue/components/internal/ScriptX.js",
"/bb-vue/components/internal/Win.js",
"/bb-vue/components/internal/WinManager.js",
"/bb-vue/components/internal/_resources.js",
"/bb-vue/examples/0-getting-started.js",
"/bb-vue/examples/1-the-app-tray.js",
"/bb-vue/examples/2-events-and-communication.js",
"/bb-vue/examples/3-connecting-with-scripts.js",
"/bb-vue/examples/4-complex-and-fun.js",
"/bb-vue/lib.js",
"/bb-vue/misc-examples/asciichart-collector.js",
"/bb-vue/misc-examples/asciichart-lib.js",
"/bb-vue/misc-examples/asciichart-ui.js",
"/bb-vue/misc-examples/svgchart-builder.js",
"/bb-vue/misc-examples/svgchart-ui.js",
"/bb-vue/new-examples/0-getting-started.js",
"/bb-vue/new-examples/1-adding-components.js",
"/bb-vue/new-examples/2-writing-styles-scss.js",
"/bb-vue/new-examples/3-controlling-your-app.js",
"/bb-vue/new-examples/4-sending-data-from-scripts.js",
"/bb-vue/new-examples/5-demo-app.js",
"/bb-vue/package.txt",
"/bladeBurner/autoHospital.js",
"/bladeBurner/main.js",
"/bladeBurner/run.js",
"/box/box.js",
"/box/codeTheme.js",
"/box/icons.js",
"/box/overview.js",
"/box/overviewSimple.js",
"/box/styler.js",
"/cct/findCCT.js",
"/cct/solver.js",
"/corp/corp_mid.js",
"/corp/corp_start.js",
"/corp/setEmployees.js",
"/corp/start.js",
"/gangs/gangs.js",
"/hackAll_v4/functions.js",
"/hackAll_v4/loop.js",
"/hackAll_v4/main.js",
"/hackAll_v4/pureGrow.js",
"/hackAll_v4/pureHack.js",
"/hackAll_v4/pureWeaken.js",
"/hackAll_v5/grow.js",
"/hackAll_v5/hack.js",
"/hackAll_v5/loop.js",
"/hackAll_v5/loop_backup.js",
"/hackAll_v5/main.js",
"/hackAll_v5/main_backup.js",
"/hackAll_v5/weaken.js",
"/hackAll_v6/grow.js",
"/hackAll_v6/hack.js",
"/hackAll_v6/main.js",
"/hackAll_v6/weaken.js",
"/hackExp/expPureHack.js",
"/hackExp/expPureWeaken.js",
"/hackExp/main.js",
"/hacknet/hacknetAuto.js",
"/hacknet/hacknetCache.js",
"/hacknet/hacknetServer.js",
"/hacks/pureGrow.js",
"/hacks/pureHack.js",
"/hacks/pureWeaken.js",
"/hammerHack/grow.js",
"/hammerHack/hack.js",
"/hammerHack/loop.js",
"/hammerHack/main.js",
"/hammerHack/weaken.js",
"/singularity/backdoor.js",
"/singularity/crime.js",
"/singularity/crimeLight.js",
"/singularity/gym.js",
"/singularity/manualHack.js",
"/singularity/neuroFlux.js",
"/singularity/quickCrime.js",
"/singularity/startProgress.js",
"/singularity/tor.js",
"/singularity/upgradeHome.js",
"/status/HUD.js",
"/status/status2.js",
"/status/status_early.js",
"/status/status_mid.js",
"/stocks/functions.js",
"/stocks/grow.js",
"/stocks/hack.js",
"/stocks/hackNgrow.js",
"/stocks/stocks.js",
"/stocks/stocks2.js",
"/stocks/stocks3.js",
"/stocks/weaken.js",
"AutoLink.exe",
"BruteSSH.exe",
"DeepscanV1.exe",
"FTPCrack.exe",
"Formulas.exe",
"NUKE.exe",
"ServerProfiler.exe",
"activity.js",
"b1t_flum3.exe",
"bbv-inst.js",
"crimeStats.js",
"csec-test.msg",
"downloadFiles.js",
"files.txt",
"fl1ght.exe",
"functions.js",
"gangs-activity.js",
"getFiles.js",
"getServers.js",
"gotoServer.js",
"grindRep.js",
"hackallv4.js",
"hackers-starting-handbook.lit",
"j0.msg",
"j1.msg",
"j2.msg",
"listservers2.js",
"nitesec-test.msg",
"printTable.js",
"purchaseServerAuto.js",
"relaySMTP.exe",
"start.js",
"status.js",
"stock-activity.js",
"test.js",
"test2.js",
"test3.js",
"vitaLife.js",
]
