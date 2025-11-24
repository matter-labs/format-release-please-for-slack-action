const core = require('@actions/core');
const axios = require('axios');
const slackifyMarkdown = require('slackify-markdown');
const github = require('@actions/github');

(async () => {
  try {
    let payload = core.getInput('release-please-output');
    if (payload === "") {
      throw Error("Empty output");
    }

    payload = JSON.parse(payload);

    const slack_webhook = core.getInput('slack-webhook-url');
    if (slack_webhook === "") {
      throw Error("slack-webhook-url is empty");
    }

    const channel = core.getInput('slack-channel');
    const username = core.getInput('slack-username');
    const icon = core.getInput('slack-icon');

    // 🔑 Get GitHub token (either from input or env)
    const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw Error("github-token input or GITHUB_TOKEN env is required");
    }

    const octokit = github.getOctokit(githubToken);
    const { owner, repo } = github.context.repo;
    const sha = github.context.sha;

    // 🔍 Find PR(s) associated with this commit
    const prsResp = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner,
      repo,
      commit_sha: sha,
    });

    let mergedByLogin = null;

    if (prsResp.data.length > 0) {
      const prNumber = prsResp.data[0].number;

      const prResp = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      if (prResp.data.merged && prResp.data.merged_by) {
        mergedByLogin = prResp.data.merged_by.login;
      }
    }

    const releases = preparePayload(payload, mergedByLogin);
    const text = releases.join("\n");
    await sendMessage(text, slack_webhook, icon, username, channel);
  } catch (error) {
    core.setFailed(error.message);
  }
})();

function preparePayload(payload, mergedByLogin) {
  const repoName = process.env.GITHUB_REPOSITORY; // Get the repository name
  let repoUrl = `https://github.com/${repoName}`;
  let releases = [];

  // Build merger text (Slack formatted, if we have it)
  const mergerLine = mergedByLogin
    ? `\n_Merged by: @${mergedByLogin}_`
    : "";

  // Handle the case where body is directly under the root of the payload
  if (payload.body) {
    const slackifiedBody = slackifyMarkdown(payload.body); // Convert markdown to Slack format
    const text =
      `*<${repoUrl}|${repoName}>*` +
      `\n\n${slackifiedBody}` +
      mergerLine +
      `\n`;
    releases.push(text);
  }

  // Handle the case where bodies are associated with specific paths
  if (payload.paths_released) {
    const paths_released = JSON.parse(payload['paths_released']); // Parse as JSON here
    for (const path of paths_released) {
      const body = payload[`${path}--body`];
      if (body) {
        const slackifiedBody = slackifyMarkdown(body); // Convert markdown to Slack format
        const text =
          `*<${repoUrl}|${repoName}>*` +
          `\n*${path}*` +
          `\n${slackifiedBody}` +
          mergerLine +
          `\n`;
        releases.push(text);
      }
    }
  }

  return releases;
}

async function sendMessage(text, webhook, icon, username, channel) {
  let data = { text };
  if (icon !== "") {
    data.icon_url = icon;
  }

  if (username !== "") {
    data.username = username;
  }

  if (channel !== "") {
    data.channel = channel;
  }

  await axios.post(webhook, data);
}
