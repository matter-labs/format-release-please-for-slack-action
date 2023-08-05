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
    const paths_released = JSON.parse(payload['paths_released']); // Parse as JSON here
    let releases = [];
    for (const path of paths_released) {
        const body = payload[`${path}--body`];
        const slackifiedBody = slackifyMarkdown(body); // convert markdown to Slack format
        const text = `\n # ${path} \n ${slackifiedBody} \n`;
        releases.push(text);
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
