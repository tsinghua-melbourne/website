# 清华大学墨尔本校友会 TUAAM

Tsinghua University Alumni Association in Melbourne — official website.

## Pages

| File | Page |
|---|---|
| `index.html` | 首页 \| Home |
| `news.html` | 新闻 \| NEWS (45 posts, adaptive pagination) |
| `posts/*.html` | Individual news articles |
| `salon.html` | 墨尔本清华沙龙 (sub-page of News) |
| `member.html` | 成员 \| MEMBERS |
| `member-fee.html` | 会费 \| FEE (sub-page of Members) |
| `constitution.html` | 规章 \| Regulation |
| `committee-election.html` | 换届选举 |
| `contact.html` | 联系 \| Contact |

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `tuaam`).
2. Upload this folder's contents to the repository (root level).
3. Go to **Settings → Pages** → Source: **GitHub Actions**.
4. The included workflow (`.github/workflows/pages.yml`) deploys automatically on every push to `main`.

Your site will be live at `https://<username>.github.io/<repo-name>/`.

> The `.nojekyll` file ensures static assets are served directly.

## Notes

- No build step required — the folder contains the final static site.
- All images are stored locally in `assets/`.
- The site generator (Python) and source materials are not included here; only the deployable site.
