# Derver-TS

Tiny Development Server for your web-applications with live-reload and watchers.

> This is a fork of <https://github.com/AlexxNB/derver>  
> For production, you may prefer alternatives like [vite](https://vitejs.dev/), [webpack](https://webpack.js.org/configuration/dev-server/#root) or [esbuild](https://esbuild.github.io/api/#serve)

<p align="center">
  <img src="https://raw.githubusercontent.com/YieldRay/derver-ts/main/demo.gif">
</p>

## Features

-   Very tiny (~8kb)
-   Live-reload
-   Watch directories with callback
-   CLI or JS API
-   Supports Gzip or Brotli compression
-   Cache control
-   Supports SPA mode

## CLI Usage

```sh
derver [parameters] [serve_directory]
```

You may use `npx derver-ts` instantly or install globally  
by `npm install -g derver-ts` and then use command `derver`.

To serve and watching current directory just run:

```sh
derver
```

Server will run on [http://localhost:7000]() and site will be reloaded each time you change the file in the served directory.

By default server is running on `localhost` and nobody can access on the website from the network.  
Bind server on the `0.0.0.0` interface to allow network connections:

```sh
derver --host=0.0.0.0 public
```

In this example, `public` is a directory where are files for serving.  
By default it is current directory.

### List of possible parameters

#### `--host`

Interface, where bind the server.  
Use `0.0.0.0` inside Docker container or when need network connections to your site.  
_Default: localhost_
_Example: --host=localhost_

#### `--port`

Port, where bind the server.  
_Default: 7000_
_Example: --port=8080_

#### `--index`

Name of the root file of web directory.  
Derver will lookup this file when no file specified in the requested URL.  
_Default: index.html_
_Example: --index=index.htm_

#### `--watch`

Specify the directories for watching files changes.  
Each time when files modified in these directories, website will be reloaded.  
You may use this parameter multiple times to set more than one directory for watching.  
_Default: watch the served directory_
_Example: --watch=dist/public --watch=src_

#### `--no-watch`

Add this parameter when you want to disable any watching and live-reloading.  
_Example: --no-watch_

#### `--compress`

Will return files compressed by gzip or brotli, if client supports it.  
_Example: --compress_

#### `--cache`

Add `Cache-control` header to the response with `max-age` equal `31536000` (~1 year).  
You can specify number of seconds.  
_Example: --cache_
_Example: --cache=3600_

#### `--scroll`

Restore scroll position on every reload.  
Number value is equal timeout before scroll restoration.  
_Example: --scroll_
_Example: --scroll=100_

#### `--spa`

Enables SPA (Single-Page Application) mode.  
All requested pages will be respond with index page in the app root, which is specified in `--index` parameter.  
_Example: --spa_

#### `--production`

Run server in production mode(really not, use at own risk).  
It enables `--cache`, `--compress` and `--no-watch` parameters.  
Also host will set on `0.0.0.0` to handle connections from the network.  
_Example: --production_

## Javascript API

You may use Derver in the your scripts to get more power.

Install Derver as local dependency:

```
npm install derver
```

Then use `derver` function from the `derver` package to start the server.

```js
import { derver } from 'derver'

derver()
```

By default, server will be started on [http://localhost:7000]() and serve `public` directory in your work dir.

### Configuration

You may set configuration object as a parameter of the `derver` function.  
Below you find all possible options:

#### `dir` _string_|_boolean_

Directory which contains files for serving.  
If nothing set in `watch` option, it will be watching for changes also.  
When it set to `false` - no files would be serving, only middlewares will work.

_Default: public_

_Example: dir: 'public'_
_Example: dir: false_

---

#### `host` _string_

Interface, where bind the server.  
Use `0.0.0.0` inside docker or when need network connections to your site.

_Default: localhost_

_Example: host: 'localhost'_

---

#### `port` _number_

Port, where bind the server.

_Default: 7000_

_Example: port: 8080_

---

#### `index` _string_

Name of the root file of web directory.  
Derver will lookup this file when no file specified in the requested URL.

_Default: index.html_

_Example: index: 'index.htm'_

---

#### `compress` _boolean_

Will return files compressed by gzip or brotli, if client supports it.

_Default: false_

_Example: compress: true_

---

#### `cache` _boolean_|_number_

Add `Cache-control` header to the response with `max-age` equal `31536000` (~1 year).  
You can specify number of seconds.

_Default: false_

_Example: cache: true_

_Example: cache: 3600_

---

#### `spa` _boolean_

Enables SPA (Single-Page Application) mode.  
All requested pages will be respond by index page in the application root, which is specified in `index` option.

_Default: false_

_Example: spa: true_

---

#### `watch` _string_|_string[]_

Specify the directories for watching file changes.  
Each time when files modified in these directories, website will be reloaded and `onWatch` callback will be run.  
By default will be watched directory defined in `dir` option.

_Default: null_

_Example: watch: ['dist/public','src']_

---

#### `remote` _boolean_|_string_

Enables remote control listener. See [Remote control](#remote-control)

_Default: false_

_Example: remote: true_

_Example: remote: "my_dev_server"_

---

#### `preserveScroll` _boolean_|_number_

Restore scroll position on every reload.  
Number value is equal timeout before scroll restoration.

_Default: false_

_Example: preserveScroll: true_

_Example: preserveScroll: 100_

---

#### `banner` _boolean_

Show or not the banner in console when server starts.

_Default: true_

_Example: banner: false_

---

#### `log` _boolean_

Show or not file requests in console.

_Default: true_

_Example: log: false_

---

#### `onWatch` _function_

This function will be called when any file changes in watched directories.

_Default: null_

_Example: `onWatch: (liveReload, watchItem) => { if(watchItem === 'src') liveReload.prevent() })`_

---

### `onWatch` - callback arguments

_Callback signature: `(liveReload, watchItem, filename, eventName)`_

#### `liveReload`

It is object with following methods:

-   `livereload.prevent()` - Will stop scheduled live-reload action for this watch event.
-   `livereload.reload()` - Run each time you want to reload page in the browser.
-   `livereload.console(message)` - Send a `message` to the browser console.
-   `livereload.error(message,[header])` - Show error modal on client.

---

#### `watchItem`

It is a string with directory name where were fired file change event.  
It is same string as you specified in `watch` option (or in `dir` option, if `watch` not set).

---

#### `fileName`

Full path of changed file (unstable)

---

#### `eventName`

What exactly happened with modified file.

## Using Middlewares

You may use any common middleware (like Express middlewares) to add additional functionality for you server.  
`derver()` function returns the object with methods:

-   `sub` - run callback to register middlewares for specified subpath
-   `use` - run middleware for all HTTP methods
-   `get` - run middleware for GET method only
-   `post` - run middleware for POST method only
-   ...actually you can write any HTTP method here

```js
derver()
    .use(middleware1)
    .get('/api', middleware2)
    .put('/clear', middleware3, middleware4)
```

### Pattern

If first argument for these methods is a pattern of the URL, middleware will run only if request's URL is matched with its path.

The pattern may looks like `/foo` of `/foo/bar`. If no pattern provided, middleware will run on each request.

Pattern also may have a parameters `/user/:name` and when URL will be `/user/bob` or `/user/alex` you can get the value(alex or bob) from `request.params.name` property.

```js
derver().use('/user/:name', middleware)
```

### Writing middleware function

The middleware functions gets three arguments - common Node's `request`, `response` objects and `next` function, which will run next middleware.  
If your middleware doesn't response on request, you must run `next()` or request never will be ended.

Lets see an example for client and API middleware:

```js
function myLogMiddleware(req, resp, next) {
    console.log('Current URL is: ' + req.url)
    next()
}

function myHelloMiddleware(req, resp) {
    resp.send('Hello, ' + req.params.name)
}

derver().use(myLogMiddleware).get('/hello/:name', myHelloMiddleware)
```

### Additional data from incoming request extension

The `request` argument is Node's [http.IncomingMessage object](https://nodejs.org/api/http.html#http_class_http_incomingmessage). But it is expanded with few useful data:

-   `URL` - the request url parsed to WHATWG URL
-   `search` - query params as a string
-   `query` - query params as an object

### Send JSON object in response

Method `response.send(message)` will send content of message with status code 200.  
If `message` is a simple object, Derver will automatically stringify it and send to client with `Content-type: application/json` header.

### Nested middlewares

In case you need to run middlewares which are situated under specified sub path use `.sub()` method.

```js
derver().sub('/api', (app) => {
    // will run on  every request starting with '/api/...'
    app.use(myLogMiddleware)

    // will run when URL will be '/api/hello/bob'
    app.get('/hello/bob', myHelloMiddleware)

    app.sub('/users', (app) => {
        // will run when URL will be '/api/users/add'
        app.post('/add', myUserAddMiddleware)
    })
})
```

## Remote control

There is a way to perform some actions in currently opened browser windows.  
For example you want to reload page from external script.

```js
import { createRemote } from 'derver'

// Create remote object with parameters of running server
const remote = createRemote({ host: 'localhost', port: 7000 }) // there are defaults, may be dropped

// Also you can call `createRemote('my_dev_server)` with server ID specified in remote option.

// Reload page in all opened browser windows
remote.reload()

// Send some text in the browser console
remote.console('Hello!')

// Show modal with error message
remote.error('Error happened! Fix it as soon as possible!', 'Error header')
```

_Note: don't forget to enable `remote` option in Derver's configuration_

## How live-reload works

When you changes file in the watching directory, server will send command to the client side to reload current page.  
It is must-have feature when you developing web-application and want to see changes immediately.

Livereload made with [Server Sent Events API](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).  
It is perfect feature for one-way communication server with client based only on http protocol.  
It is why Derver is so tiny, no need to implement websocket communication as others known servers do.

Some JavaScript code for livereload will be added before `</body>` element inside each requested `html` file.
