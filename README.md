# Format release please for Slack

Format output from Release Please and send it to Slack

## ENV

### `RELEASE_PLEASE_OUTPUT`

**REQUEIRED**  Release please output

## Inputs

### `slack-url`

**REQUIRED**  The Slack Incoming Webhook

### `slack-channel`

The name of the channel you want to post, by default will post in the channel that was setup in the webhook creation
  
### `slack-username`

The name of the sender of the message. ie, "GitHubAction"
  
### `slack-icon`

User/Bot icon shown with Slack message

## Example usage

```yaml
uses: Deniallugo/format-release-for-mm-action@v1.0
with:
  release-please-output: ${{ steps.release.outputs }}
  slack-webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```
