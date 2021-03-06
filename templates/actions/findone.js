/**
 * findone
 * 
 * returns a function with access to an interruption context
 * 
 * @description :: Server-side logic for a generic crud controller findone action that can be used to represent all models
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const actionUtil = require('./../util/actionUtil');

module.exports = function(interrupts) {
    return function(req, res) {
        const Model = actionUtil.parseModel(req);
        const pk = actionUtil.requirePk(req);
        const query = Model.findOne(pk);
        // Look up the association configuration and determine how to populate the query
        // @todo support request driven selection of includes/populate
        const associations = actionUtil.getAssociationConfiguration(Model, 'detail');
        async.parallel(
            {
                matchingRecord: done => {
                    actionUtil.populateRecords(query, associations).where(actionUtil.parseCriteria(req)).exec(done);
                },
                associated: done => {
                    actionUtil.populateIndexes(Model, pk, associations, done);
                }
            },
            (err, results) => {
                if (err) return actionUtil.negotiate(res, err, actionUtil.parseLocals(req));
                const { matchingRecord, associated } = results;
                if (!matchingRecord)
                    return res.notFound('No record found with the specified ' + Model.primaryKey + '.');
                if (sails.hooks.pubsub && req.isSocket) {
                    Model.subscribe(req, [matchingRecord[Model.primaryKey]]);
                    actionUtil.subscribeDeep(req, matchingRecord);
                }
                interrupts.findone.call(
                    this,
                    req,
                    res,
                    () => {
                        res.ok(
                            Ember.buildResponse(Model, matchingRecord, associations, associated),
                            actionUtil.parseLocals(req)
                        );
                    },
                    Model,
                    matchingRecord
                );
            }
        );
    };
};
