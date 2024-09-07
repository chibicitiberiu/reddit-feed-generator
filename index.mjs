import config from './config.mjs'
import {getFeed} from './feed.mjs'
import {createServer} from 'node:http'
import {parse as parseUrl} from 'node:url'

const server = createServer((req, res) => {
  const parsedUrl = parseUrl(req.url, true)
  const scope = parsedUrl.pathname.split('/')[1]

  req.parsedUrl = parsedUrl

  switch (scope) {
    case 'opml':
      downloadOPML(req, res)
      break
    default:
      home(req, res)
  }
})

async function home(req, res) {
  const slug = req.parsedUrl.pathname.split('/')[2]
  const sub = config.subs.find(sub => sub.slug === slug)

  if (!sub) {
    const subSlugs = config.subs
      .map(sub => `<li><a href="/feed/${sub.slug}">${sub.slug}</a></li>`)
      .join('')

    res.writeHead(404, {'Content-Type': 'text/html'})
    res.end(`
<h2>Feeds</h2>
${subSlugs}
<br>
<h2>OPML</h2>
<textarea rows="20" cols="80">${generateOPML(req)}</textarea>
<br>
<a href="/opml">Download OPML file</a>
`)
    return
  }

  const feed = await getFeed(sub)

  res.writeHead(200, {'Content-Type': 'application/xml;charset=utf-8'})
  res.end(feed)
}

function downloadOPML(req, res) {
  res.writeHead(200, {
    'Content-Disposition': 'attachment; filename="feeds.opml"',
    'Content-Type': 'text/xml',
  })
  res.end(generateOPML(req))
}

function generateOPML(req) {
  const lines = []

  for (const slug of config.subs.map(sub => sub.slug)) {
    const feedUrl = `http://${req.headers.host}:${config.port}/feed/${slug}`
    const opmlLine = `<outline xmlUrl='${feedUrl}' />`
    lines.push(opmlLine)
  }

  return `
<opml version="2.0">
  <body>
    <outline text="subscriptions" title="subscriptions">
      ${lines.join('\n\t')}
    </outline>
  </body>
</opml>`
}

const {port, host} = config

server.listen(port, host, () => {
  console.log(`Listening on http://${host}:${port}`)
})
