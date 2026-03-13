# Auto Incognito Filter

A simple Chrome/Edge extension that automatically opens pages in Incognito Mode when it spots certain keywords you care about.

## What Does It Do?

Say you're browsing and there are certain sites or topics you'd rather not have saved in your history. Add some keywords related to them, and this extension will automatically switch to Incognito Mode when it detects a match. Pretty handy for job hunting, surprise shopping, or anything else you want to keep private.

## How to Install

So here's the thing – this extension isn't on the Chrome Web Store because, well, publishing costs money and nobody wants to pay $5 just to share a free tool. But don't worry, installing it manually is super easy:

1. **Grab this folder** – Download or clone this repo to your computer
2. **Open Extensions** – In Chrome/Edge, go to `chrome://extensions/` (or `edge://extensions/`)
3. **Turn on Developer Mode** – There's a toggle in the top-right corner, flip it on
4. **Click "Load unpacked"** – A button that appears once Developer Mode is on
5. **Pick the folder** – Select this extension's folder (the one with `manifest.json` in it)
6. **Done!** – Extension is now installed and ready to go

You might get a warning about unpacked extensions – that's normal, just confirm it.

## How to Use

### Add Keywords
Click the extension icon and type in keywords you want to trigger Incognito Mode. When you visit a page with those words in the title or URL, it'll automatically reopen in private browsing.

### Right-Click Menu (The Handy Stuff)
This is where it gets convenient. Right-click on any page and you'll see:
- **Add to Incognito Filter** – Instantly add this page to your keyword list
- **Open in Incognito** – Boom, opens the page in Incognito Mode right away

No need to copy-paste URLs or type out keywords manually.

## What's in the Folder

- `manifest.json` – Tells Chrome what this extension does
- `background.js` – The brain that watches your tabs
- `popup.html` / `popup.js` – The little window when you click the icon
- `style.css` – Makes it look nice
- `icon_*.png` – The extension icon

## A Few Notes

- Works on Chrome, Edge, and any Chromium-based browser
- Keywords are case-insensitive (so "Job" and "job" both work)
- It needs permission to read your tab URLs/titles – that's how it knows when to trigger

That's it! Enjoy your automatic incognito switching.
