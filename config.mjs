import fs from 'node:fs'

let subs

try {
  subs = JSON.parse(fs.readFileSync('subs.json', 'utf8'))
} catch (err) {
  console.error('Rename subs.example.json to subs.json and add your subreddits')
  process.exit(1)
}

export default {
  generator: 'reddit-feed-generator',

  host: process.argv[3] || '127.0.0.1',
  port: process.argv[2] || 5555,

  clientId: process.env.REDDIT_CLIENT_ID,

  sort: 'top',
  time: 'week',

  subs,
}
