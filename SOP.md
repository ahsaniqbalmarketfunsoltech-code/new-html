# Template Creation SOP - Ultra Short

## 3 Rules

### 1. **Use `data-field` Attributes**
```html
<!-- Input -->
<input type="text" data-field="title">

<!-- Preview -->
<h1 data-field="title">Default</h1>
```

### 2. **Follow Naming Patterns**
- Text: `title`, `heading`, `footer`
- Color: Ends with `Color` → `headerColor`
- Background: Ends with `Bg` → `headerBg`
- Image: `thumbnail`, `image`
- Size: Ends with `Size` → `buttonSize`
- Link: Ends with `Link` → `playButtonLink`
- Audio: `backgroundAudio`

### 3. **All Styles in `<style>` Tag**
```html
<style>
  /* All CSS here */
</style>
```

## Child Styling
```html
<h1 data-field="title" data-field-color="titleColor">Title</h1>
<button data-field-size="buttonSize">Click</button>
<a data-field-link="ctaLink">Link</a>
```

## Checklist
- [ ] `data-field` on inputs AND preview
- [ ] Styles in `<style>` tag


**Done!** ✅

