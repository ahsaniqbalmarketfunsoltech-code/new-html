# Field Naming Guide - Centralized Configuration System

## 🎯 **How It Works**

This system uses **automatic field type detection** based on naming patterns. When you add a new template, just follow the naming conventions below and everything will auto-sync!

**NO CODE CHANGES NEEDED** - Just follow the patterns!

---

## 📋 **Supported Field Types**

### **1. TEXT FIELDS** 
Updates text content in preview

**Naming Patterns:**
- `title`, `heading`, `subtitle`, `description`, `content`, `text`, `label`, `name`
- `footer`, `header`, `body`, `paragraph`, `message`, `caption`, `tagline`, `slogan`
- `brand`, `company`, `address`, `phone`, `email`, `website`, `link`, `button`, `cta`, `callToAction`

**Example:**
```html
<input type="text" data-field="title" value="My Title">
<h1 data-field="title">My Title</h1>
```

---

### **2. COLOR FIELDS**
Updates text or background color

**Naming Patterns:**
- End with `Color` → Text color
- End with `Bg` or `Background` → Background color
- End with `Fill` → Fill color

**Examples:**
```html
<!-- Text Color -->
<input type="color" data-field="titleColor" value="#000000">
<h1 data-field="title" style="color: var(--title-color);">Title</h1>

<!-- Background Color -->
<input type="color" data-field="headerBg" value="#ffffff">
<div data-field="headerBg" style="background-color: #ffffff;">Header</div>
```

---

### **3. IMAGE FIELDS**
Handles image uploads and display

**Naming Patterns:**
- Contains: `image`, `img`, `thumbnail`, `photo`, `picture`, `logo`, `icon`, `avatar`, `banner`
- Contains: `backgroundImage`, `background`

**Examples:**
```html
<!-- Image -->
<input type="file" data-field="thumbnail" accept="image/*">
<img data-field="thumbnail" src="" alt="">

<!-- Background Image -->
<input type="file" data-field="backgroundImage" accept="image/*">
<div data-field="backgroundImage" style="background-image: url(...);"></div>
```

---

### **4. SIZE FIELDS**
Updates width, height, or font-size

**Naming Patterns:**
- End with `Width` → Width
- End with `Height` → Height
- End with `Size` or `FontSize` → Font size

**Examples:**
```html
<!-- Width -->
<input type="number" data-field="imageWidth" value="320">
<div data-field="imageWidth" style="width: 320px;"></div>

<!-- Height -->
<input type="number" data-field="containerHeight" value="480">
<div data-field="containerHeight" style="height: 480px;"></div>

<!-- Font Size -->
<input type="number" data-field="titleSize" value="24">
<h1 data-field="title" style="font-size: 24px;">Title</h1>
```

---

### **5. SPACING FIELDS**
Updates padding, margin, or gap

**Naming Patterns:**
- Contains `Padding` → Padding
- Contains `Margin` → Margin
- Contains `Gap` → Gap
- Add `Top`, `Bottom`, `Left`, `Right` for specific directions

**Examples:**
```html
<!-- Padding -->
<input type="number" data-field="headerPaddingTop" value="20">
<div data-field="headerBg" style="padding-top: 20px;">Header</div>

<!-- Margin -->
<input type="number" data-field="contentMargin" value="10">
<div data-field="content" style="margin: 10px;">Content</div>
```

---

### **6. AUDIO FIELDS**
Handles audio file uploads

**Naming Patterns:**
- Contains: `audio`, `sound`, `music`, `mp3`, `wav`, `ogg`

**Example:**
```html
<input type="file" data-field="backgroundAudio" accept="audio/*">
<audio data-field="backgroundAudio" src=""></audio>
```

---

### **7. VIDEO FIELDS**
Handles video file uploads

**Naming Patterns:**
- Contains: `video`, `movie`, `mp4`, `webm`, `mov`

**Example:**
```html
<input type="file" data-field="promoVideo" accept="video/*">
<video data-field="promoVideo" src=""></video>
```

---

### **8. SELECT/DROPDOWN FIELDS**
Updates based on dropdown selection

**Naming Patterns:**
- Contains: `select`, `choice`, `option`, `dropdown`, `menu`

**Example:**
```html
<select data-field="fontChoice">
  <option value="Arial">Arial</option>
  <option value="Helvetica">Helvetica</option>
</select>
<span data-field="fontChoice">Arial</span>
```

---

### **9. BORDER FIELDS**
Updates border styles

**Naming Patterns:**
- Contains: `border`, `borderRadius`, `borderWidth`, `borderColor`

**Examples:**
```html
<!-- Border Radius -->
<input type="number" data-field="buttonBorderRadius" value="8">
<button data-field="buttonBorderRadius" style="border-radius: 8px;">Button</button>

<!-- Border Color -->
<input type="color" data-field="cardBorderColor" value="#000000">
<div data-field="cardBorderColor" style="border-color: #000000;">Card</div>
```

---

### **10. OPACITY FIELDS**
Updates element opacity

**Naming Patterns:**
- Contains: `opacity`, `alpha`, `transparency`

**Example:**
```html
<input type="range" data-field="overlayOpacity" min="0" max="100" value="50">
<div data-field="overlayOpacity" style="opacity: 0.5;">Overlay</div>
```

