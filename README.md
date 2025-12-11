# HTML Ad Template Engine

A pure static web application for creating, editing, and exporting HTML ad templates in multiple languages. Works perfectly on GitHub Pages and locally with Live Server.

## Features

- 🎨 **Dynamic Template Loading** - Add new templates by simply dropping `.html` files into `/templates/` folder
- 🌍 **Multi-Language Support** - Export templates in 30+ languages using LibreTranslate API (free, no API key required)
- 📦 **Multiple Export Formats**:
  - Master ZIP files with HTML templates
  - Image exports (PNG) in 3 sizes: 1200×1200, 1200×1500, 1200×628
  - Video exports (WebM) with audio support
- 🎬 **Video Generation** - Combine templates with audio files to create video ads
- 🌫️ **Smart Image Scaling** - Intelligent background blur and scaling for different ad sizes
- 💯 **100% Static** - No backend required, works entirely in the browser

## Quick Start

### For GitHub Pages

1. Upload all files to your GitHub repository
2. Enable GitHub Pages in repository settings
3. Your app will be live at `https://yourusername.github.io/repository-name/`

### For Local Development

1. Open the project folder in VS Code
2. Install the "Live Server" extension
3. Right-click on `index.html` → "Open with Live Server"
4. The app will open in your browser at `http://localhost:5500`

## Project Structure

```
├── index.html              # Main application page
├── templates/              # Template files (template1.html, template2.html, etc.)
├── js/
│   ├── engine.js          # Template engine logic
│   └── functions.js        # Export and translation functions
└── assets/                 # Optional assets folder
```

## Adding New Templates

**It's super easy!** Just follow these steps:

1. Create a new HTML file in the `/templates/` folder
2. Name it `template4.html`, `template5.html`, etc. (following the pattern)
3. Use `data-field` attributes to mark editable content:
   ```html
   <input type="text" data-field="title" value="My Title">
   <h1 data-field="title">My Title</h1>
   ```
4. The template will automatically appear in the dropdown!

### Template Structure

Each template should have:
- An input panel with form fields marked with `data-field` attributes
- A preview panel showing the rendered ad
- Both input and preview elements should share the same `data-field` value

Example:
```html
<div class="input-panel">
  <input type="text" data-field="title" value="Hello">
</div>
<div class="preview-panel">
  <h1 data-field="title">Hello</h1>
</div>
```

## Translation

The app uses **LibreTranslate API** (free, no API key required) for translations. Supported languages include:

- English, Spanish, French, German, Italian, Portuguese
- Chinese (Simplified & Traditional), Japanese, Korean
- Arabic, Russian, Hindi, and 20+ more languages

## Export Options

### 1. Master ZIP
- Exports HTML templates for all selected languages
- Each language gets its own ZIP file
- All language ZIPs are bundled in a master ZIP

### 2. Master Images ZIP
- Exports PNG images in 3 sizes per language
- Sizes: 1200×1200, 1200×1500, 1200×628
- Intelligent scaling with blurred background

### 3. Video ZIP
- Combines templates with audio files
- Creates WebM videos in 3 sizes per language
- Requires uploading an audio file first

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Video export requires MediaRecorder API support

## Technical Details

- **No Backend Required** - Everything runs in the browser
- **No Build Process** - Pure HTML, CSS, and JavaScript
- **CDN Libraries**:
  - JSZip for ZIP file creation
  - html2canvas for HTML to image conversion
  - FFmpeg.wasm for video processing (optional, uses MediaRecorder as fallback)
- **Translation API**: LibreTranslate (free public API)

## Troubleshooting

### Templates not appearing?
- Make sure template files are in `/templates/` folder
- Check browser console for errors
- Verify template file names follow the pattern: `template1.html`, `template2.html`, etc.

### Translation not working?
- Check browser console for API errors
- LibreTranslate API may be rate-limited (wait a few seconds)
- Try refreshing the page

### Video export not working?
- Ensure you've uploaded an audio file
- Use a modern browser (Chrome/Edge recommended)
- Check browser console for MediaRecorder errors

## License

Free to use and modify for your projects.

## Credits

- Translation powered by [LibreTranslate](https://libretranslate.de)
- Icons and UI inspired by modern design systems
