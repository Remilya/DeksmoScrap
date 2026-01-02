# Deksmo WebGrab

![Version](https://img.shields.io/badge/version-1.3-blue.svg) ![Manifest](https://img.shields.io/badge/Manifest-V3-green.svg) ![Deksmo](https://img.shields.io/badge/Ecosystem-Deksmo-cyan.svg)

**A Deksmo Ecosystem Module.**  
*Original Project: [KellyC Image Downloader](https://github.com/NC22/KellyC-Image-Downloader)*

Deksmo WebGrab is an image downloader browser extension optimized and integrated into the Deksmo suite for batch downloading artworks and images from web sources.

---

## ✨ What's New in v1.3

### 🗂️ PDF Manager
A beautiful, standalone dashboard for managing your grabbed images before export:
- **PDF & ZIP Export**: Convert image folders into PDFs or ZIP archives
- **Lightbox Preview**: Click any image for full-screen inspection with keyboard navigation
- **Page Reordering**: Drag and drop pages to rearrange them
- **Page Management**: Add or delete individual pages from chapters
- **Rename Chapters**: Click the title to rename your export
- **Batch Export**: Export all queued chapters at once

### 🎨 Deksmo Branding
- Official Deksmo logo and favicon
- Rebranded from "MangaArchiver" to "Deksmo"
- Default folders now use `Deksmo/Downloads` and `Deksmo/Storage`

### 🔧 Technical Improvements
- **Manifest V3 Compatible**: Updated for Chrome's new extension platform
- **Background Script Fetch**: CORS bypass for reliable image loading in exports
- **State Persistence**: Grid stays open while editing pages

---

## Features

- Batch download images from any website
- Filter images by size, resolution, or other settings  
- Extended support for Pinterest, Pixiv, Twitter, and more
- "Load related document" feature for fetching original images from previews
- **NEW**: Export grabbed images directly to PDF or ZIP

---

## Installation

> ⚠️ **Note:** This extension is not hosted on the Chrome Web Store. Install manually using Developer Mode.

### Quick Install (Manifest V3)

1. **Download** or clone this repository
2. Navigate to the `Release` folder (Manifest V3 ready)
3. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
4. Enable **Developer mode**
5. Click **Load unpacked** and select the `Release` folder


See [INFO/Instal.md](INFO/Instal.md) for detailed instructions.

---

## Usage

1. Click the **Deksmo WebGrab** icon in your browser toolbar
2. Press **Grab Images** to detect images on the page
3. Select your images and click:
   - **Download** - Save to your computer
   - **Export PDF** - Open in PDF Manager for review and export
   - **Export ZIP** - Open in PDF Manager for ZIP export

---

## License

[GNU General Public License v3](http://www.gnu.org/licenses/gpl.html)

---

**Powered by Deksmo Engine**  
*Preserving the art of manga, one folder at a time.*  
© 2026 Remilya Deksmo ™