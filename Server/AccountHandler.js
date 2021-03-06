const { hash, compare } = require('bcrypt');
const r = require('rethinkdbdash')({
    db: 'union'
});


/**
 * TODO: Description
 * @param {String} username The username of the account to create
 * @param {String} password The password of the account to create
 * @returns {Boolean} Whether the account was created or not
 */
async function create(username, password) {
    const account = await r.table('users').get(username);

    if (account !== null) {
        return false;
    } else {
        await r.table('users').insert({
            id: username,
            password: await hash(password, 10),
            createdAt: Date.now(),
            servers: await getServers(), // Throw them in every server because why not
            online: false
        });

        return true;
    }
}


/**
 * TODO: Description
 * @param {String} username The username of the account to check
 * @param {String} password The password of the account to check
 * @returns {(Null|Object)} The user object if authentication was successful, otherwise null
 */
async function authenticate(username, password) {
    const account = await r.table('users').get(username);

    if (account === null) {
        return null;
    } else {
        const isPasswordValid = await compare(password, account.password);
        if (isPasswordValid) {
            return account;
        } else {
            return null;
        }
    }
}


/**
 * TODO: Description
 * @param {Number} serverId The user to get the servers of
 */
async function getUsersInServer(serverId) {
    const users = await r.table('users').without('password');
    const inServer = users.filter(user => user.servers.includes(serverId));
    return inServer;
}

/**
 * TODO: Description
 * @param {String} username Username of the user to retrieve the servers of
 */
async function getServersOfUser(username) {
    const user = await r.table('users').get(username);

    if (!user) {
        return []; // This shouldn't happen but you can never be too careful
    }

    const servers = await r.table('servers').getAll(...user.servers).coerceTo('array');
    return servers;
}


/**
 * Updates the online status of the given uesr
 * @param {String} username Username of the user to update the presence of
 * @param {Boolean} online Whether the user is online or not
 */
async function updatePresenceOf(username, online) {
    await r.table('users').get(username).update({ online });
}


async function getServers() {
    const servers = await r.table('servers');
    return servers.map(s => s.id);
}


module.exports = {
    create,
    authenticate,
    getUsersInServer,
    getServersOfUser,
    updatePresenceOf
};