---

### **11. POSITION FIELDS**
Updates element position

**Naming Patterns:**
- Contains: `position`, `top`, `left`, `right`, `bottom`, `zIndex`

**Examples:**
```html
<input type="number" data-field="logoTop" value="20">
<img data-field="logo" style="top: 20px; position: absolute;">
```

---

### **12. FONT FIELDS**
Updates font properties

**Naming Patterns:**
- Contains: `font`, `fontFamily`, `fontWeight`, `fontStyle`
- Contains: `textAlign`, `lineHeight`, `letterSpacing`

**Examples:**
```html
<!-- Font Family -->
<select data-field="titleFontFamily">
  <option value="Arial">Arial</option>
</select>
<h1 data-field="title" style="font-family: Arial;">Title</h1>

<!-- Text Align -->
<select data-field="contentTextAlign">
  <option value="left">Left</option>
  <option value="center">Center</option>
</select>
<p data-field="content" style="text-align: center;">Content</p>
```

---

### **13. BACKGROUND FIELDS**
Updates background color or gradient

**Naming Patterns:**
- Contains: `background`, `bg`, `gradient`

**Examples:**
```html
<!-- Background Color -->
<input type="color" data-field="cardBg" value="#ffffff">
<div data-field="cardBg" style="background-color: #ffffff;">Card</div>

<!-- Gradient -->
<input type="text" data-field="headerGradient" value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
<div data-field="headerGradient" style="background: linear-gradient(...);">Header</div>
```

---

## ✅ **Best Practices**

### **1. Always Use data-field Attribute**
```html
<!-- ✅ GOOD -->
<input data-field="title">
<h1 data-field="title">Title</h1>

<!-- ❌ BAD -->
<input id="title">
<h1 id="title">Title</h1>
```

### **2. Match Input and Preview data-field Values**
```html
<!-- ✅ GOOD - Same data-field value -->
<input type="text" data-field="title" value="Hello">
<h1 data-field="title">Hello</h1>

<!-- ❌ BAD - Different values -->
<input type="text" data-field="titleInput" value="Hello">
<h1 data-field="titleDisplay">Hello</h1>
```

### **3. Follow Naming Conventions**
```html
<!-- ✅ GOOD - Follows pattern -->
<input type="color" data-field="titleColor">
<input type="file" data-field="thumbnail">
<input type="number" data-field="titleSize">

<!-- ❌ BAD - Doesn't follow pattern -->
<input type="color" data-field="titleColour">
<input type="file" data-field="thumb">
<input type="number" data-field="titleFont">
```

### **4. Put Styles in <style> Tags**
```html
<!-- ✅ GOOD - Styles in template -->
<style>
  .title-text {
    color: var(--title-color);
    font-size: var(--title-size);
  }
</style>
<h1 class="title-text" data-field="title">Title</h1>

<!-- ❌ BAD - External stylesheet -->
<link rel="stylesheet" href="styles.css">
```

---

## 🚀 **Quick Start**

1. **Create your template** with input and preview panels
2. **Add data-field attributes** following the naming patterns above
3. **Test live preview** - it should update automatically
4. **Export** - it will sync perfectly!

---

## 📝 **Example Template**

```html
<div class="template-wrapper">
  <!-- INPUT PANEL -->
  <div class="input-panel">
    <input type="text" data-field="title" value="My Title">
    <input type="color" data-field="titleColor" value="#000000">
    <input type="number" data-field="titleSize" value="24">
    <input type="file" data-field="thumbnail" accept="image/*">
  </div>
  
  <!-- PREVIEW PANEL -->
  <div class="preview-panel">
    <h1 data-field="title" style="color: var(--title-color); font-size: var(--title-size);">
      My Title
    </h1>
    <img data-field="thumbnail" src="" alt="">
  </div>
</div>
```

That's it! The system automatically detects:
- `title` → Text field
- `titleColor` → Color field
- `titleSize` → Size field
- `thumbnail` → Image field

**No code changes needed!** 🎉

---

## 🔧 **Adding New Field Types**

If you need a new field type, just add it to `js/field-config.js`:

```javascript
'newType': {
  pattern: /(yourPattern|YourPattern)$/i,
  previewUpdate: 'style', // or 'textContent' or 'src'
  styleProperty: 'yourProperty',
  exportHandling: 'style',
  inputTypes: ['text', 'number'],
  description: 'Your new field type description'
}
```

Then all templates using this pattern will automatically work!

---

## ❓ **Troubleshooting**

**Q: Field not syncing?**
- Check that input and preview have the same `data-field` value
- Verify the field name follows a naming pattern
- Check browser console for errors

**Q: Image not showing?**
- Make sure field name contains `image`, `img`, `thumbnail`, etc.
- Verify image is uploaded (check for data URL in console)

**Q: Color not updating?**
- Use `Color` suffix for text color
- Use `Bg` or `Background` suffix for background color

**Q: Size not working?**
- Use `Size` or `FontSize` for font size
- Use `Width` for width
- Use `Height` for height

---

**That's it! Follow these patterns and your templates will auto-sync perfectly!** ✨

