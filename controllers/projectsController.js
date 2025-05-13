const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const axios = require('axios');

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

module.exports = function (authRateLimiter) {
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


    router.get('/allRepos/manualImport', authRateLimiter, function (req, res, next) {
        axios.get('https://api.github.com/users/felmoell/repos')
            .then(response => {
                const updatePromises = response.data.map(element => {
                    const filter = { id: element.id };
                    const update = {
                        id: element.id,
                        node_id: element.node_id,
                        name: element.name,
                        full_name: element.full_name,
                        private: element.private,
                        owner: {
                            login: element.owner.login,
                            id: element.owner.id,
                            node_id: element.owner.node_id,
                            avatar_url: element.owner.avatar_url,
                            gravatar_id: element.owner.gravatar_id,
                            url: element.owner.url,
                            html_url: element.owner.html_url,
                            followers_url: element.owner.followers_url,
                            following_url: element.owner.following_url,
                            gists_url: element.owner.gists_url,
                            starred_url: element.owner.starred_url,
                            subscriptions_url: element.owner.subscriptions_url,
                            organizations_url: element.owner.organizations_url,
                            repos_url: element.owner.repos_url,
                            events_url: element.owner.events_url, // corrected typo here
                            received_events_url: element.owner.received_events_url,
                            type: element.owner.type,
                            site_admin: element.owner.site_admin,
                        },
                        html_url: element.html_url,
                        description: element.description,
                        fork: element.fork,
                        url: element.url,
                        forks_url: element.forks_url,
                        keys_url: element.keys_url,
                        collaborators_url: element.collaborators_url,
                        teams_url: element.teams_url,
                        hooks_url: element.hooks_url,
                        issue_events_url: element.issue_events_url,
                        events_url: element.events_url,
                        assignees_url: element.assignees_url,
                        branches_url: element.branches_url,
                        tags_url: element.tags_url,
                        blobs_url: element.blobs_url,
                        git_tags_url: element.git_tags_url,
                        git_refs_url: element.git_refs_url,
                        trees_url: element.trees_url,
                        statuses_url: element.statuses_url,
                        languages_url: element.languages_url,
                        stargazers_url: element.stargazers_url,
                        contributors_url: element.contributors_url,
                        subscribers_url: element.subscribers_url,
                        subscription_url: element.subscription_url,
                        commits_url: element.commits_url,
                        git_commits_url: element.git_commits_url,
                        comments_url: element.comments_url,
                        issue_comment_url: element.issue_comment_url,
                        contents_url: element.contents_url,
                        compare_url: element.compare_url,
                        merges_url: element.merges_url,
                        archive_url: element.archive_url,
                        downloads_url: element.downloads_url,
                        issues_url: element.issues_url,
                        pulls_url: element.pulls_url,
                        milestones_url: element.milestones_url,
                        notifications_url: element.notifications_url,
                        labels_url: element.labels_url,
                        releases_url: element.releases_url,
                        deployments_url: element.deployments_url,
                        created_at: element.created_at,
                        updated_at: element.updated_at,
                        pushed_at: element.pushed_at,
                        git_url: element.git_url,
                        ssh_url: element.ssh_url,
                        clone_url: element.clone_url,
                        svn_url: element.svn_url,
                        homepage: element.homepage,
                        size: element.size,
                        stargazers_count: element.stargazers_count,
                        watchers_count: element.watchers_count,
                        language: element.language,
                        has_issues: element.has_issues,
                        has_projects: element.has_projects,
                        has_downloads: element.has_downloads,
                        has_wiki: element.has_wiki,
                        has_pages: element.has_pages,
                        forks_count: element.forks_count,
                        mirror_url: element.mirror_url,
                        archived: element.archived,
                        disabled: element.disabled,
                        open_issues_count: element.open_issues_count,
                        license: element.license,
                        allow_forking: element.allow_forking,
                        is_template: element.is_template,
                        web_commit_signoff_required: element.web_commit_signoff_required,
                        topics: element.topics,
                        visibility: element.visibility,
                        forks: element.forks,
                        open_issues: element.open_issues,
                        watchers: element.watchers,
                        default_branch: element.default_branch,
                    };

                    return ProjectModel.findOneAndUpdate(filter, update, {
                        new: true,
                        upsert: true
                    });
                });

                return Promise.all(updatePromises);
            })
            .then(results => {
                res.status(200).send({
                    message: "All repositories imported successfully",
                    importedCount: results.length,
                });
            })
            .catch(error => {
                res.status(400).send({
                    message: "An error occurred during import",
                    error: error.message
                });
            });
    });

    return router;
}
