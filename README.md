# Threads & X Scraper

Tampermonkey userscripts that scrape all posts from a public Threads or X (Twitter) profile — from their first post to the latest. Zero setup, runs directly in your browser.

This repo now contains two scripts:

| Script | Platform |
|---|---|
| [`threads_scraper.user.js`](./threads_scraper.user.js) | Threads (threads.net / threads.com) |
| [`x_scraper.user.js`](./x_scraper.user.js) | X / Twitter (x.com / twitter.com) |

## Features

- **Full history** — scrapes every post from day one to present
- **Text, images, videos** — captures post content, media URLs, timestamps, and engagement counts
- **Replies tab** — optionally scrapes the user's replies too
- **Skip retweets** (X only) — ignore pure reposts, keep only original tweets/quotes
- **Shopee affiliate filter** — keep only posts containing Shopee affiliate links
- **Date range filter** — limit scraping to the last N months or a custom date range
- **Pause / resume + auto-save** — safely stop and continue later without losing progress
- **Export JSON, CSV & Markdown** — download structured data in your preferred format
- **No login required** — works on any public profile
- **Ad blocker safe** — no network interception, reads directly from rendered DOM
- **Modern UI** — minimal dark panel, zero external dependencies

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open Tampermonkey Dashboard → Create new script
3. Paste the contents of [`threads_scraper.user.js`](./threads_scraper.user.js) (for Threads) or [`x_scraper.user.js`](./x_scraper.user.js) (for X/Twitter)
4. Save (Ctrl+S / Cmd+S)

## Usage

### Threads

1. Navigate to any Threads profile: `https://www.threads.com/@username`
2. The scraper panel appears in the top-right corner
3. Configure options (scroll delay, replies tab, deep mode)
4. Click **Start Scraping**
5. Wait until it finishes (auto-stops when no new posts found)
6. Click **JSON**, **CSV**, or **Markdown** to download

### X / Twitter

1. Navigate to any X profile: `https://x.com/username`
2. The scraper panel appears in the top-right corner
3. Configure options (scroll delay, time limit, include replies, skip retweets, Shopee filter)
4. Click **Start Scraping** — the script auto-navigates between the Posts and Replies tabs when "Include replies" is enabled
5. Use **Pause/Resume** anytime; progress auto-saves per profile so you can close the tab and continue later
6. Click **JSON**, **CSV**, or **Markdown** to download

## Options

| Setting | Description |
|---------|-------------|
| Scroll delay | Milliseconds between each scroll step (default: 1800) |
| Time limit | Only keep posts within the last N months, or a custom date range |
| Include replies | Also scrape the profile's Replies tab |
| Skip pure retweets (X) | Ignore reposts with no added commentary |
| Shopee filter | Only keep posts containing a Shopee affiliate link |
| Deep mode (Threads) | Opens each post to capture conversations where the creator replied |

## Output formats

### JSON

```json
{
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

Flat format with columns: `code`, `username`, `text`, `time`, `like_count`, `has_video`/engagement counts, `images`, `url`

### Markdown

Human-readable archive format with headers and links. Works great in Notion, Obsidian, or any markdown viewer.

## How it works

Both platforms virtualize their feed — only posts visible in the viewport have their content rendered. The scrapers handle this by:

1. Scrolling in small increments (60% viewport) to keep posts visible longer
2. Extracting text directly from the rendered DOM on each scroll (Threads: `[dir="auto"]` spans; X: `[data-testid="tweetText"]`)
3. Merging data across scroll passes — if a post was seen without text earlier, it gets updated when text becomes available
4. Auto-saving progress after every scroll that finds new posts, so pause/stop never loses data
5. Detecting end-of-feed after ~12 consecutive scrolls with no new posts

## Limitations

- **Private accounts** cannot be scraped
- **Text capture rate** depends on scroll speed — slower = more text captured
- **Like/engagement counts** may show 0 if the platform doesn't expose them in aria-labels
- Only works on profile pages, not the home feed

## Tech

- Vanilla JavaScript (no dependencies)
- DOM parsing (X scraper additionally reads `data-testid` attributes from the rendered timeline)
- Tampermonkey userscript API

## License

[MIT](./LICENSE)
