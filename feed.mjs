import * as convert from 'xml-js'
import config from './config.mjs'
import { extract } from '@extractus/article-extractor'
import he from 'he'

const baseUrl = 'https://www.reddit.com'

const articleFetchOptions = {
  headers: {
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'DNT': '1',
    'Sec-GPC': '1',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Priority': 'u=0, i',
  },
}

export async function getFeed(sub) {
  const url = `${baseUrl}/r/${sub.slug}/${config.sort}.json?t=${config.time}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer `,
      'User-Agent': `script:${config.clientId}:v1 (by /u/youruser)`,
    },
  });

  const feedJson = await response.json();

  const posts = feedJson.data.children
    .filter(post => post.data.ups > sub.threshold)
    .map(post => ({
      id: post.data.id,
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
      flair: post.data.link_flair_text,
    }));

  return await generateAtomFeed(sub, posts);
}

async function generateAtomFeed(sub, posts) {
  const base = {
    _declaration: {_attributes: {version: '1.0', encoding: 'utf-8'}},
    feed: {
      _attributes: {xmlns: 'http://www.w3.org/2005/Atom'},
      generator: config.generator,
      title: sub.title,
      link: {_attributes: {rel: 'self', href: `${baseUrl}/r/${sub.slug}`}},
      updated: new Date().toISOString(),
    },
  };

  base.feed.entry = await Promise.all(posts.map(async post => ({
    author: [{name: post.author, link: `${baseUrl}/u/${post.author}`}],
    content: await buildEntryContent(post),
    date: post.created.toISOString(),
    updated: post.created.toISOString(),
    id: post.id,
    link: {
      _attributes: {rel: 'alternate', href: `${baseUrl}${post.permalink}`},
    },
    image: post.thumbnail,
    title: post.title,
    category: {
      _attributes: {term: post.flair},
    }
  })));

  return convert.js2xml(base, {
    compact: true,
    ignoreComment: true,
    spaces: 4,
  });
}

async function buildEntryContent(post) {
  let content = ''

  content += getEntryContentHeader(post, post.urlOverridenByDest)

  if (post.selftextHtml) {
    content += he.decode(post.selftextHtml);
  }

  if (post.urlOverridenByDest && post.urlOverridenByDest !== '') {
    
    // extract image
    if (post.urlOverridenByDest?.includes('gif') ||
        post.urlOverridenByDest?.includes('jpeg') ||
        post.urlOverridenByDest?.includes('jpg') ||
        post.urlOverridenByDest?.includes('png')) {
      content += `<img src="${post.urlOverridenByDest}" alt="${post.title}" />\n`
    }

    // extract article
    else {
      try {
        const controller = new AbortController()

        // stop after 60 seconds
        setTimeout(() => {
          controller.abort()
        }, 60000)

        //await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 50)));
        const article = await extract(post.urlOverridenByDest, undefined, {
          ...articleFetchOptions,
          signal: controller.signal
        });
        if (article) {
          if (article.content)
            content += he.decode(article.content)
          if (article.image)
            content += `<img src="${article.image}" />\n`
        }
      } catch (err) {
        console.error('Error extracting article:', post.urlOverridenByDest)
        console.error(err)
      }
    }
  }
  
  return content
}

function getEntryContentHeader(post, link) {
  return `
    <header>
      <span>
        ${post.ups} upvotes (${post.upvoteRatio * 100}%)
      </span>
      |
      <span>
        <a href="${baseUrl}${post.permalink}">${post.numComments} comments</a>
      </span>
      |
      ${link ? `<span><a href="${link}">Link shared</a></span> |` : ''}
      <span>submitted by <a href="${baseUrl}/u/${post.author}">${post.author}</a></span>
    </header>
  `
}