# reddit-feed-generator

A simple web server that generates a list of filtered Reddit RSS feeds.

Reddit provides a RSS feed for each subreddit, which is awesome. However,
following a subreddit's feed usually comes with a lot of noise. This tool allows
you to define a minimum score for each post in the feed, so that you only get
the best posts.

:warning: Do not expose this server to the web.

## Usage

1. Create a Reddit application and add its ID to the REDDIT_CLIENT_ID
   environment variable.

2. Copy the subs.example.json file and specify the subreddits you want to
   follow.

```
cp subs.example.json subs.json
```

```js
// subs.json
[
    {title: 'r/aws', slug: 'aws', threshold: 100},
    {title: 'r/linux', slug: 'linux', threshold: 120},
    {title: 'r/node', slug: 'node', threshold: 150},
]
```

3. Run the server using `npm start`

4. Access `http://localhost:5555` to check if it is running.

5. Add the URLs to your RSS reader. For example, to follow the `r/aws` subreddit,
   add `http://localhost:5555/aws`. Alternatively, you can download the OPML file
   on the home page.

## Features

- Sort by "hot", "new", "top" or "controversial"
- Filter by "hour", "day", "week", "month", "year" or "all"
- Show the amount comments
- Shows images
- Shows shared links
- OPML list export

## License

MIT License

Copyright (c) 2024 patrickrbc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
