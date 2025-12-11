/**
 * Export Functions - Handles translation, image/video generation, and ZIP creation
 * All export functionality is centralized here
 * Converted from Google Apps Script to pure static web app
 * Uses LibreTranslate API for translations (free, no API key required)
 */

var ExportFunctions = {
  ffmpeg: null,
  ffmpegLoaded: false,
  
  /**
   * Initialize FFmpeg (load on demand)
   */
  initFFmpeg: async function() {
    if (this.ffmpegLoaded) return;
    
    try {
      // Wait for FFmpeg script to load (check multiple possible global names)
      var FFmpegClass = null;
      var attempts = 0;
      var maxAttempts = 50; // Wait up to 5 seconds (50 * 100ms)
      
      while (!FFmpegClass && attempts < maxAttempts) {
        // Check different possible global variable names for UMD build
        // The UMD build for @ffmpeg/ffmpeg 0.12.x exposes it as window.FFmpeg.FFmpeg
        if (typeof window !== 'undefined') {
          // Try window.FFmpeg.FFmpeg first (most common for UMD)
          if (window.FFmpeg) {
            if (window.FFmpeg.FFmpeg && typeof window.FFmpeg.FFmpeg === 'function') {
              FFmpegClass = window.FFmpeg.FFmpeg;
            } else if (typeof window.FFmpeg === 'function') {
              FFmpegClass = window.FFmpeg;
            } else if (window.FFmpeg.default && typeof window.FFmpeg.default === 'function') {
              FFmpegClass = window.FFmpeg.default;
            }
          }
          // Try FFmpegWASM namespace
          if (!FFmpegClass && window.FFmpegWASM && window.FFmpegWASM.FFmpeg) {
            FFmpegClass = window.FFmpegWASM.FFmpeg;
          }
        }
        
        // Also check global scope (non-window)
        if (!FFmpegClass && typeof FFmpeg !== 'undefined') {
          if (FFmpeg.FFmpeg && typeof FFmpeg.FFmpeg === 'function') {
            FFmpegClass = FFmpeg.FFmpeg;
          } else if (typeof FFmpeg === 'function') {
            FFmpegClass = FFmpeg;
          } else if (FFmpeg.default && typeof FFmpeg.default === 'function') {
            FFmpegClass = FFmpeg.default;
          }
        }
        
        if (!FFmpegClass) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      
      if (!FFmpegClass) {
        // Log what globals are available for debugging
        var ffmpegRelated = Object.keys(window || {}).filter(function(k) {
          return k.toLowerCase().includes('ffmpeg');
        });
        console.error('FFmpeg not found. Available FFmpeg-related globals:', ffmpegRelated);
        console.error('Checking window.FFmpeg:', typeof window !== 'undefined' ? typeof window.FFmpeg : 'window undefined');
        console.error('Checking global FFmpeg:', typeof FFmpeg);
        throw new Error('FFmpeg library not loaded. Please ensure:\n1. Your browser supports WebAssembly\n2. The script loaded correctly\n3. Try refreshing the page');
      }
      
      console.log('Found FFmpeg class:', FFmpegClass);
      
      // Create FFmpeg instance
      this.ffmpeg = new FFmpegClass();
      
      // Configure FFmpeg to use jsDelivr CDN (better CORS support)
      // Also set worker path to avoid CORS issues
      var ffmpegConfig = {
        coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      };
      
      // Try to set worker path if available (some versions support this)
      if (this.ffmpeg.setWorkerPath) {
        try {
          this.ffmpeg.setWorkerPath('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/');
        } catch (e) {
          console.warn('Could not set worker path:', e);
        }
      }
      
      // Load FFmpeg core
      await this.ffmpeg.load(ffmpegConfig);
      
      this.ffmpegLoaded = true;
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        ffmpegAvailable: typeof FFmpeg !== 'undefined',
        windowFFmpegAvailable: typeof window !== 'undefined' && typeof window.FFmpeg !== 'undefined'
      });
      
      // Check if it's a CORS/Worker error
      var errorMsg = error.message || '';
      if (errorMsg.includes('Worker') || errorMsg.includes('CORS') || errorMsg.includes('Cross-Origin') || errorMsg.includes('cannot be accessed from origin')) {
        var detailedError = '⚠️ CORS/Worker Error Detected\n\n' +
                           'FFmpeg.wasm requires Web Workers with special CORS headers.\n\n' +
                           'Solutions:\n' +
                           '1. Use MediaRecorder API instead (already implemented)\n' +
                           '2. Host on GitHub Pages (which supports CORS)\n' +
                           '3. Use the image export feature instead\n\n' +
                           'Original error: ' + errorMsg;
        alert(detailedError);
        throw new Error('CORS/Worker limitation: ' + errorMsg);
      }
      
      alert('Error loading video processing library: ' + error.message + '\n\nPlease refresh the page and ensure your browser supports WebAssembly.');
      throw error;
    }
  },
  
  /**
   * Translate text using LibreTranslate API (free, no API key required)
   * Uses multiple LibreTranslate public instances for reliability
   */
  translateText: async function(text, targetLang, sourceLang) {
    try {
      // Skip translation if source and target are the same
      if (sourceLang === targetLang) {
        return text;
      }
      
      // Skip empty text
      if (!text || text.trim() === '') {
        return text;
      }
      
      // Ensure sourceLang is set (use selected source language)
      if (!sourceLang) {
        sourceLang = TemplateEngine.getSourceLanguage();
      }
      
      console.log('Translating: "' + text + '" from ' + sourceLang + ' to ' + targetLang);
      
      // Use Google Translate web API (works reliably from browser without CORS issues)
      // This is the unofficial API that Google Translate web interface uses
      try {
        // Google Translate web API endpoint - works without CORS restrictions
        var googleTranslateUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + 
                                  encodeURIComponent(sourceLang || 'en') + 
                                  '&tl=' + encodeURIComponent(targetLang) + 
                                  '&dt=t&q=' + encodeURIComponent(text);
        
        var response = await fetch(googleTranslateUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          var result = await response.json();
          
          // Google Translate returns: [[["translated text",...],...],...]
          if (result && result[0] && result[0][0] && result[0][0][0]) {
            var translated = result[0][0][0].trim();
            
            // Clean up the translation
            translated = translated.replace(/^["']+|["']+$/g, '').trim();
            
            if (translated !== text && translated.trim() !== '' && translated.length > 0) {
              console.log('✓ Translation successful (Google Translate): "' + text + '" -> "' + translated + '"');
              return translated;
            } else {
              console.warn('Translation returned same/empty text');
            }
          } else {
            console.warn('Unexpected Google Translate response format:', result);
          }
        } else {
          console.warn('Google Translate returned status:', response.status);
        }
      } catch (error) {
        console.warn('Google Translate failed:', error.message);
      }
      
      // Fallback: Try LibreTranslate with CORS proxy (if Google fails)
      try {
        console.log('Trying LibreTranslate via CORS proxy as fallback...');
        
        var libretranslateEndpoint = 'https://libretranslate.com/translate';
        var corsProxy = 'https://api.allorigins.win/raw?url=';
        var fullUrl = corsProxy + encodeURIComponent(libretranslateEndpoint);
        
        var payload = {
          q: text,
          source: sourceLang || 'en',
          target: targetLang,
          format: 'text'
        };
        
        var response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          var result = await response.json();
          
          if (result.translatedText) {
            var translated = result.translatedText.trim();
            translated = translated.replace(/^["']+|["']+$/g, '').trim();
            
            if (translated !== text && translated.trim() !== '' && translated.length > 0) {
              console.log('✓ Translation successful (LibreTranslate via proxy): "' + text + '" -> "' + translated + '"');
              return translated;
            }
          }
        }
      } catch (error) {
        console.warn('LibreTranslate fallback failed:', error.message);
      }
      
      // If all methods failed, return original text
      console.error('⚠️ All translation methods failed. Returning original text.');
      return text;
      
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original on error
    }
  },
  
  /**
   * Translate all text fields in template
   * Translates ALL custom text fields - ensures nothing is skipped
   */
  translateTemplate: async function(targetLang, sourceLang) {
    var fieldValues = TemplateEngine.getFieldValues();
    var translated = {};
    var translationErrors = [];
    var translationWarnings = [];
    
    // Ensure sourceLang is set (use selected source language)
    if (!sourceLang) {
      sourceLang = TemplateEngine.getSourceLanguage();
    }
    
    console.log('Starting translation from ' + sourceLang + ' to ' + targetLang);
    console.log('Source language:', sourceLang);
    console.log('Target language:', targetLang);
    console.log('Field values to translate:', fieldValues);
    
    for (var field in fieldValues) {
      var value = fieldValues[field];
      
      // Translate ALL text content
      // Only skip: data URLs, blob URLs, HTTP URLs, and empty strings
      var shouldTranslate = typeof value === 'string' && 
                            value.trim() !== '' && 
                            !value.startsWith('data:') && 
                            !value.startsWith('http://') &&
                            !value.startsWith('https://') &&
                            !value.startsWith('blob:');
      
      if (shouldTranslate) {
        try {
          console.log('Translating field "' + field + '": "' + value + '"');
          
          // Clean the text before translation (remove extra whitespace but keep content)
          var cleanText = value.trim();
          
          // Translate the text
          var translatedValue = await this.translateText(cleanText, targetLang, sourceLang);
          
          // Check if translation actually changed
          if (translatedValue === cleanText || translatedValue === value) {
            translationWarnings.push('Field "' + field + '" was not translated (same as original)');
            console.warn('⚠️ Warning: Translation for "' + field + '" returned same text: "' + value + '"');
            // Still use translated value (might be same for some languages)
            translated[field] = translatedValue;
          } else {
            console.log('✓ Successfully translated: "' + value + '" -> "' + translatedValue + '"');
            translated[field] = translatedValue;
          }
          
          // Delay between translations to avoid rate limiting (increased delay)
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.error('❌ Translation error for field ' + field + ':', error);
          translationErrors.push('Field "' + field + '": ' + error.message);
          translated[field] = value; // Use original on error
        }
      } else {
        // Keep non-text content as-is (images, videos, URLs, empty)
        translated[field] = value;
        if (value && typeof value === 'string') {
          console.log('Skipping translation for field "' + field + '" (non-text content):', value.substring(0, 50));
        }
      }
    }
    
    // Log warnings and errors
    if (translationWarnings.length > 0) {
      console.warn('Translation warnings:', translationWarnings);
    }
    if (translationErrors.length > 0) {
      console.error('Translation errors:', translationErrors);
    }
    
    console.log('Translation complete. Translated fields:', Object.keys(translated).length);
    
    // Show alert if many translations failed
    var textFieldsCount = Object.keys(fieldValues).filter(function(field) {
      var val = fieldValues[field];
      return typeof val === 'string' && val.trim() !== '' && 
             !val.startsWith('data:') && !val.startsWith('http') && !val.startsWith('blob:');
    }).length;
    
    if (translationWarnings.length > 0 && translationWarnings.length === textFieldsCount) {
      alert('Warning: Translations may not be working. All text fields returned unchanged. Check browser console for details.');
    }
    
    return translated;
  },

  /**
   * Intelligently scale image using fallback scaling (no Gemini AI)
   * Centers 320×480 ad and fills remaining space with blurred background
   */
  intelligentlyScaleImage: async function(sourceCanvas, targetWidth, targetHeight) {
    try {
      // Use fallback scaling (no AI analysis needed)
      return this.fallbackScaleImage(sourceCanvas, targetWidth, targetHeight);
    } catch (error) {
      console.error('Error in intelligent scaling:', error);
      // Fallback to standard scaling
      return this.fallbackScaleImage(sourceCanvas, targetWidth, targetHeight);
    }
  },
  
  /**
   * Detect dominant background color from image edges
   */
  detectDominantBackgroundColor: function(canvas) {
    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pixels = imageData.data;
    
    // Sample pixels from all four edges
    var edgePixels = [];
    var width = canvas.width;
    var height = canvas.height;
    var sampleStep = 4; // Sample every 4th pixel for performance
    
    // Top edge
    for (var x = 0; x < width; x += sampleStep) {
      var idx = (0 * width + x) * 4;
      edgePixels.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }
    
    // Bottom edge
    for (var x = 0; x < width; x += sampleStep) {
      var idx = ((height - 1) * width + x) * 4;
      edgePixels.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }
    
    // Left edge
    for (var y = 0; y < height; y += sampleStep) {
      var idx = (y * width + 0) * 4;
      edgePixels.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }
    
    // Right edge
    for (var y = 0; y < height; y += sampleStep) {
      var idx = (y * width + (width - 1)) * 4;
      edgePixels.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }
    
    // Calculate average color
    var totalR = 0, totalG = 0, totalB = 0;
    edgePixels.forEach(function(pixel) {
      totalR += pixel.r;
      totalG += pixel.g;
      totalB += pixel.b;
    });
    
    var avgR = Math.round(totalR / edgePixels.length);
    var avgG = Math.round(totalG / edgePixels.length);
    var avgB = Math.round(totalB / edgePixels.length);
    
    return 'rgb(' + avgR + ',' + avgG + ',' + avgB + ')';
  },
  
  /**
   * Create blurred background from the ad image itself
   * Colors match perfectly because it's the same image, just blurred
   * @param {HTMLCanvasElement} sourceCanvas - Source image canvas
   * @param {number} targetWidth - Target width
   * @param {number} targetHeight - Target height
   * @param {number} blurIntensity - Blur intensity (1-15, default 8)
   */
  createBlurredAdBackground: function(sourceCanvas, targetWidth, targetHeight, blurIntensity) {
    // Default blur intensity if not provided
    blurIntensity = blurIntensity || 8;
    
    // Significantly increase blur intensity for exports (multiply by 2.5x for much stronger blur)
    var enhancedBlurIntensity = blurIntensity * 2.5;
    
    // Create background canvas
    var bgCanvas = document.createElement('canvas');
    bgCanvas.width = targetWidth;
    bgCanvas.height = targetHeight;
    var bgCtx = bgCanvas.getContext('2d');
    
    // Step 1: Scale ad image to fill entire frame (for blur effect)
    var scale = Math.max(targetWidth / sourceCanvas.width, targetHeight / sourceCanvas.height);
    var scaledWidth = sourceCanvas.width * scale;
    var scaledHeight = sourceCanvas.height * scale;
    var x = (targetWidth - scaledWidth) / 2;
    var y = (targetHeight - scaledHeight) / 2;
    
    // Step 2: Draw scaled image (will be blurred)
    bgCtx.imageSmoothingEnabled = true;
    bgCtx.imageSmoothingQuality = 'low'; // Lower quality creates initial blur
    bgCtx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
    
    // Step 3: Apply blur effect using downscaling technique
    // This creates a natural, smooth blur that preserves colors
    // Higher blurIntensity = more blur (more downscaling)
    // Significantly increased blur factor multiplier for much stronger blur effect
    var blurFactor = Math.max(4, Math.min(enhancedBlurIntensity * 1.5, 50)); // Much stronger multiplier and higher max
    
    // Downscale significantly (more aggressive downscaling for stronger blur)
    var blurCanvas = document.createElement('canvas');
    blurCanvas.width = Math.max(1, Math.floor(targetWidth / blurFactor));
    blurCanvas.height = Math.max(1, Math.floor(targetHeight / blurFactor));
    var blurCtx = blurCanvas.getContext('2d');
    
    blurCtx.imageSmoothingEnabled = true;
    blurCtx.imageSmoothingQuality = 'low';
    blurCtx.drawImage(bgCanvas, 0, 0, blurCanvas.width, blurCanvas.height);
    
    // Step 4: Scale back up with low-quality smoothing (enhances blur)
    bgCtx.fillStyle = '#ffffff'; // White fallback
    bgCtx.fillRect(0, 0, targetWidth, targetHeight);
    bgCtx.imageSmoothingEnabled = true;
    bgCtx.imageSmoothingQuality = 'low';
    bgCtx.drawImage(blurCanvas, 0, 0, targetWidth, targetHeight);
    
    // Step 5: Apply additional blur pass for smoother effect (increased passes)
    var blurCanvas2 = document.createElement('canvas');
    blurCanvas2.width = Math.max(1, Math.floor(targetWidth / (blurFactor + 3)));
    blurCanvas2.height = Math.max(1, Math.floor(targetHeight / (blurFactor + 3)));
    var blurCtx2 = blurCanvas2.getContext('2d');
    
    blurCtx2.imageSmoothingEnabled = true;
    blurCtx2.imageSmoothingQuality = 'low';
    blurCtx2.drawImage(bgCanvas, 0, 0, blurCanvas2.width, blurCanvas2.height);
    
    bgCtx.imageSmoothingEnabled = true;
    bgCtx.imageSmoothingQuality = 'low';
    bgCtx.drawImage(blurCanvas2, 0, 0, targetWidth, targetHeight);
    
    // Step 6: Apply third blur pass for even stronger blur effect
    var blurCanvas3 = document.createElement('canvas');
    blurCanvas3.width = Math.max(1, Math.floor(targetWidth / (blurFactor + 5)));
    blurCanvas3.height = Math.max(1, Math.floor(targetHeight / (blurFactor + 5)));
    var blurCtx3 = blurCanvas3.getContext('2d');
    
    blurCtx3.imageSmoothingEnabled = true;
    blurCtx3.imageSmoothingQuality = 'low';
    blurCtx3.drawImage(bgCanvas, 0, 0, blurCanvas3.width, blurCanvas3.height);
    
    bgCtx.imageSmoothingEnabled = true;
    bgCtx.imageSmoothingQuality = 'low';
    bgCtx.drawImage(blurCanvas3, 0, 0, targetWidth, targetHeight);
    
    // Step 7: Apply fourth blur pass for maximum blur effect
    var blurCanvas4 = document.createElement('canvas');
    blurCanvas4.width = Math.max(1, Math.floor(targetWidth / (blurFactor + 7)));
    blurCanvas4.height = Math.max(1, Math.floor(targetHeight / (blurFactor + 7)));
    var blurCtx4 = blurCanvas4.getContext('2d');
    
    blurCtx4.imageSmoothingEnabled = true;
    blurCtx4.imageSmoothingQuality = 'low';
    blurCtx4.drawImage(bgCanvas, 0, 0, blurCanvas4.width, blurCanvas4.height);
    
    bgCtx.imageSmoothingEnabled = true;
    bgCtx.imageSmoothingQuality = 'low';
    bgCtx.drawImage(blurCanvas4, 0, 0, targetWidth, targetHeight);
    
    return bgCanvas;
  },
  
  /**
   * Fallback scaling when intelligent scaling fails
   * Uses same centered + blurred ad background approach
   * IMPORTANT: Ad maintains 320×480 aspect ratio - NO STRETCHING
   */
  fallbackScaleImage: function(sourceCanvas, targetWidth, targetHeight) {
    var targetCanvas = document.createElement('canvas');
    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;
    var ctx = targetCanvas.getContext('2d');
    
    // Scale ad to fit while maintaining exact aspect ratio (centered, no stretching)
    // Math.min ensures ad fits completely and maintains 320×480 aspect ratio
    var scale = Math.min(targetWidth / sourceCanvas.width, targetHeight / sourceCanvas.height);
    var scaledWidth = sourceCanvas.width * scale;  // Maintains aspect ratio
    var scaledHeight = sourceCanvas.height * scale; // Maintains aspect ratio
    var x = (targetWidth - scaledWidth) / 2;  // Center horizontally
    var y = (targetHeight - scaledHeight) / 2; // Center vertically
    
    // Get blur intensity from UI (default 8)
    var blurIntensity = 8;
    var blurSlider = document.getElementById('blurIntensity');
    if (blurSlider) {
      blurIntensity = parseInt(blurSlider.value) || 8;
    }
    
    // Create blurred background from ad image
    var blurredBgCanvas = this.createBlurredAdBackground(sourceCanvas, targetWidth, targetHeight, blurIntensity);
    ctx.drawImage(blurredBgCanvas, 0, 0);
    
    // Draw sharp centered ad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
    
    return targetCanvas;
  },

  /**
   * Render template HTML to canvas using html2canvas, then intelligently scale
   */
  renderToCanvas: function(htmlContent, width, height) {
    return new Promise(function(resolve, reject) {
      // Create a temporary container
      var container = document.createElement('div');
      container.style.width = '320px';
      container.style.height = '480px';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.overflow = 'hidden';
      container.style.backgroundColor = '#ffffff';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);
      
      // Use html2canvas to render at original 320×480 size
      if (typeof html2canvas !== 'undefined') {
        html2canvas(container, {
          width: 320,
          height: 480,
          scale: 2, // Higher scale for better quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        }).then(function(canvas) {
          document.body.removeChild(container);
          
          // Intelligently scale to target size
          if (width !== 320 || height !== 480) {
            ExportFunctions.intelligentlyScaleImage(canvas, width, height)
              .then(resolve)
              .catch(function(error) {
                console.error('Intelligent scaling failed, using fallback:', error);
                resolve(ExportFunctions.fallbackScaleImage(canvas, width, height));
              });
          } else {
            resolve(canvas);
          }
        }).catch(function(error) {
          document.body.removeChild(container);
          reject(error);
        });
      } else {
        // Fallback: create a simple canvas with text
        var canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 480;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 320, 480);
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.fillText('Rendering...', 10, 30);
        document.body.removeChild(container);
        
        if (width !== 320 || height !== 480) {
          ExportFunctions.intelligentlyScaleImage(canvas, width, height)
            .then(resolve)
            .catch(function(error) {
              resolve(ExportFunctions.fallbackScaleImage(canvas, width, height));
            });
        } else {
          resolve(canvas);
        }
      }
    });
  },
  
  /**
   * Get rendered template HTML with translated content
   * Returns complete HTML document with styles matching preview exactly
   */
  getRenderedHTML: function(translatedData) {
    var container = document.getElementById('templateContainer');
    if (!container) return '';
    
    var previewPanel = container.querySelector('.preview-panel');
    
    if (!previewPanel) {
      previewPanel = container;
    }
    
    // Clone the preview panel
    var clone = previewPanel.cloneNode(true);
    
    // Update all data-field elements with translated data
    Object.keys(translatedData).forEach(function(fieldName) {
      var value = translatedData[fieldName];
      
      // Skip if value is a file path
      if (typeof value === 'string' && (value.includes('fakepath') || value.includes('C:\\') || value.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp)$/i))) {
        return; // Skip file paths
      }
      
      // Find elements with matching data-field
      var elements = clone.querySelectorAll('[data-field="' + fieldName + '"]');
      
      // Also find elements with data-field-* attributes (for child element targeting)
      // Handle data-field-color, data-field-size, data-field-top, data-field-right, data-field-height, data-field-link
      var attrSelectors = [
        '[data-field-color="' + fieldName + '"]',
        '[data-field-size="' + fieldName + '"]',
        '[data-field-top="' + fieldName + '"]',
        '[data-field-right="' + fieldName + '"]',
        '[data-field-height="' + fieldName + '"]',
        '[data-field-link="' + fieldName + '"]'
      ];
      
      // Handle link fields specially
      if (fieldName.includes('Link') || fieldName.includes('link') || fieldName === 'playButtonLink') {
        var linkElements = clone.querySelectorAll('[data-field-link="' + fieldName + '"], a[data-field="' + fieldName + '"]');
        linkElements.forEach(function(element) {
          if (element.tagName === 'A') {
            element.href = value || '#';
            element.setAttribute('data-field-link', fieldName);
            // Update onclick handler with new link
            element.setAttribute('onclick', 'event.preventDefault(); var link = this.getAttribute(\'href\'); if(link && link !== \'#\' && link !== \'https://example.com\') window.open(link, \'_blank\'); return false;');
          }
        });
        return; // Skip other processing for link fields
      }
      
      var childElements = [];
      attrSelectors.forEach(function(selector) {
        try {
          var found = clone.querySelectorAll(selector);
          found.forEach(function(el) { 
            if (childElements.indexOf(el) === -1) childElements.push(el); 
          });
        } catch(e) {
          // Invalid selector, skip
        }
      });
      
      // Combine both sets
      var allElements = [];
      elements.forEach(function(el) { 
        if (allElements.indexOf(el) === -1) allElements.push(el); 
      });
      childElements.forEach(function(el) { 
        if (allElements.indexOf(el) === -1) allElements.push(el); 
      });
      
      allElements.forEach(function(element) {
        if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA' && element.tagName !== 'SELECT') {
          // Use FieldHandler for consistent behavior
          FieldHandler.updatePreview(fieldName, value, element);
        }
      });
    });
    
    // Remove red remove button from exported HTML (only show in preview)
    var removeBtn = clone.querySelector('#removeThumbnailPreviewBtn');
    if (removeBtn) {
      removeBtn.remove();
    }
    
    // Forward/Backward buttons are non-clickable (display only) - remove onclick handlers
    var rewindBtn = clone.querySelector('#rewindBtn');
    var forwardBtn = clone.querySelector('#forwardBtn');
    if (rewindBtn) {
      rewindBtn.removeAttribute('onclick');
      rewindBtn.style.pointerEvents = 'none';
      rewindBtn.style.cursor = 'default';
    }
    if (forwardBtn) {
      forwardBtn.removeAttribute('onclick');
      forwardBtn.style.pointerEvents = 'none';
      forwardBtn.style.cursor = 'default';
    }
    
    // CRITICAL: Ensure footer is never removed or hidden
    var footer = clone.querySelector('.ad-footer');
    if (footer) {
      footer.style.display = 'block';
      footer.style.visibility = 'visible';
      footer.style.opacity = '1';
    }
    var footerText = clone.querySelector('.footer-text');
    if (footerText) {
      footerText.style.display = 'block';
      footerText.style.visibility = 'visible';
      footerText.style.opacity = '1';
    }
    
    // Remove any file path text overlays, hex codes, and numeric text from the clone
    var allTextElements = clone.querySelectorAll('*');
    allTextElements.forEach(function(el) {
      // NEVER hide footer elements
      if (el.classList.contains('ad-footer') || el.classList.contains('footer-text') || el.closest('.ad-footer')) {
        return; // Skip footer elements
      }
      
      var text = el.textContent || '';
      
      // Remove file paths
      if (text.includes('fakepath') || text.includes('C:\\') || text.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp)$/i)) {
        // Only hide if it's not a data-field element with actual content
        if (!el.hasAttribute('data-field') || el.getAttribute('data-field') === 'thumbnail') {
          el.style.display = 'none';
          el.textContent = '';
        }
      }
      
      // Remove hex color codes
      if (text.match(/^#[0-9a-fA-F]{3,6}$/) && el.tagName !== 'INPUT' && el.tagName !== 'LABEL') {
        var dataField = el.getAttribute('data-field');
        if (dataField && (dataField.includes('Bg') || dataField.includes('Color'))) {
          el.textContent = '';
          el.innerHTML = '';
        } else if (!dataField) {
          el.style.display = 'none';
          el.textContent = '';
        }
      }
      
      // Remove pure numeric text from container elements (like "320" from width)
      if (text.trim().match(/^\d+$/) && el.tagName !== 'INPUT' && el.tagName !== 'LABEL' && el.children.length > 0) {
        var dataField = el.getAttribute('data-field');
        if (dataField && (dataField.includes('Width') || dataField.includes('Height'))) {
          // Remove text nodes that are pure numbers
          var textNodes = [];
          for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3) { // Text node
              textNodes.push(el.childNodes[i]);
            }
          }
          textNodes.forEach(function(node) {
            if (node.textContent.trim().match(/^\d+$/)) {
              node.remove();
            }
          });
        }
      }
    });
    
    // Final check: Ensure footer is visible
    if (footer) {
      footer.style.display = 'block';
      footer.style.visibility = 'visible';
      footer.style.opacity = '1';
    }
    if (footerText) {
      footerText.style.display = 'block';
      footerText.style.visibility = 'visible';
      footerText.style.opacity = '1';
    }
    
    // Extract all CSS styles from the template container
    var styles = '';
    
    // Method 1: Get styles from style elements in the container
    var styleElements = container.querySelectorAll('style');
    styleElements.forEach(function(styleEl) {
      if (styleEl.textContent) {
        styles += styleEl.textContent + '\n';
      }
    });
    
    // Method 2: Extract styles from the container's innerHTML (for dynamically loaded templates)
    var containerHTML = container.innerHTML;
    var styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    var styleMatch;
    while ((styleMatch = styleRegex.exec(containerHTML)) !== null) {
      if (styleMatch[1] && styleMatch[1].trim()) {
        var styleContent = styleMatch[1].trim();
        // Avoid duplicates
        if (styles.indexOf(styleContent) === -1) {
          styles += styleContent + '\n';
        }
      }
    }
    
    // Method 3: Get computed styles from preview elements (fallback)
    if (!styles || styles.trim().length === 0) {
      console.warn('No styles found in template, using default styles');
      // Add minimal default styles to ensure content displays
      styles = '* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: Arial, sans-serif; }';
    }
    
    // Get the preview content HTML - preserve exact structure from preview
    // The clone already has the preview-panel structure, so we get its innerHTML
    // which contains the actual ad content (ad-container, banner-ad, etc.)
    var previewContent = clone.innerHTML;
    
    // Create complete HTML document exactly 320×480 size, centered on page
    // Include all template styles and preserve the preview-panel structure
    var fullHTML = '<!DOCTYPE html>\n' +
      '<html lang="en">\n' +
      '<head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=320, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n' +
      '  <title>Exported Ad Template</title>\n' +
      '  <style>\n' +
      '    * {\n' +
      '      margin: 0;\n' +
      '      padding: 0;\n' +
      '      box-sizing: border-box;\n' +
      '    }\n' +
      '    html, body {\n' +
      '      width: 100%;\n' +
      '      height: 100vh;\n' +
      '      margin: 0;\n' +
      '      padding: 0;\n' +
      '      overflow: hidden;\n' +
      '      font-family: Arial, sans-serif;\n' +
      '      background: white;\n' +
      '      display: flex;\n' +
      '      align-items: center;\n' +
      '      justify-content: center;\n' +
      '    }\n' +
      '    .preview-panel {\n' +
      '      width: 320px;\n' +
      '      height: 480px;\n' +
      '      background: white;\n' +
      '      padding: 0;\n' +
      '      border-radius: 0;\n' +
      '      box-shadow: none;\n' +
      '      display: flex;\n' +
      '      align-items: center;\n' +
      '      justify-content: center;\n' +
      '      overflow: hidden;\n' +
      '      position: relative;\n' +
      '    }\n' +
      '    .video-ad-container {\n' +
      '      width: 320px !important;\n' +
      '      height: 480px !important;\n' +
      '      max-width: 320px !important;\n' +
      '      max-height: 480px !important;\n' +
      '      min-width: 320px !important;\n' +
      '      min-height: 480px !important;\n' +
      '      display: flex !important;\n' +
      '      flex-direction: column !important;\n' +
      '      overflow: hidden !important;\n' +
      '    }\n' +
      '    .ad-header, .ad-subtitle, .ad-footer {\n' +
      '      flex-shrink: 0 !important;\n' +
      '      flex-grow: 0 !important;\n' +
      '    }\n' +
      '    .video-section {\n' +
      '      flex: 1 1 0 !important;\n' +
      '      min-height: 0 !important;\n' +
      '      overflow: hidden !important;\n' +
      '    }\n' +
      '    .ad-footer {\n' +
      '      display: block !important;\n' +
      '      visibility: visible !important;\n' +
      '      opacity: 1 !important;\n' +
      '      flex-shrink: 0 !important;\n' +
      '      flex-grow: 0 !important;\n' +
      '      min-height: fit-content !important;\n' +
      '    }\n' +
      '    .footer-text {\n' +
      '      display: block !important;\n' +
      '      visibility: visible !important;\n' +
      '      opacity: 1 !important;\n' +
      '    }\n' +
      '    .control-btn-icon {\n' +
      '      display: none !important;\n' +
      '    }\n' +
      '    .control-btn {\n' +
      '      pointer-events: none !important;\n' +
      '      cursor: default !important;\n' +
      '    }\n' +
      '    #removeThumbnailPreviewBtn {\n' +
      '      display: none !important;\n' +
      '    }\n' +
      styles + '\n' +
      '  </style>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <div class="preview-panel">\n' +
      previewContent + '\n' +
      '  </div>\n' +
      '</body>\n' +
      '</html>';
    
    return fullHTML;
  },
  
  /**
   * Extract all image assets from rendered HTML and convert to blobs
   */
  extractAssets: async function(htmlContent) {
    var assets = {};
    var tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    // Wait for images to load
    var images = tempDiv.querySelectorAll('img');
    var imagePromises = [];
    
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (img.complete) {
        imagePromises.push(Promise.resolve(img));
      } else {
        imagePromises.push(new Promise(function(resolve) {
          img.onload = function() { resolve(img); };
          img.onerror = function() { resolve(null); };
        }));
      }
    }
    
    await Promise.all(imagePromises);
    
    // Extract image data
    var assetIndex = 0;
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var src = img.src || img.getAttribute('src');
      
      if (src && (src.startsWith('data:image') || src.startsWith('blob:'))) {
        try {
          // Convert data URL or blob URL to blob
          var response = await fetch(src);
          var blob = await response.blob();
          
          // Only include actual image files (skip HTML, text, etc.)
          if (blob.type && blob.type.startsWith('image/')) {
            var extension = blob.type.split('/')[1] || 'png';
            var filename = 'image_' + assetIndex + '.' + extension;
            assets[filename] = blob;
            
            // Update HTML to use relative path
            img.setAttribute('src', filename);
            assetIndex++;
          } else {
            console.warn('Skipping non-image file:', blob.type, 'for image:', src.substring(0, 50));
          }
        } catch (error) {
          console.error('Error extracting image:', error);
        }
      } else if (src && src.startsWith('http')) {
        // External URL - try to fetch
        try {
          var response = await fetch(src, { mode: 'cors' });
          if (response.ok) {
            var blob = await response.blob();
            
            // Only include actual image files (skip HTML, text, etc.)
            if (blob.type && blob.type.startsWith('image/')) {
              var extension = blob.type.split('/')[1] || 'png';
              var filename = 'image_' + assetIndex + '.' + extension;
              assets[filename] = blob;
              img.setAttribute('src', filename);
              assetIndex++;
            } else {
              console.warn('Skipping non-image file:', blob.type, 'for URL:', src);
            }
          }
        } catch (error) {
          console.error('Error fetching external image:', error);
        }
      }
    }
    
    var finalHTML = tempDiv.innerHTML;
    document.body.removeChild(tempDiv);
    
    return {
      html: finalHTML,
      assets: assets
    };
  },
  
  /**
   * Convert data URL to blob
   */
  dataURLtoBlob: function(dataurl) {
    var arr = dataurl.split(',');
    var mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  },
  
  /**
   * Convert blob to data URL
   */
  blobToDataURL: function(blob) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function() {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
  
  /**
   * Extract assets from DOM element
   * IMPORTANT: Keeps images as data URLs in HTML for standalone viewing
   * Also extracts them as separate files for ZIP packaging
   */
  extractAssetsFromDOM: async function(element) {
    var assets = {};
    var assetIndex = 0;
    
    // Extract regular <img> tags
    var images = element.querySelectorAll('img');
    
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var src = img.src || img.getAttribute('src');
      
      if (src && (src.startsWith('data:image') || src.startsWith('blob:'))) {
        try {
          var response = await fetch(src);
          var blob = await response.blob();
          
          // Only include actual image files (skip HTML, text, etc.)
          if (blob.type && blob.type.startsWith('image/')) {
            var extension = blob.type.split('/')[1] || 'png';
            var filename = 'image_' + assetIndex + '.' + extension;
            
            // Store blob for ZIP file
            assets[filename] = blob;
            
            // Convert blob to data URL and keep it in HTML (for standalone viewing)
            // This prevents 404 errors when viewing HTML directly
            try {
              var dataURL = await this.blobToDataURL(blob);
              img.setAttribute('src', dataURL);
              img.src = dataURL; // Also set src property
            } catch (dataURLError) {
              // If conversion fails, use relative path (for ZIP)
              img.setAttribute('src', filename);
            }
            
            assetIndex++;
          } else {
            console.warn('Skipping non-image file:', blob.type, 'for image:', src.substring(0, 50));
          }
        } catch (error) {
          console.error('Error extracting image:', error);
          // Keep original src if extraction fails
        }
      } else if (src && src.startsWith('http')) {
        try {
          var response = await fetch(src, { mode: 'cors' });
          if (response.ok) {
            var blob = await response.blob();
            
            // Only include actual image files (skip HTML, text, etc.)
            if (blob.type && blob.type.startsWith('image/')) {
              var extension = blob.type.split('/')[1] || 'png';
              var filename = 'image_' + assetIndex + '.' + extension;
              assets[filename] = blob;
              
              // Convert to data URL for HTML
              try {
                var dataURL = await this.blobToDataURL(blob);
                img.setAttribute('src', dataURL);
                img.src = dataURL;
              } catch (dataURLError) {
                img.setAttribute('src', filename);
              }
              
              assetIndex++;
            } else {
              console.warn('Skipping non-image file:', blob.type, 'for URL:', src);
            }
          }
        } catch (error) {
          console.error('Error fetching external image:', error);
        }
      }
    }
    
    // Extract background images from elements (like video-section with thumbnail)
    var allElements = element.querySelectorAll('*');
    for (var j = 0; j < allElements.length; j++) {
      var el = allElements[j];
      var bgImage = window.getComputedStyle(el).backgroundImage;
      
      // Check if element has background-image with data URL or blob
      if (bgImage && bgImage !== 'none' && (bgImage.includes('data:image') || bgImage.includes('blob:'))) {
        try {
          // Extract URL from background-image: url("data:image/...")
          var urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (urlMatch && urlMatch[1]) {
            var bgUrl = urlMatch[1];
            
            if (bgUrl.startsWith('data:image') || bgUrl.startsWith('blob:')) {
              var response = await fetch(bgUrl);
              var blob = await response.blob();
              
              if (blob.type && blob.type.startsWith('image/')) {
                var extension = blob.type.split('/')[1] || 'png';
                var filename = 'image_' + assetIndex + '.' + extension;
                assets[filename] = blob;
                
                // Convert to data URL and keep in HTML
                try {
                  var dataURL = await this.blobToDataURL(blob);
                  el.style.backgroundImage = 'url(' + dataURL + ')';
                } catch (dataURLError) {
                  // Fallback to relative path
                  el.style.backgroundImage = 'url(' + filename + ')';
                }
                
                assetIndex++;
              }
            }
          }
        } catch (error) {
          console.error('Error extracting background image:', error);
        }
      }
    }
    
    // Remove any file path text overlays (elements showing file paths)
    var textElements = element.querySelectorAll('*');
    for (var k = 0; k < textElements.length; k++) {
      var textEl = textElements[k];
      var textContent = textEl.textContent || '';
      
      // Remove elements that show file paths (like "C:\fakepath\..." or file names)
      if (textContent.includes('fakepath') || 
          textContent.includes('C:\\') || 
          textContent.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp)$/i) ||
          (textEl.tagName === 'SPAN' && textContent.match(/\.(jpg|jpeg|png|gif|webp)$/i) && textEl.parentElement && textEl.parentElement.classList.contains('video-section'))) {
        // Check if it's not a data-field element (don't remove actual content)
        if (!textEl.hasAttribute('data-field') || textEl.getAttribute('data-field') === 'thumbnail') {
          textEl.style.display = 'none';
          textEl.textContent = '';
        }
      }
    }
    
    return {
      html: element.innerHTML,
      assets: assets
    };
  },
  
  /**
   * Calculate estimated time for ZIP generation
   */
  calculateTimeEstimate: function(languages) {
    var sourceLang = TemplateEngine.getSourceLanguage();
    var languagesToTranslate = languages.filter(function(lang) { return lang !== sourceLang; });
    
    // Time estimates (in seconds) - optimized for faster processing
    var translationTimePerLanguage = 2; // Reduced from 3 to 2 seconds
    var processingTimePerLanguage = 1.5; // Reduced from 2 to 1.5 seconds
    var zipGenerationTime = 0.5; // Reduced from 1 to 0.5 seconds
    
    var totalTime = 0;
    totalTime += languagesToTranslate.length * translationTimePerLanguage;
    totalTime += languages.length * processingTimePerLanguage;
    totalTime += languages.length * zipGenerationTime;
    totalTime += 1; // Master ZIP generation
    
    return Math.ceil(totalTime);
  },
  
  /**
   * Format time estimate
   */
  formatTimeEstimate: function(seconds) {
    if (seconds < 60) {
      return seconds + ' seconds';
    } else {
      var minutes = Math.floor(seconds / 60);
      var secs = seconds % 60;
      return minutes + ' minute' + (minutes > 1 ? 's' : '') + (secs > 0 ? ' ' + secs + ' second' + (secs > 1 ? 's' : '') : '');
    }
  },
  
  /**
   * Download Master ZIP file - contains all language ZIPs
   */
  downloadZip: async function() {
    try {
      var languages = TemplateEngine.getSelectedLanguages();
      if (languages.length === 0) {
        alert('Please select at least one language');
        return;
      }
      
      // Calculate and show time estimate
      var estimatedTime = this.calculateTimeEstimate(languages);
      var timeEstimateDiv = document.getElementById('timeEstimate');
      var timeEstimateValue = document.getElementById('timeEstimateValue');
      
      if (timeEstimateDiv && timeEstimateValue) {
        timeEstimateDiv.style.display = 'block';
        timeEstimateValue.textContent = this.formatTimeEstimate(estimatedTime);
      }
      
      var startTime = Date.now();
      var sourceLang = TemplateEngine.getSourceLanguage();
      var masterZip = new JSZip();
      
      // Show progress indicator
      var progressDiv = document.getElementById('progressIndicator');
      var progressText = document.getElementById('progressText');
      var progressBar = document.getElementById('progressBar');
      var progressPercent = document.getElementById('progressPercent');
      var currentLanguage = document.getElementById('currentLanguage');
      
      if (progressDiv) {
        progressDiv.style.display = 'block';
      }
      
      // Warn if too many languages
      if (languages.length > 10) {
        var confirmMsg = 'You selected ' + languages.length + ' languages. This may take ' + 
                         Math.ceil(estimatedTime / 60) + ' minutes. Continue?';
        if (!confirm(confirmMsg)) {
          if (progressDiv) progressDiv.style.display = 'none';
          if (timeEstimateDiv) timeEstimateDiv.style.display = 'none';
          return;
        }
      }
      
      // Show progress
      console.log('Starting Master ZIP export for languages:', languages);
      console.log('Estimated time: ' + estimatedTime + ' seconds');
      
      // Process each language and create separate ZIP, then add to master ZIP
      for (var i = 0; i < languages.length; i++) {
        var lang = languages[i];
        var langZip = new JSZip();
        
        try {
          var langStartTime = Date.now();
          var progress = Math.floor(((i + 1) / languages.length) * 100);
          
          // Update progress bar
          if (progressText) {
            progressText.textContent = (i + 1) + ' / ' + languages.length + ' languages';
          }
          if (progressBar) {
            progressBar.style.width = progress + '%';
          }
          if (progressPercent) {
            progressPercent.textContent = progress + '%';
          }
          if (currentLanguage) {
            currentLanguage.textContent = '🔄 Processing: ' + lang.toUpperCase() + ' (' + (i + 1) + ' of ' + languages.length + ')';
          }
          
          console.log('Processing language ' + (i + 1) + '/' + languages.length + ': ' + lang);
          
          // Update time estimate
          if (timeEstimateValue) {
            var elapsed = Math.floor((Date.now() - startTime) / 1000);
            var remaining = Math.max(0, estimatedTime - elapsed);
            timeEstimateValue.textContent = this.formatTimeEstimate(remaining) + ' remaining';
          }
          
          // Get translated data
          var data;
          if (lang === sourceLang) {
            data = TemplateEngine.getFieldValues();
            console.log('Using original data for ' + lang);
          } else {
            console.log('Translating to ' + lang + '...');
            data = await this.translateTemplate(lang, sourceLang);
            console.log('Translation complete for ' + lang);
          }
          
          // Get HTML with translated content
          var htmlContent = this.getRenderedHTML(data);
          
          // Create temporary container to render translated content
          var tempContainer = document.createElement('div');
          tempContainer.style.position = 'absolute';
          tempContainer.style.left = '-9999px';
          tempContainer.style.top = '0';
          tempContainer.innerHTML = htmlContent;
          document.body.appendChild(tempContainer);
          
          // Wait for images to load
          var images = tempContainer.querySelectorAll('img');
          var loadPromises = [];
          for (var j = 0; j < images.length; j++) {
            var img = images[j];
            if (!img.complete) {
              loadPromises.push(new Promise(function(resolve) {
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000);
              }));
            }
          }
          await Promise.all(loadPromises);
          
          // Extract assets from temporary container
          var extracted = await this.extractAssetsFromDOM(tempContainer);
          
          // Remove temporary container
          document.body.removeChild(tempContainer);
          
          // Add HTML file to language ZIP
          langZip.file('index.html', extracted.html);
          
          // Add all assets to language ZIP
          for (var filename in extracted.assets) {
            var assetBlob = extracted.assets[filename];
            if (assetBlob) {
              langZip.file(filename, assetBlob);
            }
          }
          
          // Generate language ZIP blob
          var langZipBlob = await langZip.generateAsync({ type: 'blob' });
          
          // Add language ZIP to master ZIP
          var langZipFilename = lang + '.zip';
          masterZip.file(langZipFilename, langZipBlob);
          
          var langTime = Math.floor((Date.now() - langStartTime) / 1000);
          console.log('✓ Completed ' + lang + ' in ' + langTime + ' seconds');
          
          // Update current language status
          if (currentLanguage) {
            currentLanguage.textContent = '✅ Completed: ' + lang.toUpperCase() + ' (' + langTime + 's)';
          }
          
        } catch (error) {
          console.error('Error creating ZIP for ' + lang + ':', error);
          if (currentLanguage) {
            currentLanguage.textContent = '❌ Error: ' + lang.toUpperCase() + ' - ' + error.message;
          }
          // Continue with other languages even if one fails
        }
      }
      
      // Generate master ZIP
      console.log('Generating master ZIP...');
      if (timeEstimateValue) {
        timeEstimateValue.textContent = 'Generating master ZIP...';
      }
      if (currentLanguage) {
        currentLanguage.textContent = '📦 Creating master ZIP file...';
      }
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      if (progressPercent) {
        progressPercent.textContent = '100%';
      }
      
      var masterZipBlob = await masterZip.generateAsync({ type: 'blob' });
      
      // Download master ZIP
      var url = URL.createObjectURL(masterZipBlob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (TemplateEngine.currentTemplate || 'template').replace('.html', '') + '_all_languages.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show completion
      var totalTime = Math.floor((Date.now() - startTime) / 1000);
      console.log('✓ Master ZIP generated in ' + totalTime + ' seconds');
      
      if (timeEstimateDiv && timeEstimateValue) {
        timeEstimateValue.textContent = 'Completed in ' + totalTime + ' seconds!';
        timeEstimateDiv.style.background = '#c8e6c9';
      }
      
      if (currentLanguage) {
        currentLanguage.textContent = '✅ All languages completed! Download started.';
        currentLanguage.style.color = '#4CAF50';
        currentLanguage.style.fontWeight = 'bold';
      }
      
      // Hide progress after delay
      setTimeout(function() {
        var timeEstimateDiv = document.getElementById('timeEstimate');
        var progressDiv = document.getElementById('progressIndicator');
        if (timeEstimateDiv) {
          timeEstimateDiv.style.display = 'none';
          timeEstimateDiv.style.background = '#e3f2fd';
        }
        if (progressDiv) {
          progressDiv.style.display = 'none';
        }
        if (currentLanguage) {
          currentLanguage.style.color = '#666';
          currentLanguage.style.fontWeight = 'normal';
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error creating master ZIP:', error);
      alert('Error creating master ZIP: ' + error.message);
      
      var timeEstimateDiv = document.getElementById('timeEstimate');
      var progressDiv = document.getElementById('progressIndicator');
      if (timeEstimateDiv) {
        timeEstimateDiv.style.display = 'none';
      }
      if (progressDiv) {
        progressDiv.style.display = 'none';
      }
    }
  },
  
  /**
   * Calculate estimated time for images generation
   */
  calculateImagesTimeEstimate: function(languages) {
    var sourceLang = TemplateEngine.getSourceLanguage();
    var languagesToTranslate = languages.filter(function(lang) { return lang !== sourceLang; });
    
    // Time estimates (in seconds) - optimized
    var translationTimePerLanguage = 2; // Reduced from 3
    var renderingTimePerSize = 1.5; // Reduced from 2 seconds per image render
    var sizesCount = 3; // 3 sizes per language
    var zipGenerationTime = 0.5; // Reduced from 1
    
    var totalTime = 0;
    totalTime += languagesToTranslate.length * translationTimePerLanguage;
    totalTime += languages.length * sizesCount * renderingTimePerSize;
    totalTime += languages.length * zipGenerationTime;
    totalTime += 1; // Master ZIP generation
    
    return Math.ceil(totalTime);
  },
  
  /**
   * Calculate estimated time for video generation
   * Takes into account translation, rendering, and video encoding time
   */
  calculateVideoTimeEstimate: function(languages, audioDuration) {
    var sourceLang = TemplateEngine.getSourceLanguage();
    var languagesToTranslate = languages.filter(function(lang) { return lang !== sourceLang; });
    
    // Time estimates (in seconds)
    var translationTimePerLanguage = 2; // Translation time per language
    var renderingTimePerSize = 1.5; // Canvas rendering time per size
    var videoEncodingOverhead = 2; // Overhead for MediaRecorder setup/encoding per video
    var sizesCount = 3; // 3 sizes per language
    var zipGenerationTime = 0.5; // ZIP generation per language
    
    // Video encoding time = audio duration + encoding overhead
    // Each video takes roughly the audio duration to encode (real-time encoding)
    var videoEncodingTimePerSize = (audioDuration || 30) + videoEncodingOverhead;
    
    var totalTime = 0;
    totalTime += languagesToTranslate.length * translationTimePerLanguage;
    totalTime += languages.length * sizesCount * renderingTimePerSize;
    totalTime += languages.length * sizesCount * videoEncodingTimePerSize;
    totalTime += languages.length * zipGenerationTime;
    
    return Math.ceil(totalTime);
  },
  
  /**
   * Download images in 3 sizes - Master ZIP containing all language ZIPs
   */
  downloadImages: async function() {
    try {
      var languages = TemplateEngine.getSelectedLanguages();
      if (languages.length === 0) {
        alert('Please select at least one language');
        return;
      }
      
      // Calculate and show time estimate
      var estimatedTime = this.calculateImagesTimeEstimate(languages);
      var timeEstimateDiv = document.getElementById('timeEstimate');
      var timeEstimateValue = document.getElementById('timeEstimateValue');
      
      if (timeEstimateDiv && timeEstimateValue) {
        timeEstimateDiv.style.display = 'block';
        timeEstimateValue.textContent = this.formatTimeEstimate(estimatedTime);
      }
      
      var startTime = Date.now();
      var sourceLang = TemplateEngine.getSourceLanguage();
      var masterZip = new JSZip();
      var sizes = [
        { name: '1200x1200', width: 1200, height: 1200 },
        { name: '1200x1500', width: 1200, height: 1500 },
        { name: '1200x628', width: 1200, height: 628 }
      ];
      
      // Show progress indicator
      var progressDiv = document.getElementById('progressIndicator');
      var progressText = document.getElementById('progressText');
      var progressBar = document.getElementById('progressBar');
      var progressPercent = document.getElementById('progressPercent');
      var currentLanguage = document.getElementById('currentLanguage');
      
      if (progressDiv) {
        progressDiv.style.display = 'block';
      }
      
      // Warn if too many languages
      if (languages.length > 10) {
        var confirmMsg = 'You selected ' + languages.length + ' languages. This may take ' + 
                         Math.ceil(estimatedTime / 60) + ' minutes. Continue?';
        if (!confirm(confirmMsg)) {
          if (progressDiv) progressDiv.style.display = 'none';
          if (timeEstimateDiv) timeEstimateDiv.style.display = 'none';
          return;
        }
      }
      
      console.log('Starting Images ZIP export for languages:', languages);
      console.log('Estimated time: ' + estimatedTime + ' seconds');
      
      // Process each language
      for (var langIdx = 0; langIdx < languages.length; langIdx++) {
        var lang = languages[langIdx];
        var langZip = new JSZip();
        
        try {
          var langStartTime = Date.now();
          var progress = Math.floor(((langIdx + 1) / languages.length) * 100);
          
          // Update progress bar
          if (progressText) {
            progressText.textContent = (langIdx + 1) + ' / ' + languages.length + ' languages';
          }
          if (progressBar) {
            progressBar.style.width = progress + '%';
          }
          if (progressPercent) {
            progressPercent.textContent = progress + '%';
          }
          if (currentLanguage) {
            currentLanguage.textContent = '🔄 Processing: ' + lang.toUpperCase() + ' (' + (langIdx + 1) + ' of ' + languages.length + ')';
          }
          
          console.log('Processing language ' + (langIdx + 1) + '/' + languages.length + ': ' + lang);
          
          // Update time estimate
          if (timeEstimateValue) {
            var elapsed = Math.floor((Date.now() - startTime) / 1000);
            var remaining = Math.max(0, estimatedTime - elapsed);
            timeEstimateValue.textContent = this.formatTimeEstimate(remaining) + ' remaining';
          }
          
          // Get translated data
          var data = lang === sourceLang 
            ? TemplateEngine.getFieldValues()
            : await this.translateTemplate(lang, sourceLang);
          
          // Get HTML with translated content
          var htmlContent = this.getRenderedHTML(data);
          
          // Render each size and add to language ZIP
          for (var sizeIdx = 0; sizeIdx < sizes.length; sizeIdx++) {
            var size = sizes[sizeIdx];
            
            try {
              var canvas = await this.renderToCanvas(htmlContent, size.width, size.height);
              
              // Convert canvas to blob and add to language ZIP
              var imageBlob = await new Promise(function(resolve) {
                canvas.toBlob(resolve, 'image/png');
              });
              
              langZip.file(size.name + '.png', imageBlob);
              
              // Delay between renders (optimized for faster processing)
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error('Error rendering ' + size.name + ' for ' + lang + ':', error);
            }
          }
          
          // Generate language ZIP blob
          var langZipBlob = await langZip.generateAsync({ type: 'blob' });
          
          // Add language ZIP to master ZIP
          var langZipFilename = lang + '_images.zip';
          masterZip.file(langZipFilename, langZipBlob);
          
          var langTime = Math.floor((Date.now() - langStartTime) / 1000);
          console.log('✓ Completed ' + lang + ' images in ' + langTime + ' seconds');
          
          // Update current language status
          if (currentLanguage) {
            currentLanguage.textContent = '✅ Completed: ' + lang.toUpperCase() + ' (' + langTime + 's)';
          }
          
        } catch (error) {
          console.error('Error generating images for ' + lang + ':', error);
          if (currentLanguage) {
            currentLanguage.textContent = '❌ Error: ' + lang.toUpperCase() + ' - ' + error.message;
          }
          // Continue with other languages even if one fails
        }
      }
      
      // Generate master ZIP
      console.log('Generating master images ZIP...');
      if (timeEstimateValue) {
        timeEstimateValue.textContent = 'Generating master ZIP...';
      }
      if (currentLanguage) {
        currentLanguage.textContent = '📦 Creating master ZIP file...';
      }
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      if (progressPercent) {
        progressPercent.textContent = '100%';
      }
      
      var masterZipBlob = await masterZip.generateAsync({ type: 'blob' });
      
      // Download master ZIP
      var url = URL.createObjectURL(masterZipBlob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (TemplateEngine.currentTemplate || 'template').replace('.html', '') + '_all_images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show completion
      var totalTime = Math.floor((Date.now() - startTime) / 1000);
      console.log('✓ Master Images ZIP generated in ' + totalTime + ' seconds');
      
      if (timeEstimateDiv && timeEstimateValue) {
        timeEstimateValue.textContent = 'Completed in ' + totalTime + ' seconds!';
        timeEstimateDiv.style.background = '#c8e6c9';
      }
      
      if (currentLanguage) {
        currentLanguage.textContent = '✅ All languages completed! Download started.';
        currentLanguage.style.color = '#4CAF50';
        currentLanguage.style.fontWeight = 'bold';
      }
      
      // Hide progress after delay
      setTimeout(function() {
        var timeEstimateDiv = document.getElementById('timeEstimate');
        var progressDiv = document.getElementById('progressIndicator');
        if (timeEstimateDiv) {
          timeEstimateDiv.style.display = 'none';
          timeEstimateDiv.style.background = '#e3f2fd';
        }
        if (progressDiv) {
          progressDiv.style.display = 'none';
        }
        if (currentLanguage) {
          currentLanguage.style.color = '#666';
          currentLanguage.style.fontWeight = 'normal';
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error generating images:', error);
      alert('Error generating images: ' + error.message);
      
      var timeEstimateDiv = document.getElementById('timeEstimate');
      var progressDiv = document.getElementById('progressIndicator');
      if (timeEstimateDiv) {
        timeEstimateDiv.style.display = 'none';
      }
      if (progressDiv) {
        progressDiv.style.display = 'none';
      }
    }
  },
  
  /**
   * Create video using MediaRecorder API (works perfectly on GitHub Pages)
   * This creates WebM videos by combining canvas frames with audio
   */
  createVideoWithMediaRecorder: async function(canvas, audioBuffer, duration) {
    return new Promise(function(resolve, reject) {
      try {
        // Create a video stream from canvas
        var stream = canvas.captureStream(30); // 30 FPS
        
        // Create MediaRecorder
        var mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8,opus',
          videoBitsPerSecond: 2500000
        });
        
        var chunks = [];
        
        mediaRecorder.ondataavailable = function(event) {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = function() {
          var blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
        
        mediaRecorder.onerror = function(event) {
          reject(new Error('MediaRecorder error: ' + event.error));
        };
        
        // Start recording
        mediaRecorder.start();
        
        // Play audio and record for the duration
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        
        // Stop recording when audio ends
        setTimeout(function() {
          mediaRecorder.stop();
          source.stop();
          stream.getTracks().forEach(function(track) { track.stop(); });
        }, duration * 1000);
        
      } catch (error) {
        reject(error);
      }
    });
  },
  
  /**
   * Create video frames from canvas and combine with audio
   * Uses MediaRecorder API to create videos with audio included
   */
  createVideoFromCanvasAndAudio: async function(canvas, audioFile) {
    return new Promise(async function(resolve, reject) {
      try {
        // Get audio duration and create audio context
        var audioBuffer = await audioFile.arrayBuffer();
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice(0));
        var duration = decodedAudio.duration;
        
        console.log('Creating video: duration =', duration, 'seconds');
        
        // Create a video stream from canvas
        var videoStream = canvas.captureStream(30); // 30 FPS
        
        // Create audio stream from audio file
        // We need to create a MediaStreamAudioSourceNode and connect it to a MediaStreamAudioDestinationNode
        var audioSource = audioContext.createBufferSource();
        audioSource.buffer = decodedAudio;
        
        // Create a MediaStreamDestination to get an audio track
        var destination = audioContext.createMediaStreamDestination();
        audioSource.connect(destination);
        
        // Combine video and audio streams
        var combinedStream = new MediaStream();
        
        // Add video tracks from canvas
        videoStream.getVideoTracks().forEach(function(track) {
          combinedStream.addTrack(track);
        });
        
        // Add audio tracks from audio source
        destination.stream.getAudioTracks().forEach(function(track) {
          combinedStream.addTrack(track);
        });
        
        console.log('Combined stream tracks - Video:', combinedStream.getVideoTracks().length, 'Audio:', combinedStream.getAudioTracks().length);
        
        // Determine best MIME type (with audio support)
        var mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        }
        
        console.log('Using MIME type:', mimeType);
        
        var mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: mimeType,
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000
        });
        
        var chunks = [];
        var dataCollected = false;
        
        mediaRecorder.ondataavailable = function(event) {
          console.log('Data available:', event.data.size, 'bytes');
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
            dataCollected = true;
          }
        };
        
        mediaRecorder.onstop = function() {
          var totalSize = chunks.reduce(function(sum, chunk) { return sum + chunk.size; }, 0);
          console.log('MediaRecorder stopped. Total chunks:', chunks.length, 'Total size:', totalSize, 'bytes');
          console.log('Combined stream - Video tracks:', combinedStream.getVideoTracks().length, 'Audio tracks:', combinedStream.getAudioTracks().length);
          if (chunks.length === 0 || !dataCollected) {
            reject(new Error('No video data collected. MediaRecorder may not have captured any frames.'));
            return;
          }
          var blob = new Blob(chunks, { type: 'video/webm' });
          console.log('Video blob created:', blob.size, 'bytes', '(includes audio:', combinedStream.getAudioTracks().length > 0 ? 'YES' : 'NO', ')');
          resolve(blob);
        };
        
        mediaRecorder.onerror = function(event) {
          console.error('MediaRecorder error:', event);
          reject(new Error('MediaRecorder error: ' + (event.error || 'Unknown error')));
        };
        
        // For static canvas, we need to trigger frame updates
        // The canvas stream needs active frame requests to produce video
        var ctx = canvas.getContext('2d');
        var frameInterval = 1000 / 30; // ~33ms per frame (30 FPS)
        var totalFrames = Math.ceil(duration * 30);
        var frameCount = 0;
        var recordingStarted = false;
        
        // Store the original image data to redraw
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        function requestFrame() {
          if (frameCount < totalFrames) {
            // Redraw the canvas to trigger a new frame in the stream
            // This keeps the video stream active
            ctx.putImageData(imageData, 0, 0);
            frameCount++;
            
            if (recordingStarted) {
              setTimeout(requestFrame, frameInterval);
            }
          }
        }
        
        // Start requesting frames first to ensure stream is active
        requestFrame();
        
        // Small delay to ensure frames are being generated, then start recording
        setTimeout(function() {
          // Start recording
          if (mediaRecorder.state === 'inactive') {
            mediaRecorder.start(100); // Collect data every 100ms
            recordingStarted = true;
            console.log('MediaRecorder started, state:', mediaRecorder.state);
            
            // Start audio playback (this feeds into the audio track)
            audioSource.start(0);
            console.log('Audio source started');
            
            // Continue requesting frames
            requestFrame();
          }
        }, 200);
        
        // Stop recording when audio ends
        var stopTimeout = setTimeout(function() {
          console.log('Stopping recording after timeout');
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          audioSource.stop();
          combinedStream.getTracks().forEach(function(track) { track.stop(); });
          videoStream.getTracks().forEach(function(track) { track.stop(); });
        }, (duration + 1) * 1000); // Add 1s buffer
        
      } catch (error) {
        console.error('Error in createVideoFromCanvasAndAudio:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Download video (combines template with audio) - one ZIP per language with 3 sizes
   * Uses MediaRecorder API instead of FFmpeg to avoid CORS/Worker issues
   */
  downloadVideo: async function() {
    try {
      if (!TemplateEngine.audioFile) {
        alert('Please upload an audio file first');
        return;
      }
      
      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        alert('⚠️ Video Generation Not Supported\n\n' +
              'Your browser does not support MediaRecorder API or WebM video encoding.\n\n' +
              'Please use a modern browser like Chrome, Firefox, or Edge.');
        return;
      }
      
      var languages = TemplateEngine.getSelectedLanguages();
      if (languages.length === 0) {
        alert('Please select at least one language');
        return;
      }
      
      // Get audio duration first (needed for time estimation)
      var audioContext = new (window.AudioContext || window.webkitAudioContext)();
      var audioBuffer = await TemplateEngine.audioFile.arrayBuffer();
      var decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice(0));
      var audioDuration = decodedAudio.duration;
      
      // Calculate and show time estimate
      var estimatedTime = this.calculateVideoTimeEstimate(languages, audioDuration);
      var timeEstimateDiv = document.getElementById('timeEstimate');
      var timeEstimateValue = document.getElementById('timeEstimateValue');
      
      if (timeEstimateDiv && timeEstimateValue) {
        timeEstimateDiv.style.display = 'block';
        var timeText = this.formatTimeEstimate(estimatedTime);
        timeText += ' (Audio: ' + Math.ceil(audioDuration) + 's per video)';
        timeEstimateValue.textContent = timeText;
      }
      
      // Show progress indicator
      var progressDiv = document.getElementById('progressIndicator');
      var progressText = document.getElementById('progressText');
      var progressBar = document.getElementById('progressBar');
      var progressPercent = document.getElementById('progressPercent');
      var currentLanguage = document.getElementById('currentLanguage');
      
      if (progressDiv) {
        progressDiv.style.display = 'block';
      }
      
      // Warn if audio is very long or many languages
      if (audioDuration > 60) {
        var confirmMsg = 'Your audio is ' + Math.ceil(audioDuration) + ' seconds long. ' +
                        'With ' + languages.length + ' language(s), this will take approximately ' +
                        this.formatTimeEstimate(estimatedTime) + '. Continue?';
        if (!confirm(confirmMsg)) {
          if (timeEstimateDiv) timeEstimateDiv.style.display = 'none';
          if (progressDiv) progressDiv.style.display = 'none';
          return;
        }
      }
      
      var startTime = Date.now();
      var sourceLang = TemplateEngine.getSourceLanguage();
      var sizes = [
        { name: '1200x1200', width: 1200, height: 1200 },
        { name: '1200x1500', width: 1200, height: 1500 },
        { name: '1200x628', width: 1200, height: 628 }
      ];
      
      // Process each language
      for (var langIdx = 0; langIdx < languages.length; langIdx++) {
        var lang = languages[langIdx];
        var zip = new JSZip();
        
        try {
          var langStartTime = Date.now();
          var progress = Math.floor(((langIdx + 1) / languages.length) * 100);
          
          // Update progress
          if (progressText) {
            progressText.textContent = (langIdx + 1) + ' / ' + languages.length + ' languages';
          }
          if (progressBar) {
            progressBar.style.width = progress + '%';
          }
          if (progressPercent) {
            progressPercent.textContent = progress + '%';
          }
          if (currentLanguage) {
            currentLanguage.textContent = '🔄 Processing: ' + lang.toUpperCase() + ' (' + (langIdx + 1) + ' of ' + languages.length + ')';
          }
          
          // Update time estimate
          if (timeEstimateValue) {
            var elapsed = Math.floor((Date.now() - startTime) / 1000);
            var remaining = Math.max(0, estimatedTime - elapsed);
            timeEstimateValue.textContent = this.formatTimeEstimate(remaining) + ' remaining (Audio: ' + Math.ceil(audioDuration) + 's per video)';
          }
          
          // Get translated data
          var data = lang === sourceLang 
            ? TemplateEngine.getFieldValues()
            : await this.translateTemplate(lang, sourceLang);
          
          // Get HTML with translated content
          var htmlContent = this.getRenderedHTML(data);
          
          // Create video for each size
          for (var sizeIdx = 0; sizeIdx < sizes.length; sizeIdx++) {
            var size = sizes[sizeIdx];
            
            try {
              if (currentLanguage) {
                currentLanguage.textContent = '🎬 Creating ' + size.name + ' video for ' + lang.toUpperCase() + '...';
              }
              
              // Render template to canvas for this size
              var canvas = await this.renderToCanvas(htmlContent, size.width, size.height);
              
              // Create video using MediaRecorder (creates WebM with audio included)
              var videoBlob = await this.createVideoFromCanvasAndAudio(canvas, TemplateEngine.audioFile);
              
              // Save as MP4 (MediaRecorder creates WebM, but we'll save with .mp4 extension)
              // Note: The file will be WebM format but with .mp4 extension
              // Most modern players can handle WebM files even with .mp4 extension
              // For true MP4, we would need FFmpeg.wasm (which has CORS issues)
              zip.file(size.name + '.mp4', videoBlob);
              
              // Delay between video generations
              await new Promise(resolve => setTimeout(resolve, 500));
              
            } catch (error) {
              console.error('Error creating video ' + size.name + ' for ' + lang + ':', error);
              if (currentLanguage) {
                currentLanguage.textContent = '❌ Error creating ' + size.name + ' for ' + lang.toUpperCase();
              }
            }
          }
          
          // Generate ZIP for this language
          var blob = await zip.generateAsync({ type: 'blob' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = (TemplateEngine.currentTemplate || 'template').replace('.html', '') + '_' + lang + '_videos.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          var langTime = Math.floor((Date.now() - langStartTime) / 1000);
          console.log('✓ Completed ' + lang + ' videos in ' + langTime + ' seconds');
          
          if (currentLanguage) {
            currentLanguage.textContent = '✅ Completed: ' + lang.toUpperCase() + ' (' + langTime + 's)';
          }
          
          // Delay between languages
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error('Error generating videos for ' + lang + ':', error);
          if (currentLanguage) {
            currentLanguage.textContent = '❌ Error: ' + lang.toUpperCase() + ' - ' + error.message;
          }
          alert('Error generating videos for ' + lang + ': ' + error.message);
        }
      }
      
      // Show completion
      var totalTime = Math.floor((Date.now() - startTime) / 1000);
      console.log('✓ All videos generated in ' + totalTime + ' seconds');
      
      if (timeEstimateDiv && timeEstimateValue) {
        timeEstimateValue.textContent = 'Completed in ' + totalTime + ' seconds!';
        timeEstimateDiv.style.background = '#c8e6c9';
      }
      
      if (currentLanguage) {
        currentLanguage.textContent = '✅ All videos completed! Downloads started.';
        currentLanguage.style.color = '#4CAF50';
        currentLanguage.style.fontWeight = 'bold';
      }
      
      setTimeout(function() {
        if (timeEstimateDiv) {
          timeEstimateDiv.style.display = 'none';
          timeEstimateDiv.style.background = '#e3f2fd';
        }
        if (progressDiv) {
          progressDiv.style.display = 'none';
        }
        if (currentLanguage) {
          currentLanguage.style.color = '#666';
          currentLanguage.style.fontWeight = 'normal';
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error generating videos:', error);
      alert('Error generating videos: ' + error.message);
      
      var progressDiv = document.getElementById('progressIndicator');
      if (progressDiv) {
        progressDiv.style.display = 'none';
      }
    }
  }
};

