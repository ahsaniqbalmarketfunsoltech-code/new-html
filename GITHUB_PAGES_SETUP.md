# How to Upload to GitHub Pages - Step by Step Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create a New GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `html-ad-template-engine` (or any name you like)
   - **Description**: "HTML Ad Template Engine - Multi-language ad generator"
   - **Visibility**: ✅ **Public** (required for free GitHub Pages)
   - ❌ **DO NOT** check "Initialize with README" (you already have files)
4. Click **"Create repository"**

### Step 2: Upload Your Files

#### Option A: Using GitHub Web Interface (Easiest)

1. On your new repository page, click **"uploading an existing file"**
2. Drag and drop ALL these files/folders:
   ```
   ✅ index.html
   ✅ README.md
   ✅ TEMPLATE_SOP.md
   ✅ js/ (entire folder)
   ✅ templates/ (entire folder)
   ✅ assets/ (entire folder - even if empty)
   ```
3. Scroll down and click **"Commit changes"**
4. Wait for upload to complete

#### Option B: Using Git Command Line (Advanced)

```bash
# Navigate to your project folder
cd "C:\Users\ahsan iqbal\Desktop\HTML ads\HTML ads Bank -  github"

# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - HTML Ad Template Engine"

# Add your GitHub repository (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** tab (top menu)
3. Scroll down to **"Pages"** section (left sidebar)
4. Under **"Source"**, select:
   - **Branch**: `main` (or `master`)
   - **Folder**: `/ (root)`
5. Click **"Save"**
6. Wait 1-2 minutes for GitHub to build your site

### Step 4: Access Your Live Site

Your site will be live at:
```
https://YOUR_USERNAME.github.io/REPO_NAME/
```

**Example:**
- Username: `john`
- Repository: `html-ad-template-engine`
- URL: `https://john.github.io/html-ad-template-engine/`

## 📝 Important Notes

### ✅ What Gets Uploaded

Make sure these files/folders are uploaded:
```
✅ index.html
✅ README.md
✅ TEMPLATE_SOP.md
✅ js/
   ✅ engine.js
   ✅ functions.js
✅ templates/
   ✅ template1.html
   ✅ template2.html
   ✅ template3.html
✅ assets/ (can be empty)
```

### ⚠️ Common Issues

**Issue: Templates not loading**
- ✅ Make sure `templates/` folder is uploaded
- ✅ Check file names: `template1.html`, `template2.html`, etc.
- ✅ Verify files are in `/templates/` folder (not root)

**Issue: JavaScript errors**
- ✅ Make sure `js/` folder is uploaded
- ✅ Check browser console for errors
- ✅ Verify file paths: `js/engine.js`, `js/functions.js`

**Issue: Site shows 404**
- ✅ Wait 2-3 minutes after enabling Pages
- ✅ Check repository is **Public** (not Private)
- ✅ Verify Pages is enabled in Settings → Pages

**Issue: Changes not showing**
- ✅ Clear browser cache (Ctrl+F5)
- ✅ Wait 1-2 minutes for GitHub to rebuild
- ✅ Check if files were actually committed

## 🔄 Updating Your Site

### Using Web Interface:
1. Go to your repository
2. Click the file you want to edit
3. Click **"Edit"** (pencil icon)
4. Make changes
5. Click **"Commit changes"**
6. Wait 1-2 minutes for site to update

### Using Git Command Line:
```bash
# Make your changes to files
git add .
git commit -m "Updated templates"
git push
```

## 🎯 Quick Checklist

- [ ] Created GitHub repository (Public)
- [ ] Uploaded all files (index.html, js/, templates/, etc.)
- [ ] Enabled GitHub Pages (Settings → Pages)
- [ ] Selected branch: `main` and folder: `/ (root)`
- [ ] Waited 2-3 minutes for site to build
- [ ] Tested live URL: `https://YOUR_USERNAME.github.io/REPO_NAME/`

## 💡 Pro Tips

1. **Custom Domain**: You can use your own domain in Pages settings
2. **HTTPS**: GitHub Pages automatically provides HTTPS
3. **Free Forever**: GitHub Pages is free for public repositories
4. **Auto-Updates**: Every time you push changes, site updates automatically
5. **Private Repos**: Need private? GitHub Pages works with private repos on paid plans

## 🆘 Need Help?

- GitHub Pages Docs: https://docs.github.com/en/pages
- GitHub Support: https://support.github.com

---

**Your site will be live in ~5 minutes!** 🎉

