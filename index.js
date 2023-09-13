const core = require('@actions/core');
const axios = require('axios');
const slackifyMarkdown = require('slackify-markdown');

try {
    let payload = core.getInput('release-please-output');
    if (payload == "") {
        throw Error("Empty output");
    }

    payload = JSON.parse(payload);
    const slack_webhook = core.getInput('slack-webhook-url');
    if (slack_webhook == "") {
        throw Error("slack-webhook-url is empty");
    }

    const channel = core.getInput('slack-channel');
    const username = core.getInput('slack-username');
    const icon = core.getInput('slack-icon');

    const releases = preparePayload(payload);
    const text = releases.join("\n");
    sendMessage(text, slack_webhook, icon, username, channel);
} catch (error) {
    core.setFailed(error.message);
}

function preparePayload(payload) {
    const repoName = process.env.GITHUB_REPOSITORY; // Get the repository name
    let repoUrl = `https://github.com/${repoName}`;
    let releases = [];

    // Handle the case where body is directly under the root of the payload
    if (payload.body) {
        const slackifiedBody = slackifyMarkdown(payload.body); // Convert markdown to Slack format
        const text = `*<${repoUrl}|${repoName}>*\n\n${slackifiedBody}\n`; // Make the repo name a clickable and bold link
        releases.push(text);
    }

    // Handle the case where bodies are associated with specific paths
    if (payload.paths_released) {
        const paths_released = JSON.parse(payload['paths_released']); // Parse as JSON here
        for (const path of paths_released) {
            const body = payload[`${path}--body`];
            if (body) {
                const slackifiedBody = slackifyMarkdown(body); // Convert markdown to Slack format
                const text = `*<${repoUrl}|${repoName}>*\n*${path}*\n${slackifiedBody}\n`; // Include bold repo name, path, and body in the message
                releases.push(text);
            }
        }
    }

    return releases;
}

function sendMessage(text, webhook, icon, username, channel) {
    let data = { text };
    if (icon != "") {
        data.icon_url = icon;
    }

    if (username != "") {
        data.username = username;
    }

    if (channel != "") {
        data.channel = channel;
    }

    axios.post(webhook, data)
        .then((_) => {
        }).catch((err) => {
            throw Error(err);
        });
}
