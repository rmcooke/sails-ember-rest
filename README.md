Sails-Ember-Rest
======================

# VERSIONS

The following versions of this library are designed for the listed versions of sails.js:

* Version 0.x.x - Sails.js ^0.11.x
* Version 1.x.x - Sails.js ^1.x.x

- The Version 1.x.x series of this library is under active testing and development. If you find a bug, please open an issue or make a pull request!

- Version 1.0.6 and above of sails-ember-rest should be fully Sails 1.0.0 compliant.

# Summary

Ember Data REST-Adapter compatible controllers, policies, services and generators for Sails v0.12+

THIS PACKAGE DERIVES THE MAJORITY OF ITS ORIGINAL IDEAS AND CODE FROM THE FOLLOWING LIBRARY: [Sails-Generate-Ember-Blueprints](https://github.com/mphasize/sails-generate-ember-blueprints)

[Sails](http://www.sailsjs.org/) 1.0+ is moving away from blueprints that override the default sails CRUD blueprints.

To continue supporting the Ember-Data REST Adapter with sails 1.0+ applications, application controllers must be created and extended in an object-oriented way.

Sails-Ember-Rest is a port of the popular [Sails-Generate-Ember-Blueprints](https://github.com/mphasize/sails-generate-ember-blueprints) library that aims to bring this REST/envelope data convention up to the sails 1.0+ standard, while adding a few new features along the way.

If you're looking for something that makes Ember work with the standard Sails API, take a look at [ember-data-sails-adapter](https://github.com/bmac/ember-data-sails-adapter) and the alternatives discussed there.

# Whats Included

This package ships as a standard node module that will export all of its assets if a user simply uses `require('sails-ember-rest');`.

From this require statement the following classes/objects will be available:

## controller

The controller class is the fundamental building block of sails-ember-rest. It exports a class constructor that will handle all basic crud operations for any model type by default. The default actions handled by the controller class are as follows:

**find**

**findone**

**populate**

**create**

**update**

**destroy**

**hydrate**

Hydrate is a special, non-standard action that is provided for all of your controller instances by default. If a call is made to resource/:id/hydrate (you will have to bind this in your config.routes file) The JSON response will conform to the ember embedded-records mixin expectations, and a record with all first-order relationships populated and directly embedded will be returned.  

The hydrate action is included by default, but you don't have to use it, and most of the time you wont have to! (But it can be useful as a support mechanism for non-ember-data clients like React components!)

To create a new controller instance without using the built-in generators, you can simply make a controller file as follows: 
```javascript
import { controller } from 'sails-ember-rest';

export default new controller();
```

It's that simple!

The controller constructor functions similarly to ember-objects, in that it can recieve an extension object as input to the constructor itself. An example would be:
```javascript
import { controller } from 'sails-ember-rest';

export default new controller({
    mySpecialAction(req, res){
        res.status(200);
        res.json({
            foo: 'bar'
        });
    }
});
```
This would produce a controller with all of the default methods specified above, but with the additional method `mySpecialAction`

In the controller constructor, you can also override default controller methods, but there is currently no way to invoke the original default action if you override it in the constructor.

The following is possible:
```javascript
import { controller } from 'sails-ember-rest';

export default new controller({
    create(req, res){
        //...some special creation code
        res.status(201);
        res.json({
            foo: 'bar'
        });
    }
});
```
This would return a controller that has a custom create action, but all other actions remain the default sails-ember-rest actions.

Sails-ember-rest controllers also offer a powerful new feature that does not exist anywhere else in the sails ecosystem: `interrupts`.

At a high level, an interrupt can be though of as a policy, or function that you can execute *after* the action itself has occured but *before* a response is sent to the client. Whatever function you register as an interrupt will also be handed all of the important data generated in the action itself as it's input parameters. The best way to demonstrate the utility of the interruptor paradigm is through example:

```javascript
import { controller } from 'sails-ember-rest';

const myController = new controller();

myController.setServiceInterrupt('create', function(req, res, next, Model, record){
    //req, res, next - are all the express equivalent functions for a middleware. MAKE SURE YOU CALL NEXT WHEN YOU ARE DONE!
    //Model - is the parsed model class that represents the base resource used in this action
    //record - is the new record instance that has been successfully persisted to the database as this is a create action
    Logger.create(Model, record, (err) => {
        if(err) {
            return res.serverError(err);
        }
        Session.addRecordToMyManagedObjects(req.session, Model.identity, record, next);
    });
});

//If you wanted to gain access to the interruption object, for some low-level use in your own actions, you can call the following function:
//myController.getInterrupts();
//^ This will return all possible interrupts synchronously in a hash object

export default myController;
```
The above example could automatically create "tracking" objects through some kind of Logger service that would help maintain history about some important source object, and it could also add any new created objects of this type directly into a user's existing session profile (through some service called Session) to enable them to access/edit it for the remainder of their session.  What is really powerful about this paradigm is that it enables you to bolt on *post-action* code to any sails-ember-rest action, without altering the battle-tested action itself. An interrupt is like a policy that can be run after instead of before all of the asynchronous database interaction, but is more powerful than model lifecycle hooks because it will also have access to the request and response objects that are critical to the context of the logic that is occurring.

The following interrupts are available for your bolt-on code by default:

**find**

**findone**

**populate**

**create**

**beforeUpdate**

**afterUpdate**

**destroy**

**hydrate**

In each case, the `record` parameter will be the record or records that were found/created/destroyed.

In the case of the `beforeUpdate` interrupt, the `record` parameter will be an object containing all the values the user sent to apply against the target record.

In the case of the `afterUpdate` interrupt, the `record` parameter will be an object with a `before` and `after` state of the updated record.

```javascript
//The object representation of the "record" parameter for the update interrupt:
{
    before: oldRecordInstance,
    after: newRecordInstance
}
```

You don't have to use interrupts in your code, but as the demands on your server grow you may find them to be incredibly useful for making your code more DRY and less error-prone, as well as providing a whole new lifecycle type to the sails ecosystem.

## service

The service exported by sails-ember-rest is typically used internally by various actions on the Ember REST controller. The available methods within the service are:

```javascript
countRelationship(model, association, pk)
```
```javascript
linkAssociations(model, records)
```
```javascript
finalizeSideloads(json, documentIdentifier)
```
```javascript
buildResponse(model, records, associations, associatedRecords)
```

You should not typically need to interact with any of these methods, but if you want to override some action on the REST controller, and want to maintain compliance with the Ember RESTAdapter, you will probably need to use these methods to assemble your response data properly.

For usage examples, reference the action you are overriding under templates/actions

## policies

The policies exported by sails-ember-rest are designed to allow you to actually layer a 'virtual' ember-rest controller on top of any other controller you may be using by default.

If an incoming request has a header value of {'ember': true}, then the virtual controller will execute it's own action handler instead of the controller contained within your sails application.

A good use case can be described as follows:

If in your application you are using some custom controller that normally performs backend rendering for an action, but you want Ember clients to be able to request ember-style JSON from the same URL, then the sails-ember-rest policies are the solution to your problem.

To layer the virtual controller on top of the normal controller, just edit your config/policies.js file to look something like:

```javascript
module.exports.policies = {
    CustomController: {
        find: ['somePolicyA', 'somePolicyB', 'emberFind']
    }
};
```

Note that you should add the ember virtual controller policies as the *last* policy for any action that you want to add an override fork to. This will allow all other policies to execute appropriately before the action is diverted to an Ember REST JSON serializer action.

A client (or some other policy) can then force the response to the Ember controller by just adding a request header field indicating 'ember': true.

The available policies that can be applied to your policy config:

**emberCreate**

**emberDestroy**

**emberFind**

**emberFindOne**

**emberHydrate**

**emberPopulate**

**emberSetHeader**

**emberUpdate**

Note that **emberSetHeader** is just a drop-in policy that will divert any action directly to the Ember controller by default as long as it is in the policy chain before the virtual controller policy.

## responses

**created**

Adds a response with a status of 201, as expected by Ember after a new record is created. This response is utilized by the `create` action in the Ember controller.

## util

(TO BE DOCUMENTED, WORK COMPLETED)

If you are using es6, you can import these elements and inspect them using the following code:

```javascript
import { controller, service, policies, responses, util } from 'sails-ember-rest';
```

* controller and policies subelements are class constructors
* service, response, and util are singleton objects / functions

sails-ember-rest will also install 3 sails generators to make scaffolding out your application easier:

`sails generate ember-rest controller <name of controller>`

`sails generate ember-rest responses`

and

`sails generate ember-rest policies`

The controller generator creates a singleton instance of the ember-rest controller, and custom actions can be added by simply binding new properties to the singleton, or passing an instance extension object into the class constructor.  Future work will include improving extension functionality.

The response generator adds the required "create" response if it does not yet exist.

The policy generator creates a set of helper policies that can allow a sails application to run "virtual" controllers on top of specific actions when conditions needed.  This allows an application to have a set of default base application controllers (like graphQL controllers, or JSON API controllers), but still run an Ember REST compatible controller when policies determine this is what a client needs.  Think of it as a way to layer several controllers over an identical route, giving your server the ability to serve several frontend client adapters at the same URL.

# New Features

* Link Prefixes for linked data (Needed if you mount your sails.js server at a sub-route of your base domain)
* Virtual Controller Policies
* Callback based Controller interrupts for performing more complicated server lifecycle actions that may require access to the `req` and `res` objects. This can be viewed as model lifecycle hooks on steriods.
* Cleaner import statements in generated controllers, policies and services.

# Getting started

* Install the library and generators into your (new) Sails project `npm install sails-ember-rest`
* Add this generator to your .sailsrc file:
```javascript
{
  "generators": {
    "modules": {
        "ember-rest": "sails-ember-rest"
    }
  }
}
```
* Run the generator: 
* `sails generate ember-rest controller <name>`
* `sails generate ember-rest policies`
* Go through ALL configuration steps below, and then...
* Generate some models for your controllers, e.g. `sails generate model user`
* Start your app with `sails lift`

Now you should be up and running and your Ember Data app should be able to talk to your Sails backend.

### Configuration

* Configure sails to use **pluralized** blueprint routes.
* Add a default limit to the blueprint config (Sails ^1.0)
* You can use parseBlueprintOptions instead of defaultLimit in Sails ^1.0

In `myproject/config/blueprints.js` set `pluralize: true`

```javascript
module.exports.blueprints = {
    // ...
    pluralize: true,
    defaultLimit: 100
};
```

* Add a configuration option `associations: { list: "link", detail: "record" }`
 to `myproject/config/models.js`. This will determine the default behaviour.
* Also add fetch on create/update/delete to this config (Sails ^1.0)

```javascript
module.exports.models = {
    // ...
    associations: {
        list: "link",
        detail: "record"
    },
    fetchRecordsOnUpdate: true,
    fetchRecordsOnDestroy: true,
    fetchRecordsOnCreate: true,
    fetchRecordsOnCreateEach: true
};
 ```

* Add a configuration option `validations: { ignoreProperties: [ 'includeIn' ] }`
to `myproject/config/models.js`. This tells Sails to ignore our individual configuration on a model's attributes.

```javascript
module.exports.models = {
    // ...
    validations: {
        ignoreProperties: ['includeIn']
    }
};
```

* (Optional) Setup individual presentation on a by-model by-attribute basis by adding `includeIn: { list: "option", detail: "option"}` where option is one of `link`, `index`, `record`.

```javascript
attributes: {
    name : {
        type: "string"
    },
    posts: {
        collection: "post",
        via: "user",
        includeIn: {
            list: "record",
            detail: "record"
        }
    }
}
```

**Presentation options:**  
The `link` setting will generate jsonapi.org URL style `links` properties on the records, which Ember Data can consume and load lazily.

The `index` setting will generate an array of ID references for Ember Data, so be loaded as necessary.

The `record` setting will sideload the complete record.


### Troubleshooting

If the generator exits with
`Something else already exists at ... ` you can try running it with the `--force` option (at your own risk!)

Some records from relations/associations are missing? Sails has a default limit of 30 records per relation when populating. Try increasing the limit as a work-around until a pagination solution exists.

### Ember RESTAdapter

If you're using [Ember CLI](//ember-cli.com), you only need to setup the RESTAdapter as the application adapter.
( You can also use it for specific models only. )

In your Ember project: app/adapters/application.js

```javascript
export default DS.RESTAdapter.extend({
    coalesceFindRequests: true,   // these blueprints support coalescing (reduces the amount of requests)
    namespace: '/',               // same as API prefix in Sails config
    host: 'http://localhost:1337' // Sails server
});
```

* Please note that in Sails 1.0, record updates should be made through PATCH requests, not PUT requests. You can modify the http verb used by the Ember RESTAdapter used during updates to avoid getting deprecation warnings in the Sails 1.0 console.


### Create with current user

If you have logged in users and you always want to associate newly created records with the current user, take a look at the Policy described here: [beforeCreate policy](https://gist.github.com/mphasize/a69d86b9722ea464deca)

### More access control

If you need more control over inclusion and exclusion of records in the blueprints or you want to do other funny things, quite often a Policy can help you achieve this without a need for modifying the blueprints. Here's an example of a Policy that adds *beforeFind*, *beforeDestroy*, etc... hooks to a model: [beforeBlueprint policy](https://gist.github.com/mphasize/e9ed62f9d139d2152445)


### Accessing the REST interface without Ember Data

If you want to access the REST routes with your own client or a tool like [Postman](http://www.getpostman.com/) you may have to set the correct HTTP headers:

    Accept: application/json
    Content-Type: application/json

Furthermore Ember Data expects the JSON responses from the API to follow certain conventions.
Some of these conventions are mentioned in the [Ember model guide](http://emberjs.com/guides/models/connecting-to-an-http-server/).
However, there is a more [complete list of expected responses](https://stackoverflow.com/questions/14922623/what-is-the-complete-list-of-expected-json-responses-for-ds-restadapter) on Stackoverflow.

As a **quick example**, if you create a `post` model under the namespace `api/v1` you can access the model under `localhost:1337/api/v1/posts` and to create a new Record send a POST request using the following JSON:

```javascript
{
  "post": {
    "title": "A new post"
    "content": "This is the wonderful content of this new post."
  }
}
```


# Todo

### Refactor into ES6

- Because it's 2017!

### Generator: Improve installation

- setup configuration while running the generator

### Blueprints: Support pagination metadata

- the controller supports pagination meta data on direct requests. However, sideloaded records from relationships are currently not paginated.

### Testing: Make all the things testable

I am still working out how to make this repo more maintainable and testable.

# Scope

The controllers and policies in this repository should provide a starting point for a Sails backend that works with an Ember frontend app. However, there are a lot of things missing that would be needed for a full blown app (like authentication and access control) but these things don't really fit into the scope of this sails add-on.

# Sane Stack

@artificialio used these an earlier version of this code (sails-generate-ember-blueprints) to create the first version of their Docker-based [Sane Stack](http://sanestack.com/).


# Questions, Comments, Concerns?

Open an issue! I'd love to get some help maintaining this library.

- Michael Conaway (2017)
