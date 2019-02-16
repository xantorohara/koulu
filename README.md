# Koulu - Google Chrome cookie tracker extension

## Config

Extension can be configured via the _config.js_ file.
You need to set some configuration variables here.

Sample config contains these lines:
```js
const CFG_COPY_TO_DOMAIN = 'localhost';
const CFG_TRACKED_COOKIES = ['JSESSIONID', 'XSRF-TOKEN'];
const CFG_TRACKED_DOMAINS = [
    'dev.somedomain.com',
    'test.somedomain.com',
    'pre.somedomain.com',
    'somedomain.com'
];

const CFG_TRACKED_PING_URL = 'https://${DOMAIN}/api/ping';
```

- `CFG_COPY_TO_DOMAIN` - The domain to write cookies to.
- `CFG_TRACKED_DOMAINS` - List of domains to read cookies from.
- `CFG_TRACKED_COOKIES` - List of cookie names to copy.
- `CFG_TRACKED_PING_URL` - Sometimes it is necessary to ping the server from where you are reading cookies 
(to prolong user session, to healthcheck, or just to refresh cookies). You can specify the URL in tis variable.
Set it to `null` if you don't need to ping.


## Permissions

In the _manifest.json_ specify URL patterns for all domains you are going to work with.
Replace "somedomain.com" and "localhost" with your actual domains in the `permissions` section.
These permissions are necessary to allow the extension to read and write cookies. 

```json
{
  "permissions": [
    "*://*.somedomain.com/",
    "*://localhost/"
  ]
}
``` 