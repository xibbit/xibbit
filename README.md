"One ring to rule them all ..." -- J.R.R. Tolkien

# xibbit
Meet xibbit.

A small but stellar framework for startups, solo developers and new developers, especially teenagers and new college grads, to quickly build websites (a.k.a. webapps) and iOS and Android apps.

(The silver frog mascot's name is Xorat.)

## motivation
I wanted to start a tech startup with my teenage son but existing frameworks locked us into particular languages and were too hard to learn.  So I built xibbit!

## motivation for experienced developers
You need xibbit (or something like it) so you can finally:

1. **Be "done" with the language wars.** Go, Node.js, PHP and all the other languages have *if* statements and *for* loops: it's the same logic but different syntax.  Stop getting locked in.
1. **Be "done" with REST.** REST is not bi-directional.  Stop designing APIs with paths, headers, query parameters and data formats and writing marshalling/unmarshalling code into/out of REST.  Use JSON events.
1. **Be "done" with scaffolding.** A framework of low-level tools is not enough.  Out of the box, frameworks should demo how to sign up, sign in, read and write private user data and sign out.  Code your unique features on day 1; be done with frameworks that force you to write weeks of code before the simplest thing works.

xibbit is also great for freelance developers and offshore teams.

## what it is (the technobabble)

xibbit is both a client-side framework (supports **React**, **Flutter**, **AngularJS**, **Inferno**, **Marko**, **Mithril**) and a server-side framework (supports **Go**, **Node**, **PHP**).  Developers can choose any client/server combination and, if they change their mind later, they can port their existing code easily to a new language.

xibdb is an optional database access library (supports **MySQL**) for xibbit that provides an easy-to-use, powerful and portable database access.

## installation

1. Download, install and run MAMP (or AMPPS or `sudo apt-get install lamp-server^`) on Windows, Mac or Linux to have a [LAMP stack](https://en.wikipedia.org/wiki/LAMP_(software_bundle)) running locally
1. Download and install Node.js to have `node` and `npm` commands available locally
1. Download and install `git` command to have it available locally
1. Clone xibbit from Github (using `git clone https://github.com/xibbit/xibbit.git`) to the "www" folder in your LAMP stack (e.g. C:\MAMP\htdocs or /Applications/MAMP/htdocs or /var/www/html)
1. Run `mysql -u root -p` MySQL client command and log in with the "mysql" default password
1. Type `create database publicfigure;` and press the Enter key to execute the MySQL client command
1. Use a browser like Google Chrome to go to http://localhost/xibbit/server/php/misc/install.php and let it generate the tables and default data for the "publicfigure" database.  If this isn't working, you can consult this [LAMP stack installation troubleshooting guide](LAMP.md).
1. Go to "xibbit/client/angularjs" folder
1. Run `npm install` and let it install AngularJS libraries in "xibbit/client/angularjs/app/lib"
1. Copy the "xibbit/client/angularjs/app/socket.io" folder and its contents to the "www" folder in your LAMP stack (e.g. C:\MAMP\htdocs or /Applications/MAMP/htdocs or /var/www/html) -- a temporary fix to be removed in a future release
1. Then, use the browser to go to http://localhost/xibbit/server/php/index.html

The webapp is running successfully if you see:

1. "AngularJS seed app: v0.1" at the bottom of the page
1. "xibbit is working" in green text at the bottom of the page (only in newer versions)
1. After a few seconds, you should see something like "admin jumps up and down" in blue text
1. You can sign in, change the profile and sign out for "admin@xibbit.github.io" and "user1@xibbit.github.io" users using the "passw0rd" password
1. You can create new users at the "Sign up" page, filling out the form and then sign in with that data

This runs the AngularJS client (in www/xibbit/client/angularjs) with the PHP server (in www/xibbit/server/php).  Other clients, such as React, can be used with other servers, such as Node.js, using the appropriate source code in www/xibbit/client and www/xibbit/server subfolders.

AngularJS was chosen as the default client because it is easiest for the new developers.  Unlike the more modern and professional React, AngularJS is regular HTML and CSS, like it is generally taught, decorated with "special" AngularJS attributes.  If you prefer React (or another supported client framework), you can switch to that after getting xibbit running using AngularJS.

PHP was chosen as the default server because it is the easiest to set up and the easiest for new developers.  If you prefer Node.js (or another supported server language/framework), you can switch to that after getting xibbit running using PHP.

## current status

xibbit is under active development.  Version 1.50 is the current version.

Version 1.50 is the initial version released into open source.  It is of alpha quality: suitable for development but you may need to fix additional minor bugs to bring it to production quality.

Version 1.0 was a proprietary implementation inside the MovieTrekker webapp.

# why other languages and frameworks suck

Every website or app starts with three thorny questions, plus a bonus question, that confuse the heck out of developers.  xibbit clearly answers these questions whereas competitors do not.

## (1) "What language should I use?"

Choosing a language, such as Node.js, plus a framework, such a Express, is painful.  If you choose wrong, you are stuck with it ... forever.

xibbit lets you start with one language and, if you change your mind later, it's possible to move to a different language.  This allows you to start your app simply by using PHP on a cheap PHP Cpanel hoster (e.g. GoDaddy) and, at a later time, port to Node.js or Golang, on a virtual machine (e.g. DigitalOcean).

## (2) "What's an architecture?"

An architecture is a strategy for "getting things done".

Other languages and frameworks provide tools and some toy apps but they do not provide a foundation for your app.  xibbit provides the Public Figure webapp or app which serves as a demonstration but also as a foundation, architecture and coding strategy.  By cloning and modifying the Public Figure webapp or app by adding new events to the "events" folder, you can create a well-organized and commercially viable webapp or app.

## (3) "How do I create accounts, sign in and sign out?"

By providing examples of how to sign up, sign in, sign out and show/change a user's own profile, Public Figure isn't just providing a toolbox of authentication or session management features; Public Figure is showing how to take that toolbox and create a fully functional webapp or app.  Public Figure shows the code to create accounts, sign in and sign out.

## (Bonus) "How do my users chat with each other?"

The "admin laughs out loud" and "user1 jumps up and down" spontaneous events demonstrate how the Public Figure server can send events to the client.  In most languages and frameworks, it is easy to send data to the server (e.g. REST) but unclear how to receive data without sending any.  It is crucial that chat messages can be sent to the server (easy in all languages and frameworks) and that chat messages on the server be sent to chat clients (unclear and difficult in most languages and frameworks; xibbit makes this easy).  With bi-directional communication (e.g. client to server and server to client), chat functionality is easy in xibbit.

# xibbit code

## JavaScript client sample code
```javascript
// update the profile
xibbitObject.send({
  type: 'update_profile',
  user: profile
}, function(event) {
  // i=success (info) message; e=error message
  console.log(event.i || event.e);
});
```

Send a JSON event to start the update and receive a reply JSON event from the server when done.

This looks very similar in React, AngularJS, Inferno, Marko and Mithril.  These are all client-side frameworks for creating webapps (dynamic websites).

## Flutter client sample code
```dart
// save the profile
xibbitObject.send({
  'type': 'update_profile',
  'user': profile,
}, (event) {
  // i=success (info) message; e=error message
  print(event['i'] || event['e']);
});
```

Not identical to JavaScript but very similar.  Flutter is used to create iOS and Android apps, not webapps.

## PHP server sample code
```php
$xibbitObject->on('update_profile', function($event, $vars) {
  $xibdbObject = $vars['xibdbObject'];

  asserte(isset($event['user']), 'missing:user');
  asserte(has_string_keys($event['user']), 'typeof:user');

  // get the current user
  $uid = $event['_session']['uid'];
  $me = $xibdbObject->readOneRow(array(
    'table'=>'users',
    'where'=>array(
      'uid'=>$uid
  )));
  // remove all uneditable fields
  $readonly = array(
    'id',
    'roles',
    'json',
    'n',
    'password'
  );
  foreach ($readonly as $key) {
    if (isset($event['user'][$key])) {
      unset($event['user'][$key]);
    }
  }
  // update the profile
  $xibdbObject->updateRow(array(
    'table'=>'users',
    'values'=>$event['user'],
    'where'=>array(
      'uid'=>$uid
  )));
  // info: profile updated
  $event['i'] = 'profile updated';
  return $event;
});
```

Simple but realistic code to receive a "update_profile" event on the PHP server and actually update the profile in the database.  It also shows what xibdb code (the optional database access library) looks like.

## Node (Node.js) server sample code
```javascript
xibbitObject.on('update_profile', (event, {xibdbObject}) =>
  async (resolve, reject) => { try {

  asserte(event.user, 'missing:user');
  asserte(has_string_keys(event.user), 'typeof:user');

  // get the current user
  const uid = event._session.uid;
  const me = await xibdbObject.readOneRow({
    table: 'users',
    where: {
      uid
  }});
  asserte(me !== null, 'current user not found');
  // remove all uneditable fields
  const readonly = [
    'id',
    'roles',
    'json',
    'n',
    'password'
  ];
  for (var k in readonly) {
    var key = readonly[k];
    if (event.user[key]) {
      delete event.user[key];
    }
  }
  // update the profile
  await xibdbObject.updateRow({
    table: 'users',
    values: event.user,
    where: {
      uid
  }});
  // info: profile updated
  event.i = 'profile updated';
  resolve(event);
} catch (e) { reject(e); } });
```

The Node.js version of the PHP code above that handles a "update_profile" event on the server.  You can almost compare Node.js and PHP line by line!

## Go (golang) server sample code
```golang
xibbitObject.On("update_profile", func(event map[string]interface{}, vars map[string]interface{}) map[string]interface{} {
  xibdbObject := vars["xibdbObject"].(*xibdb.XibDb)

  asserte.Asserte(func() bool { _, ok := event["user"]; return ok }, "missing:user")
  asserte.Asserte(func() bool { return array.HasStringKeys(event["user"].(map[string]interface{})) }, "typeof:user")

  // get the current user
  uid := event["_session"].(map[string]interface{})["uid"].(int)
  me, _ := xibdbObject.ReadOneRow(map[string]interface{}{
    "table": "users",
    "where": map[string]interface{}{
      "uid": uid,
    },
  })
  asserte.Asserte(func() bool { return me != nil }, "current user not found")
  // remove all uneditable fields
  readonly := [...]string{"id", "roles", "json", "n", "password"}
  for _, key := range readonly {
    if event["user"].(map[string]interface {})[key] != nil {
      delete(event["user"].(map[string]interface {}), "key")
    }
  }
  // update the profile
  xibdbObject.UpdateRow(map[string]interface{}{
    "table": "users",
    "values": event["user"],
    "where": map[string]interface{}{
      "uid": uid,
    },
  })
  // info: profile updated
  event["i"] = "profile updated"
  return event
})

```

Golang code sure is different than PHP and Node.js with all its curly braces but you still match it up with the PHP and Node.js versions without too much trouble.  (Assuming that you can make sense of Golang's weird map type and type casting syntax.)

# xibbit features

## events

xibbit uses events.  Events allow bi-directional communication (unlike REST): servers can send events to clients in nearly the same way that clients send events to servers.  REST is only good at sending events from clients to servers.

Servers can send events to clients similar to this:

```javascript
xibbitObject.send('notify_profile_changed', {
  user: profile
});
```

Clients can handle asynchronous events from servers with easy code like this:

```javascript
xibbitObject.on('notify_profile_changed', function(event) {
  console.log('profile changed', event);
});
```

Clients can send a request to the server and handle the server response similar to REST like this:

```javascript
xibbitObject.send({
  type: 'update_profile',
  user: profile
}, function(event) {
  // i=success (info) message; e=error message
  console.log(event.i || event.e);
});
```

Events are implemented using Socket.IO and can use either (long polling) REST or WebSockets.

Events make chat features and asynchronous UI updates easy.

## language portability
xibbit makes it reasonable and possible (though not necessarily easy) to port client code between React, Flutter, AngularJS, Inferno, Marko and Mithril and to port server server code between  Go (golang), Node and PHP.

Mix and match different client languages with different server languages.

Port xibbit user code almost line-by-line.  See similarity between code examples above.

## database
xibbit provides an optional database query builder called xibdb.  xibdb provides:

- a way to build safe SQL query strings from maps, arrays, strings, numbers, etc.
- simple JSON support on top of stock MySQL databases
- ordering and reordering features to treat database rows as arrays

## authentication
xibbit builds in industry strength, upgradeable/downgradeable password security.  Supports bcrypt and other hashing algorithms.

## authorization
xibbit provides asserts so you can easily enforce both data preconditions and enforce your own authorization using roles, permissions or whatever else you might invent.

## session management
xibbit provides session support so servers can read/write/add/remove per-user data on the server.

## Public Figure sample code
xibbit provides the Public Figure server, web client and Flutter app to demonstrate many xibbit features in all client and server languages (implementations).

Public Figure allows users to sign up, sign in, sign out, view their own mailing address, change their mailing address, receive random laugh and jump events and be notified when users, including themselves, sign in or sign out.

Public Figure is also a "starter" implementation so you can add, remove and modify code to implement your own features.

## url_config.js

The "url_config.js" file in all the client and server folders controls the client URLs, the server URLs and how the client communicates with the server.  It consists of:

**client_platform** only exists in Flutter app to distinguish between iOS (iPhone) and android client

**client_base** a URL (often empty meaning top-level URL) where the client code is located

**client_debug** turn on/off logging information for both client and server in the browser console

**client_transports** the Socket.IO communication protocol to use to connect the client and the server; "polling" is the easiest and safest protocol

  * **websocket** use Socket.IO websocket protocol (not available on PHP)
  * **polling** use Socket.IO long polling protocol
  * **short** not implemented; reserved for future development
  * **rest** not implemented; reserved for future development
  * **xio** use xibbit XIO short polling protocol (only available in PHP)

**server_platform** the server configuration to use; currently, this is the key to select in the **server_base** map

**server_host** only exists in Flutter app because apps do not have the client delivered from the server as webapps do

**server_base** a map of server platforms to absolute or relative URLs where the server APIs are located; the server API calls are prefixed with these URLs to successfully connect to the server

# final thoughts

## my hope
It is my hope that people of all ages and experiences can learn from xibbit and be empowered to either successfully carry out their own projects (rather than getting bogged down, frustrated and quitting) or more readily understand and contribute to open source projects (because xibbit gave them a basic understanding of one way that applications can work).

## startup advice
xibbit is designed for scrappy, bootstrapped tech startups, too.  [STARTUP.md](STARTUP.md) provides advice to solo developers who want to leverage xibbit to create startups.

## help xibbit!
I'd love to have somebody implement xibbit and xibdb for Python Django!  If you feel up to it, fork xibbit, create a /xibbit/servers/python/django folder and start coding!  See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## contact

For questions or suggestions, send me an e-mail at code_dh [at] svexpertise.com.
