const COPY_TO_DOMAIN = 'localhost';
const TRACKED_COOKIES = ['JSESSIONID', 'XSRF-TOKEN'];
const TRACKED_DOMAINS = [
    'dev.somedomain.com',
    'test.somedomain.com',
    'pre.somedomain.com',
    'somedomain.com',
];

chrome.runtime.onInstalled.addListener(() => {
    createAlarm();
    createMenu();
    chrome.storage.local.set({trackingEnabled: false, trackedDomain: TRACKED_DOMAINS[0]});
});

function createAlarm() {
    chrome.alarms.create('KouluTick', {when: 0, periodInMinutes: 1});
    chrome.alarms.onAlarm.addListener(syncCookies);
}

function createMenu() {
    chrome.contextMenus.create({
        id: 'domains',
        title: 'Tracked domain',
        contexts: ['browser_action']
    });

    TRACKED_DOMAINS.forEach(domain => {
        chrome.contextMenus.create({
            id: 'domain:' + domain,
            type: 'radio',
            title: domain,
            parentId: 'domains',
            contexts: ['browser_action']
        });
    });

    chrome.contextMenus.create({
        id: 'copy_to',
        type: 'checkbox',
        title: 'Copy to domain: ' + COPY_TO_DOMAIN,
        contexts: ['browser_action']
    });

    chrome.contextMenus.onClicked.addListener((info) => {
        console.log('Context menu clicked:', info.menuItemId);
        if (info.menuItemId === 'copy_to') {
            chrome.storage.local.set({trackingEnabled: info.checked});
        } else if (info.menuItemId.startsWith('domain:')) {
            chrome.storage.local.set({trackedDomain: info.menuItemId.substring('domain:'.length)});
        }
        syncCookies();
    });
}

function syncCookies() {
    chrome.storage.local.get(['trackingEnabled', 'trackedDomain'], function (result) {
        if (result.trackingEnabled) {
            copyCookies(result.trackedDomain, COPY_TO_DOMAIN, TRACKED_COOKIES);
            chrome.browserAction.setBadgeText({text: 'On'});
            chrome.browserAction.setTitle({
                title: 'Last sync with\n' + result.trackedDomain + '\nat ' + new Date().toLocaleString()
            });
        } else {
            console.log('Tracking disabled');
            chrome.browserAction.setBadgeText({text: ''});
        }
    });
}

function copyCookies(fromDomain, toDomain, cookieNames) {
    chrome.cookies.getAll({domain: fromDomain}, cookies => {
        console.log('Received', cookies.length, 'cookies from', fromDomain);
        cookies.filter(cookie => cookieNames.includes(cookie.name))
            .forEach(cookie => setCookies(cookie, toDomain));
    });
}

function setCookies(cookie, toDomain) {
    console.log('Set cookie:', cookie.name, '=', cookie.value);
    chrome.cookies.set({
        url: 'http://' + toDomain,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
    });
}
