

## 📋 Requirements for New Templates


---

## 🏗️ Required Structure

### HTML Structure (Copy This Exactly)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template [NUMBER] - [Template Name]</title>
  <style>
    /* ALL CSS GOES HERE - NO EXTERNAL FILES */
    
    .template-wrapper {
      display: flex;
      gap: 20px;
      padding: 20px;
    }
    
    .input-panel {
      flex: 1;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
    }
    
    .preview-panel {
      flex: 1;
      background: white;
      padding: 20px;
      border-radius: 8px;
      display: flex;              /* REQUIRED */
      align-items: center;        /* REQUIRED */
      justify-content: center;     /* REQUIRED */
      min-height: 400px;
    }
    
    /* Your custom styles here */
  </style>
</head>
<body>
  <div class="template-wrapper">
    <!-- LEFT: Input Controls -->
    <div class="input-panel">
      <!-- All input fields go here -->
    </div>
    
    <!-- RIGHT: Preview Content -->
    <div class="preview-panel">
      <!-- Preview content goes DIRECTLY here - NO extra wrapper divs -->
    </div>
  </div>
</body>
</html>
```

---

## 🔗 Data Binding System

### Rule: Same `data-field` = Automatic Connection

**Input (Left Panel):**
```html
<input type="text" data-field="productName" value="Premium Product">
```

**Preview (Right Panel):**
```html
<h1 data-field="productName">Premium Product</h1>
```

**Both have `data-field="productName"`** → They're automatically connected!

---

## 📝 Input Types & Examples

| Input Type | Preview Element | Example |
|------------|----------------|---------|
| **Text** | `<h1>`, `<p>`, `<span>`, etc. | `<input data-field="title">` → `<h1 data-field="title">` |
| **Textarea** | Text element | `<textarea data-field="description">` → `<p data-field="description">` |
| **Color** | Element with color | `<input type="color" data-field="bgColor">` → `<div data-field="bgColor">` |
| **Image** | `<img>` tag | `<input type="file" data-field="image">` → `<img data-field="image">` |
| **Audio** | Hidden (for video) | `<input type="file" data-field="audio" accept="audio/*">` |

---

## ✅ Critical Rules

### MUST DO:
1. ✅ Preview content goes **DIRECTLY** inside `.preview-panel` (no extra wrapper divs)
2. ✅ Every input **MUST** have `data-field="[name]"` attribute
3. ✅ Every preview element **MUST** have matching `data-field="[name]"` attribute
4. ✅ `.preview-panel` **MUST** have: `display: flex; align-items: center; justify-content: center;`
5. ✅ All CSS in `<style>` tag (no external CSS files)
6. ✅ Use descriptive `data-field` names (e.g., `productName`, `buttonText`, `bgColor`)

### MUST NOT:
1. ❌ No extra wrapper divs around preview content
2. ❌ No custom JavaScript (system handles everything)
3. ❌ No external files (CSS/JS/images)
4. ❌ Don't skip `data-field` attributes

---

## 🎯 Template Checklist

Before finishing, verify:

- [ ] Complete HTML5 document (`<!DOCTYPE html>`)
- [ ] `.template-wrapper` → `.input-panel` + `.preview-panel`
- [ ] `.preview-panel` has `display: flex; align-items: center; justify-content: center;`
- [ ] All inputs have `data-field` attributes
- [ ] All preview elements have matching `data-field` attributes
- [ ] Preview content directly inside `.preview-panel` (no extra wrappers)
- [ ] All CSS in `<style>` tag
- [ ] No JavaScript
- [ ] No external files

---

## 📄 Complete Example Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template 4 - Product Card</title>
  <style>
    .template-wrapper {
      display: flex;
      gap: 20px;
      padding: 20px;
    }
    
    .input-panel {
      flex: 1;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
    }
    
    .input-group {
      margin-bottom: 20px;
    }
    
    .input-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .input-group input {
      width: 100%;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 6px;
    }
    
    .preview-panel {
      flex: 1;
      background: white;
      padding: 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
    
    .product-card {
      width: 300px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      text-align: center;
    }
    
    .product-card img {
      width: 100%;
      height: auto;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="template-wrapper">
    <div class="input-panel">
      <h2>Edit Content</h2>
      
      <div class="input-group">
        <label>Product Name</label>
        <input type="text" data-field="productName" value="Premium Product">
      </div>
      
      <div class="input-group">
        <label>Price</label>
        <input type="text" data-field="price" value="$99.99">
      </div>
      
      <div class="input-group">
        <label>Image</label>
        <input type="file" data-field="image" accept="image/*">
      </div>
    </div>
    
    <div class="preview-panel">
      <div class="product-card">
        <h1 data-field="productName">Premium Product</h1>
        <p data-field="price">$99.99</p>
        <img src="https://via.placeholder.com/200" data-field="image" alt="Product">
      </div>
    </div>
  </div>
</body>
</html>
```

---



**Remember:**
- Same `data-field` value = automatic binding
- Preview content directly in `.preview-panel`
- No JavaScript needed
- No external files

---

## 💡 For AI: Prompt Template

When creating templates, follow this structure and ensure:
- Two-panel layout (input-panel left, preview-panel right)
- All inputs have `data-field` attributes
- All preview elements have matching `data-field` attributes
- Preview content directly inside `.preview-panel` (no extra wrappers)
- Complete HTML5 document with CSS in `<style>` tag
- No JavaScript, no external files

That's it! 🎉
