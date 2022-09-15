const github = require('@actions/github')

/**
 * Return formatted Slack JSON message payload.
 *
 * @param core
 * @returns {Promise<void>}
 */
module.exports = async function slackMessage(core) {
    try {
        const context = github.context

        // Getting inputs
        const jobStatusSuccess = JSON.parse(core.getInput('job-status-success'))
        const pullRequest = context.payload.pull_request ? context.payload.pull_request : null

        // Defining workflow status
        const status = jobStatusSuccess ? 'passed' : 'failed'
        const color = jobStatusSuccess ? '#5cb85c' : '#d9534f'
        const emoji = jobStatusSuccess ? ':sunglasses:' : ':face_with_monocle:'

        // Getting workflow information
        const commitURL = `${context.payload.repository.html_url}/commit/${context.sha}`
        const runURL = `${context.payload.repository.html_url}/actions/runs/${context.runId}`
        const subSHA = context.sha.substring(0, 6)
        const repoFullName = context.payload.repository.full_name

        // Getting the branch name based on the event
        let branch = context.payload.repository.default_branch
        if (context.payload.eventName === 'pull_request') {
            branch = pullRequest.base.ref
        } else if (context.payload.eventName === 'release') {
            branch = context.payload.ref.replace(/refs\/tags\//i, '')
        }

        // Get preview message to be shown on the Slack notification.
        const previewMessage = getMessage(emoji, `#${context.runNumber}`, subSHA, status, repoFullName, branch,
            getPRInfo(pullRequest), context.actor)
        const message = getMessage(emoji, `<${runURL}|#${context.runNumber}>`, `<${commitURL}|${subSHA}>`, status,
            repoFullName, branch, getPRInfo(pullRequest, true), context.actor)

        // Creating the payload JSON to be sent to Slack.
        const payloadMessage = {
            'attachments': [
                {
                    'color': color,
                    'fallback': previewMessage,
                    'blocks': [
                        {
                            'type': 'section',
                            'text': {
                                'type': 'mrkdwn',
                                'text': message,
                            },
                        },
                    ],
                },
            ],
        }

        core.setOutput('payload', payloadMessage)

    } catch (error) {
        core.setFailed(error.message)
    }
}

/**
 * Return formatted message to be sent to Slack.
 *
 * @param emoji
 * @param runNumber
 * @param commit
 * @param status
 * @param repoName
 * @param branch
 * @param PRInfo
 * @param actor
 * @returns {string}
 */
function getMessage(emoji, runNumber, commit, status, repoName, branch, PRInfo, actor) {
    return `${emoji} Build ${runNumber} (${commit}) ${status} for ${repoName}@${branch} ${PRInfo} by ${actor}`
}

/**
 * Returns formatted PR info
 *
 * @param pullRequest
 * @param withLink
 * @returns {string}
 */
function getPRInfo(pullRequest, withLink = false) {
    if (pullRequest) {
        if (withLink) {
            return `in PR <${pullRequest.html_url}|#${pullRequest.number}>`
        } else {
            return `in PR #${pullRequest.number}`
        }
    }

    return ''
}
