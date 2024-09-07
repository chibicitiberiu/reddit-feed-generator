import * as convert from 'xml-js'
import config from './config.mjs'

const baseUrl = 'https://www.reddit.com'

export async function getFeed(sub) {
  const url = `${baseUrl}/r/${sub.slug}/${config.sort}.json?t=${config.time}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer `,
      'User-Agent': `script:${config.clientId}:v1 (by /u/youruser)`,
    },
  })

  const feedJson = await response.json()

  const posts = feedJson.data.children
    .filter(post => post.data.ups > sub.threshold)
    .map(post => ({
      author: post.data.author,
      created: new Date(post.data.created * 1000),
      downs: post.data.downs,
      numComments: post.data.num_comments,
      permalink: post.data.permalink,
      selftext: post.data.selftext,
      selftextHtml: post.data.selftext_html,
      thumbnail: post.data.thumbnail,
      title: post.data.title,
      ups: post.data.ups,
      upvoteRatio: post.data.upvote_ratio,
      url: post.data.url,
      urlOverridenByDest: post.data.url_overridden_by_dest,
    }))

  return generateAtomFeed(sub, posts)
}

function generateAtomFeed(sub, posts) {
  const base = {
    _declaration: {_attributes: {version: '1.0', encoding: 'utf-8'}},
    feed: {
      _attributes: {xmlns: 'http://www.w3.org/2005/Atom'},
      generator: config.generator,
      title: sub.title,
      link: {_attributes: {rel: 'self', href: `${baseUrl}/r/${sub.slug}`}},
      updated: new Date().toISOString(),
    },
  }

  base.feed.entry = posts.map(post => ({
    author: [{name: post.author, link: `${baseUrl}/u/${post.author}`}],
    content: buildEntryContent(post),
    date: post.created,
    id: post.url,
    link: {
      _attributes: {rel: 'alternate', href: `${baseUrl}${post.permalink}`},
    },
    image: post.thumbnail,
    title: post.title,
  }))

  return convert.js2xml(base, {
    compact: true,
    ignoreComment: true,
    spaces: 4,
  })
}

function buildEntryContent(post) {
  let content = ''
  let link = ''

  if (
    post.urlOverridenByDest?.includes('gif') ||
    post.urlOverridenByDest?.includes('jpeg') ||
    post.urlOverridenByDest?.includes('jpg') ||
    post.urlOverridenByDest?.includes('png')
  ) {
    content += `<img src="${post.urlOverridenByDest}" alt="${post.title}" />\n`
  } else {
    link = post.urlOverridenByDest
  }

  content += `${decodeHtml(post.selftextHtml)}\n${getEntryContentFooter(
    post,
    link
  )}`
  return content
}

function getEntryContentFooter(post, link) {
  return `
    <footer>
      submitted by <a href="${baseUrl}/u/${post.author}">${post.author}</a>
      <p>
        <a href="${baseUrl}${post.permalink}">Comments (${post.numComments})</a>
        ${link ? `| <a href="${link}">Link shared</a>` : ''}
      </p>
      <p>
        ${post.ups} ups (<b>${post.upvoteRatio * 100}%</b>)
      </p>
    </footer>
  `
}

function decodeHtml(encodedStr) {
  if (!encodedStr) return ''

  return encodedStr
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}
