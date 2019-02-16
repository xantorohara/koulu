const storage = chrome.storage.local;

chrome.runtime.onInstalled.addListener(() => {
    resetAlarm();
    createMenu();
    chrome.alarms.onAlarm.addListener(syncCookies);
});

function resetAlarm() {
    chrome.alarms.clearAll(() => chrome.alarms.create('KouluTick', {when: 0, periodInMinutes: 1}));
}

function createMenu() {
    storage.get('trackedDomain', function (result) {
        const trackedDomain = result.trackedDomain;
        chrome.contextMenus.create({
            id: 'domains',
            title: 'Tracked domain',
            contexts: ['browser_action']
        });

        chrome.contextMenus.create({
            id: 'none',
            type: 'radio',
            title: 'None',
            checked: trackedDomain === null,
            parentId: 'domains',
            contexts: ['browser_action']
        });

        CFG_TRACKED_DOMAINS.forEach(domain => {
            chrome.contextMenus.create({
                id: 'domain:' + domain,
                type: 'radio',
                title: domain,
                checked: trackedDomain === domain,
                parentId: 'domains',
                contexts: ['browser_action']
            });
        });
    });

    chrome.contextMenus.onClicked.addListener((info) => {
        console.log('Context menu clicked:', info.menuItemId);
        if (info.menuItemId === 'none') {
            storage.set({trackedDomain: null});
        } else if (info.menuItemId.startsWith('domain:')) {
            storage.set({trackedDomain: info.menuItemId.substring('domain:'.length)});
        }
        resetAlarm();
    });
}

function ping(url, successCallback, errorCallback) {
    console.log('Ping', url);

    return fetch(url).then(response => {
        if (response.ok) {
            console.log('Ping OK');
            successCallback();
        } else {
            throw Error(response.statusText);
        }
    }).catch(error => {
        console.log('Ping FAILED', error.message);
        errorCallback(error.message);
    })
}

function syncCookies() {
    storage.get('trackedDomain', function (result) {
        const trackedDomain = result.trackedDomain;
        if (trackedDomain) {

            if (CFG_TRACKED_PING_URL) {
                const url = CFG_TRACKED_PING_URL.replace('${DOMAIN}', trackedDomain);

                updateBadge('...', '#39F', 'Connecting...');

                ping(url, () => {
                    copyCookies(trackedDomain, CFG_COPY_TO_DOMAIN, CFG_TRACKED_COOKIES, count => {
                        updateBadge(count, '#3C6',
                            'Ping timestamp: ' + getCurrentTimestamp() + '\nFrom domain: ' + trackedDomain);
                    });
                }, error => {
                    updateBadge('!', '#F00', error);
                });
            } else {
                copyCookies(trackedDomain, CFG_COPY_TO_DOMAIN, CFG_TRACKED_COOKIES, count => {
                    updateBadge(count, '#888',
                        'Sync timestamp: ' + getCurrentTimestamp() + '\nFrom domain: ' + trackedDomain);
                });
            }
        } else {
            console.log('Tracking disabled');
            updateBadge('', null, 'Tracking disabled');
        }
    });
}

function getCurrentTimestamp() {
    return new Date().toISOString().substring(0, 19).replace('T', ' ');
}

function updateBadge(text, color, tooltip) {
    if (text !== null) {
        chrome.browserAction.setBadgeText({text: '' + text});
    }
    if (color !== null) {
        chrome.browserAction.setBadgeBackgroundColor({color: color});
    }
    if (tooltip !== null) {
        chrome.browserAction.setTitle({title: '' + tooltip});
    }
}

function copyCookies(fromDomain, toDomain, cookieNames, successCallback) {
    chrome.cookies.getAll({domain: fromDomain}, cookies => {
        console.log('Received', cookies.length, 'cookies from', fromDomain);
        const filteredCookies = cookies.filter(cookie => cookieNames.includes(cookie.name));
        filteredCookies.forEach(cookie => setCookies(cookie, toDomain));
        successCallback(filteredCookies.length);
    });
}

function setCookies(cookie, domain) {
    console.log('Set cookie:', cookie.name, '=', cookie.value);
    chrome.cookies.set({
        url: 'http://' + domain,
        domain: domain,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
    });
}
