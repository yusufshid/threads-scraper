# Threads & X Scraper

A single Tampermonkey userscript that scrapes all posts from a public **Threads** or **X (Twitter)** profile — from their first post to the latest. It auto-detects which platform you're on and adapts. Zero setup, runs directly in your browser.

## Features

- **One script, two platforms** — auto-detects Threads vs X from the current domain
- **Full history** — scrapes every post from day one to present
- **Text, images, videos** — captures post content, media URLs, timestamps, and engagement counts
- **Replies tab** — optionally scrapes the user's replies too
- **Skip pure retweets** (X only) — ignore reposts with no added commentary
- **Deep mode** (Threads only) — opens each post individually to capture conversations where the creator replied
- **Shopee affiliate filter** — keep only posts/tweets containing a Shopee affiliate link
- **Date range filter** — limit scraping to the last N months or a custom date range
- **Pause / resume + auto-save** — safely stop and continue later without losing progress
- **Export JSON, CSV & Markdown** — download structured data in your preferred format
- **No login required** — works on any public profile
- **Ad blocker safe** — no network interception, reads directly from rendered DOM

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open Tampermonkey Dashboard → Create new script
3. Paste the contents of [`threads-x-scraper.user.js`](./threads-x-scraper.user.js)
4. Save (Ctrl+S / Cmd+S)

## Usage

1. Navigate to any public profile:
   - Threads: `https://www.threads.com/@username`
   - X/Twitter: `https://x.com/username`
2. The scraper panel appears in the top-right corner, labeled for the platform you're on
3. Configure options (scroll delay, time limit, replies, Shopee filter, and platform-specific toggles)
4. Click **Start Scraping**
5. Use **Pause/Resume** anytime; progress auto-saves per profile+platform so you can close the tab and continue later
6. Wait until it finishes (auto-stops when no new posts found)
7. Click **JSON**, **CSV**, or **Markdown** to download

## Options

| Setting | Description | Platform |
|---------|-------------|----------|
| Scroll delay | Milliseconds between each scroll step (default: 1800) | Both |
| Time limit | Only keep posts within the last N months, or a custom date range | Both |
| Include replies | Also scrape the profile's Replies tab | Both |
| Shopee filter | Only keep posts containing a Shopee affiliate link | Both |
| Skip pure retweets | Ignore reposts with no added commentary | X only |
| Deep mode | Opens each post to capture conversations where the creator replied | Threads only |

## Output formats

### JSON

```json
{
  "platform": "x",
  "username": "example",
  "total": 150,
  "total_with_text": 142,
  "posts": [
    {
      "code": "1234567890",
      "text": "Post content here...",
      "time": "2024-07-06T10:30:00.000Z",
      "like_count": 5000,
      "images": ["https://..."],
      "has_video": false,
      "url": "https://x.com/example/status/1234567890"
    }
  ]
}
```

### CSV

Flat format — columns include `code`, `username`, `text`, `time`, `like_count` (plus `retweet_count`/`reply_count` on X), `has_video`, `images`, `url`.

### Markdown

Human-readable archive format with headers and links. Works great in Notion, Obsidian, or any markdown viewer.

## How it works

Both platforms virtualize their feed — only posts visible in the viewport have their content rendered. The script handles this by:

1. Detecting the platform from `window.location.hostname` and branching all DOM extraction accordingly
2. Scrolling in small increments (60% viewport) to keep posts visible longer
3. Extracting text directly from the rendered DOM on each scroll (Threads: `[dir="auto"]` spans; X: `[data-testid="tweetText"]`)
4. Merging data across scroll passes — if a post was seen without text earlier, it gets updated when text becomes available
5. Auto-saving progress after every scroll that finds new posts, so pause/stop never loses data
6. Detecting end-of-feed after ~12 consecutive scrolls with no new posts

## Limitations

- **Private accounts** cannot be scraped
- **Text capture rate** depends on scroll speed — slower = more text captured
- **Deep mode (Threads)** is slow — 1 request per post
- **Like/engagement counts** may show 0 if the platform doesn't expose them in aria-labels
- Only works on profile pages, not the home feed

## Tech

- Vanilla JavaScript (no dependencies)
- DOM parsing, platform detection via hostname, `data-testid` reads on X, hidden JSON `<script>` parsing on Threads (deep mode)
- Tampermonkey userscript API

## License

[MIT](./LICENSE)
