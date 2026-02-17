# StreamForge — vMix Setup Guide

Complete guide for integrating StreamForge with vMix.

---

## Prerequisites

- vMix 26+ (any edition)
- vMix Web Controller enabled (Settings → Web Controller → Enable)
- StreamForge running on the same machine as vMix

---

## Method 1: XML Data Source (Recommended)

This is the most flexible approach. vMix polls StreamForge's XML feed and you can display it in any title template.

### Step 1: Add Data Source in vMix

1. In vMix, go to **Settings → Data Sources**
2. Click **Add**
3. Select **URL** as the source type
4. Enter: `http://localhost:4242/vmix/feed.xml`
5. Set refresh rate: **2 seconds** (or lower for faster updates)
6. Click **OK**

### Step 2: Create a Title Template

You can use any vMix title template (GT Title, XAML, etc.). The data source provides these fields:

| Field | Contents |
|-------|----------|
| `Index` | Position in feed (1 = newest) |
| `Platform` | "youtube", "twitch", "tiktok", etc. |
| `Author` | Display name of commenter |
| `Message` | The comment text |
| `Avatar` | Profile picture URL (if available) |
| `Timestamp` | ISO 8601 datetime |
| `IsHighlighted` | "1" if AI-highlighted, "0" otherwise |

**Example title design:**
- `Author` field → name text box
- `Message` field → comment text box
- `Platform` field → drive visibility of platform-specific logo layers

### Step 3: Map Fields to Your Title

1. Select your title input in vMix
2. Click the **Data** button
3. Map each field from the StreamForge data source to your title's text boxes
4. Enable **Auto Update** so the title updates automatically

---

## Method 2: Direct HTTP API Push

For simpler setups — StreamForge can push directly to a named title input when a comment is highlighted.

### Step 1: Configure in .env

```env
VMIX_INPUT=SocialComment    # Name of your title input in vMix
VMIX_TITLE_FIELD=Message    # Name of the text field inside the title
PUSH_TO_VMIX=true
```

### Step 2: How It Works

When a comment is AI-highlighted or you click "Pin to vMix" in the dashboard:
1. StreamForge sends the comment text to your title input via HTTP API
2. Triggers the title's TransitionIn animation automatically
3. The title appears on your broadcast

---

## Recommended Title Setup

### Basic Social Comment Lower Third

Create a vMix title with these layers:

```
Layer 1: Platform logo (toggle visibility based on Platform field)
Layer 2: Author name text box (map to "Author" field)  
Layer 3: Message text box (map to "Message" field)
Layer 4: Highlight indicator (visible when IsHighlighted = "1")
```

### Multi-Comment Ticker

Use the data source to drive a scrolling ticker showing the last 5 comments:

```
Row 1: Index=1 (most recent)
Row 2: Index=2
Row 3: Index=3
Row 4: Index=4
Row 5: Index=5
```

Set each row's data source binding to the corresponding Index row.

---

## Troubleshooting

**vMix can't connect to StreamForge:**
- Verify StreamForge is running: open http://localhost:4242/health in a browser
- Check Windows Firewall isn't blocking port 4242
- Ensure vMix and StreamForge are on the same machine (or update VMIX_HOST)

**Comments not updating:**
- Check the data source refresh rate in vMix (Settings → Data Sources)
- Verify StreamForge has active platform connections (check dashboard at http://localhost:4242)

**Comments appear but with wrong formatting:**
- Check that your title's text boxes are named to match the field names
- Use the vMix Data Source editor to verify field mapping

---

## Tips from a Working TD

- Set your data source refresh to **1-2 seconds** during live shows
- Use the StreamForge dashboard on a second monitor to monitor the feed
- Enable **Strict Mode** for church productions — it catches things you'd miss
- Use "Pin to vMix" for questions during Q&A segments — queue them up in advance
- The AI highlight feature works best when it's trained on your audience — it gets smarter over time
