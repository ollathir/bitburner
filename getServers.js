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
    return list;
}

export function list_open_servers(ns, includeHacknetServers=false) {
    var servers = list_servers(ns);

   var bFound=true;
    while (bFound) {
        bFound=false;
        for (var server of servers) {
            if (bFound) { continue; }
            var index=servers.indexOf(server);
            if ( includeHacknetServers==false && server.includes("hacknet") ) {
                servers.splice(index, 1);
                bFound=true;
            }
            if (!ns.hasRootAccess(server)) { // throw out closed servers
                servers.splice(index, 1);
                bFound=true;
            }
        }
    }
    servers.push("home");

    return servers;
}

export async function list_hack_servers(ns, chanceToHack) {
    var servers = list_servers(ns);
/*	const purchasedServers = await ns.getPurchasedServers();

    // throw out purchaed servers.. below probably does the same thinking about it.
	for (var purchasedServer of purchasedServers) {
        var index = servers.indexOf(purchasedServer);
		if (index > -1 ) {
			servers.splice(index,1);
		}
	}
*/
    var bFound=true;
    while (bFound) {
        bFound=false;
        for (var server of servers) {
            if (bFound) { continue; }
            var index=servers.indexOf(server);
            if (ns.getServerMaxMoney(server)==0 || ns.hackAnalyzeChance(server)<=chanceToHack || !ns.hasRootAccess(server)) { // throw out servers with no money, or a hack chance < 80%
                servers.splice(index, 1);
                bFound=true;
            }
        }
    }

    return servers;
}

export async function list_hack_servers_sorted(ns, chanceToHack) {
    var servers = await list_hack_servers(ns, chanceToHack);

    // Sort servers by max server cash (lowest first to prioritise easier hacks)
    var len = servers.length;
    var bSwap=true;
    while (bSwap)
    {
        bSwap=false;
        for (var i = 1 ; i <= (len-1) ; i++ )
        {
            if ( ns.getServerMaxMoney(servers[i-1]) < ns.getServerMaxMoney(servers[i]) )
            {
                var tempCurrentTarget=servers[i-1];
                servers[i-1] = servers[i];
                servers[i] = tempCurrentTarget;
                bSwap=true;
            }
        }
    }
    return servers;
}

export async function list_hack_servers_sorted_a(ns, chanceToHack) {
    var servers = await list_hack_servers(ns, chanceToHack);

    // Sort servers by max server cash (lowest first to prioritise easier hacks)
    var len = servers.length;
    var bSwap=true;
    while (bSwap)
    {
        bSwap=false;
        for (var i = 1 ; i <= (len-1) ; i++ )
        {
            if ( ns.getServerMaxMoney(servers[i-1]) > ns.getServerMaxMoney(servers[i]) )
            {
                var tempCurrentTarget=servers[i-1];
                servers[i-1] = servers[i];
                servers[i] = tempCurrentTarget;
                bSwap=true;
            }
        }
    }
    return servers;
}

// Function to get a path between two servers
// Parameters:
//   ns      : The NetScript object
//   parent  : Tracks the root of the search during recursion, should an empty string
//             when called from outside of the function itself
//   current : The server from which this recursion level is starting, should be the
//             current server when called from outside of the function itself
//   target  : The intended destination of the path, on success, will be the last
//                         element of the 'path' array on return to the caller
//   path    : An array into which the path between 'current' and 'target' will be
//             stored on successful return, where path[0] is 'current', and
//             path[path.length - 1] is 'target'
//
// Returns:
//   true  when a path between servers is found; 'path[]' will be non-empty
//   false when no path from the current server to the target server could be
//         constructed; 'path[]' will not be populated.
//
// Notes:
//   * I stole this 'serverPath()' function implementation from an example script,
//     changed its name and some parameter names, and added comments. Unfortunately,
//     I do not recall the source of the original so I can give proper credit.
//   * This function is only safe on tree-structured server node graphs, if there
//     are multiple paths between any two nodes in the graph, the back-track check
//     implemented in this function is not adequate to avoid cycles, and because
//     the 'scan()' function probably always returns the 'children' in the same
//     order for a given server node, once the cycle begins, it will recurse until
//     the stack cannot be extended any further, then blow up.
//     To prevent cycles, another parameter that records the nodes that have already
//     been visited on the way to the current node can be added (actually, it would
//     replace the 'parent' parameter); the 'current' node would be added to the
//     visited array, then check to see whether each neighbor child has already been
//     visited, and if not, then the recursion can continue for that neighbor.
//     Note that this would require that the caller always provide an empty
//     'visited' array.
//     I am not using the version that allows for a non-tree organization here
//     because Bitburner currently always organizes the nodes in a tree-like
//     arrangement (at most one path between nodes, any node can be viewed as
//     'root' for a search) so this version is good enough.
export function serverPath(ns, parent, current, target, path) {
    const children = ns.scan(current);   // find neighbors of 'current'
    for (let child of children) {    // Walk through the neighbor list
        // Avoid backtracking
        if (parent == child) {
            continue;  // we came from here, don't go back
        }
        // Check to see if we've reached our destination
        if (child == target) {   // Found the target
            // Build the end of the path by pushing servers into the path
            // from the top (aka, left)
            path.unshift(child); // Right-most is the target server
            path.unshift(current); // Just to the left of that is this one
            return true;  // The end of the path has been found
        }

        // When we get here, we've not yet found the target, so 'path'
        // will be empty, and we need to recurse for each neighbor
        // that we've not visited before until one of them leads
        // to the target (returns 'true')
        if (serverPath(ns, current, child, target, path)) {
            // This neighbor was on the path to the target;
            // Put the current server at the beginning of the
            // path and let the caller know that the destination was found
            path.unshift(current);      // path[0] is now 'current'
            return true; // 'path' contains a path
        }
    }
    // If execution reaches this location, no path to 'target' was found
    // from current; so long as this is not the zero'th recursion level,
    // this is not a problem because the recursive search is likely not
    // done, and perhaps a neigboring server will be be on the path to
    // the target.
    return false;       // No path from here, sorry
} // end of serverPath()