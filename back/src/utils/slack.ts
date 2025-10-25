import axios from 'axios';

const API_HOST = 'https://slack.com/api';

const slackClient = axios.create({
  baseURL: API_HOST,
  headers: {
    'Content-type': 'application/json',
    Authorization: `Bearer ${process.env.SLACK_OAUTH_TOKEN}`,
  },
});

export default slackClient;
