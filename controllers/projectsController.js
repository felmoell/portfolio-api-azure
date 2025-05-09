const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
var ProjectModel = require('../models/gitHubProject')
myCustomLabels = {
    totalDocs: 'itemCount',
    docs: 'repos',
    limit: 'limit',
    page: 'currentPage',
    nextPage: 'next',
    prevPage: 'prev',
    totalPages: 'pageCount',
    pagingCounter: 'slNo',
    meta: 'paginator',
};


router.get('/allRepos', function (req, res, next) {
    ProjectModel.find((err, projects) => {
        if (err) {
            res.status(400).send({
                message: "Error",
                err: err
            });
            return;
        } else {
            res.status(200).send({
                message: "Success",
                projects: projects,
                length: projects.length
            });
            return;
        }
    });

});

router.post('/allRepos/search', function (req, res, next) {
    let query = {

    };

    const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        customLabels: this.myCustomLabels,
        sort: ({ created_at: req.query.sortDirection })
    };

    if (req.query.name) {
        query.name = { $regex: new RegExp(req.query.name), $options: "i" }
    }

    ProjectModel.paginate(query, options, function (err, result) {
        if (err) {
            res.status(400).send({
                message: "Error",
                err: err
            });
            return;
        } else {
            res.status(200).send({
                message: "Success",
                result: result
            });
            return;
        }
    });
});


module.exports = router;