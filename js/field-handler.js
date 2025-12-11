/**
 * Field Handler - Handles Preview Updates and Export Based on FieldConfig
 * 
 * This file uses FieldConfig to automatically handle all data-field types.
 * NO CODE CHANGES NEEDED when adding new templates - just follow naming patterns!
 */

var FieldHandler = {
  /**
   * Update preview element based on field configuration
   */
  updatePreview: function(fieldName, value, element, inputElement) {
    if (!element || !fieldName) return;
    
    var fieldConfig = FieldConfig.getFieldConfig(fieldName);
    var config = fieldConfig.config;
    var type = fieldConfig.type;
    
    // Skip if element is an input (only update preview elements)
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      return;
    }
    
    // Handle based on field type
    switch (type) {
      case 'animation':
        // Update animation class
        this.updateAnimation(element, value, fieldName);
        break;
        
      case 'text':
      case 'select':
        // Update text content
        this.updateTextContent(element, value, fieldName);
        break;
        
      case 'color':
        // Update color style
        this.updateColor(element, value, fieldName);
        break;
        
      case 'image':
        // Update image src
        this.updateImage(element, value, fieldName);
        break;
        
      case 'size':
        // Update size (width, height, fontSize)
        this.updateSize(element, value, fieldName);
        break;
        
      case 'spacing':
        // Update spacing (padding, margin)
        this.updateSpacing(element, value, fieldName);
        break;
        
      case 'audio':
      case 'video':
        // Update media src
        this.updateMedia(element, value, fieldName);
        break;
        
      case 'border':
        // Update border styles
        this.updateBorder(element, value, fieldName);
        break;
        
      case 'opacity':
        // Update opacity
        this.updateOpacity(element, value, fieldName);
        break;
        
      case 'position':
        // Update position
        this.updatePosition(element, value, fieldName);
        break;
        
      case 'font':
        // Update font properties
        this.updateFont(element, value, fieldName);
        break;
        
      case 'background':
        // Update background
        this.updateBackground(element, value, fieldName);
        break;
        
      default:
        // Default: update text content
        this.updateTextContent(element, value, fieldName);
    }
  },
  
  /**
   * Update text content
   */
  updateTextContent: function(element, value, fieldName) {
    // Skip if value is a file path or data URL
    if (typeof value === 'string' && (
      value.includes('fakepath') || 
      value.includes('C:\\') || 
      value.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp)$/i) ||
      value.startsWith('data:') ||
      value.startsWith('blob:') ||
      value.startsWith('http')
    )) {
      return;
    }
    
    // Skip hex color codes
    if (typeof value === 'string' && value.match(/^#[0-9a-fA-F]{3,6}$/)) {
      return;
    }
    
    // Special handling for rewindSeconds and forwardSeconds - add "s" suffix
    if (fieldName === 'rewindSeconds' || fieldName === 'forwardSeconds') {
      if (element.classList && element.classList.contains('control-btn-text')) {
        element.textContent = value + 's';
        return;
      }
    }
    
    // Skip pure numbers if element has children (it's a container)
    if (typeof value === 'string' && value.trim().match(/^\d+$/) && element.children.length > 0) {
      var dataField = element.getAttribute('data-field');
      if (dataField && (dataField.includes('Width') || dataField.includes('Height') || 
          dataField.includes('Size') || dataField.includes('Padding') || 
          dataField.includes('Margin'))) {
        return;
      }
    }
    
    element.textContent = value;
    if (value && value.includes('<')) {
      element.innerHTML = value;
    }
  },
  
  /**
   * Update color style
   */
  updateColor: function(element, value, fieldName) {
    var styleProperty = FieldConfig.getStyleProperty(fieldName);
    
    if (styleProperty === 'backgroundColor' || styleProperty === 'background') {
      element.style.backgroundColor = value;
      // Remove any hex code text
      if (element.textContent && element.textContent.match(/^#[0-9a-fA-F]{3,6}$/)) {
        element.textContent = '';
      }
    } else {
      element.style.color = value;
      // Also update child text elements
      var childTextElements = element.querySelectorAll('.header-main, .header-sub, .subtitle-text, .footer-text, [class*="text"], [class*="title"]');
      childTextElements.forEach(function(textEl) {
        textEl.style.color = value;
        if (textEl.textContent && textEl.textContent.match(/^#[0-9a-fA-F]{3,6}$/)) {
          textEl.textContent = '';
        }
      });
    }
  },
  
  /**
   * Update image src
   */
  updateImage: function(element, value, fieldName) {
    if (!value) return;
    
    // Skip file paths
    if (typeof value === 'string' && (value.includes('fakepath') || value.includes('C:\\'))) {
      return;
    }
    
    // IMPORTANT: Check if element is IMG tag FIRST (before checking thumbnail field name)
    // IMG tags should always use src attribute, not background-image
    // Template6: Uses <img data-field="thumbnail1"> → needs src
    // Template5: Uses <div class="video-section" data-field="thumbnail"> → needs background-image
    if (element.tagName === 'IMG') {
      if (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('http')) {
        // Set src first
        element.src = value;
        
        // Hide logo text if logo image is uploaded (template6)
        if (fieldName === 'appLogoImage') {
          var logoText = element.parentElement.querySelector('.app-logo-text');
          if (logoText) {
            logoText.style.display = 'none';
          }
          element.style.display = 'block';
          element.style.width = '100%';
          element.style.height = '100%';
          element.style.objectFit = 'cover';
        }
        
        // For thumbnail images in IMG tags (template6: thumbnail1, thumbnail2, thumbnail3)
        if (fieldName.includes('thumbnail')) {
          // Ensure image is visible and properly sized
          element.style.display = 'block';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          element.style.width = '100%';
          element.style.height = '100%';
          element.style.objectFit = 'cover';
          element.style.maxWidth = '100%';
          element.style.maxHeight = '100%';
          
          // Ensure parent container shows the image
          if (element.parentElement) {
            element.parentElement.style.overflow = 'visible';
          }
          
          // Force image to load
          element.onload = function() {
            this.style.display = 'block';
            this.style.visibility = 'visible';
            this.style.opacity = '1';
          };
          element.onerror = function() {
            console.error('Error loading thumbnail image for field:', fieldName);
          };
        }
      }
      return; // Exit early for IMG tags - prevents fallthrough to background-image logic
    }
    
    // For thumbnail fields on NON-IMG elements (like video-section), use background-image
    if (fieldName.includes('thumbnail') || element.classList.contains('video-section') || 
        element.classList.contains('image-container')) {
      if (value.startsWith('data:image') || value.startsWith('blob:') || value.startsWith('http')) {
        element.style.backgroundImage = 'url(' + value + ')';
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.style.backgroundRepeat = 'no-repeat';
        // Remove any file path text (but DON'T use textContent = '' as it can remove child elements)
        // Instead, only remove text nodes that contain file paths
        var walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        var textNodes = [];
        var node;
        while (node = walker.nextNode()) {
          var text = node.textContent || '';
          if (text.includes('fakepath') || text.includes('C:\\') || 
              text.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp)$/i)) {
            var parent = node.parentElement;
            if (parent && !parent.closest('.play-controls') && 
                !parent.classList.contains('play-controls') &&
                !parent.classList.contains('control-btn') &&
                !parent.classList.contains('play-button')) {
              textNodes.push(node);
            }
          }
        }
        textNodes.forEach(function(textNode) {
          textNode.remove();
        });
        
        // Also hide any elements that show file paths (but not play-controls)
        var textChildren = element.querySelectorAll('*');
        textChildren.forEach(function(child) {
          if (child.classList.contains('play-controls') || 
              child.classList.contains('control-btn') || 
              child.classList.contains('play-button') ||
              child.closest('.play-controls')) {
            return;
          }
          var text = child.textContent || '';
          if (text && (text.includes('fakepath') || text.includes('C:\\') || 
              text.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp)$/i))) {
            child.style.display = 'none';
            child.textContent = '';
          }
        });
        
        // CRITICAL: Ensure play-controls are ALWAYS visible after image upload
        var playControls = element.querySelector('.play-controls');
        if (playControls) {
          playControls.style.display = 'flex';
          playControls.style.visibility = 'visible';
          playControls.style.opacity = '1';
          playControls.style.position = 'relative';
          playControls.style.zIndex = '10';
        }
        
        // Also ensure individual buttons are visible
        var controlBtns = element.querySelectorAll('.control-btn, .play-button');
        controlBtns.forEach(function(btn) {
          btn.style.display = 'flex';
          btn.style.visibility = 'visible';
          btn.style.opacity = '1';
        });
      }
      return;
    }
    
    // For other non-IMG elements, use background-image
    if (element.tagName !== 'IMG') {
      // Background image - ALWAYS use background-image for containers
      if (value.startsWith('data:image') || value.startsWith('blob:') || value.startsWith('http')) {
        element.style.backgroundImage = 'url(' + value + ')';
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.style.backgroundRepeat = 'no-repeat';
        // Remove any file path text (but DON'T hide play-controls or control buttons)
        element.textContent = '';
        var textChildren = element.querySelectorAll('*');
        textChildren.forEach(function(child) {
          // Skip play-controls and control buttons - they should always be visible
          if (child.classList.contains('play-controls') || 
              child.classList.contains('control-btn') || 
              child.classList.contains('play-button') ||
              child.closest('.play-controls')) {
            return; // Don't hide play controls
          }
          if (child.textContent && (child.textContent.includes('fakepath') || child.textContent.includes('C:\\'))) {
            child.style.display = 'none';
            child.textContent = '';
          }
        });
        
        // Ensure play-controls are always visible
        var playControls = element.querySelector('.play-controls');
        if (playControls) {
          playControls.style.display = 'flex';
          playControls.style.visibility = 'visible';
          playControls.style.opacity = '1';
        }
      }
    }
  },
  
  /**
   * Update size (width, height, fontSize)
   */
  updateSize: function(element, value, fieldName) {
    var styleProperty = FieldConfig.getStyleProperty(fieldName);
    var unit = FieldConfig.getUnit(fieldName, value);
    
    if (styleProperty) {
      var styleValue = value + unit;
      element.style[styleProperty] = styleValue;
      
      // Remove numeric text if element has children
      if (element.textContent && element.textContent.trim().match(/^\d+$/) && element.children.length > 0) {
        var textNodes = [];
        for (var i = 0; i < element.childNodes.length; i++) {
          if (element.childNodes[i].nodeType === 3) { // Text node
            textNodes.push(element.childNodes[i]);
          }
        }
        textNodes.forEach(function(node) {
          if (node.textContent.trim().match(/^\d+$/)) {
            node.remove();
          }
        });
      }
    }
  },
  
  /**
   * Update spacing (padding, margin)
   */
  updateSpacing: function(element, value, fieldName) {
    var styleProperty = FieldConfig.getStyleProperty(fieldName);
    var unit = FieldConfig.getUnit(fieldName, value);
    
    if (styleProperty) {
      element.style[styleProperty] = value + unit;
    }
  },
  
  /**
   * Update media (audio, video)
   */
  updateMedia: function(element, value, fieldName) {
    if (value && (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('http'))) {
      if (element.tagName === 'AUDIO' || element.tagName === 'VIDEO') {
        element.src = value;
        // For audio, set autoplay and loop
        if (element.tagName === 'AUDIO' && fieldName.includes('backgroundAudio')) {
          element.autoplay = true;
          element.loop = true;
          element.volume = 0.5; // Set volume to 50%
          // Try to play (may fail due to browser autoplay policies)
          element.play().catch(function(error) {
            console.log('Autoplay prevented:', error);
            // User interaction will be needed to play
          });
        }
        // Update all source elements
        var sources = element.querySelectorAll('source');
        sources.forEach(function(source) {
          source.src = value;
        });
      }
    }
  },
  
  /**
   * Update border styles
   */
  updateBorder: function(element, value, fieldName) {
    var styleProperty = FieldConfig.getStyleProperty(fieldName);
    var unit = FieldConfig.getUnit(fieldName, value);
    
    if (styleProperty) {
      element.style[styleProperty] = value + unit;
    }
  },
  
  /**
   * Update opacity
   */
  updateOpacity: function(element, value, fieldName) {
    // Opacity is 0-1, but allow 0-100 input
    var opacityValue = parseFloat(value);
    if (opacityValue > 1) {
      opacityValue = opacityValue / 100;
    }
    element.style.opacity = opacityValue;
  },
  
  /**
   * Update position
   */
  updatePosition: function(element, value, fieldName) {
    var styleProperty = FieldConfig.getStyleProperty(fieldName);
    var unit = FieldConfig.getUnit(fieldName, value);
    
    if (styleProperty) {
      element.style[styleProperty] = value + unit;
    }
  },
  
  /**
   * Update font properties
   */
  updateFont: function(element, value, fieldName) {
    var styleProperty = FieldConfig.getStyleProperty(fieldName);
    var unit = FieldConfig.getUnit(fieldName, value);
    
    if (styleProperty) {
      element.style[styleProperty] = value + unit;
    }
  },
  
  /**
   * Update background
   */
  updateBackground: function(element, value, fieldName) {
    var styleProperty = FieldConfig.getStyleProperty(fieldName);
    
    if (styleProperty === 'background') {
      // Gradient or complex background
      element.style.background = value;
    } else {
      // Simple background color
      element.style.backgroundColor = value;
    }
  },
  
  /**
   * Update animation class (for download button animations)
   */
  updateAnimation: function(element, value, fieldName) {
    if (!value || value === 'none') {
      // Remove all animation classes
      var animationClasses = [
        'anim-none', 'anim-pulse-glow', 'anim-shimmer', 'anim-bounce', 'anim-glow-pulse',
        'anim-ripple', 'anim-rotate-glow', 'anim-wave', 'anim-neon', 'anim-gradient-shift',
        'anim-float', 'anim-scale-pulse', 'anim-shadow-pulse', 'anim-border-glow',
        'anim-particles', 'anim-rainbow', 'anim-magnetic', 'anim-shake', 'anim-slide-glow',
        'anim-double-pulse', 'anim-breathing', 'anim-sparkle', 'anim-fire'
      ];
      animationClasses.forEach(function(cls) {
        element.classList.remove(cls);
      });
      return;
    }
    
    // Remove all animation classes first
    var animationClasses = [
      'anim-none', 'anim-pulse-glow', 'anim-shimmer', 'anim-bounce', 'anim-glow-pulse',
      'anim-ripple', 'anim-rotate-glow', 'anim-wave', 'anim-neon', 'anim-gradient-shift',
      'anim-float', 'anim-scale-pulse', 'anim-shadow-pulse', 'anim-border-glow',
      'anim-particles', 'anim-rainbow', 'anim-magnetic', 'anim-shake', 'anim-slide-glow',
      'anim-double-pulse', 'anim-breathing', 'anim-sparkle', 'anim-fire'
    ];
    animationClasses.forEach(function(cls) {
      element.classList.remove(cls);
    });
    
    // Add selected animation class
    element.classList.add('anim-' + value);
  },
  
  /**
   * Handle file input (images, audio, video)
   */
  handleFileInput: function(fieldName, file, callback) {
    if (!file) return;
    
    var fieldConfig = FieldConfig.getFieldConfig(fieldName);
    var type = fieldConfig.type;
    
    var reader = new FileReader();
    
    reader.onload = function(e) {
      var dataUrl = e.target.result;
      
      // Store in templateData
      TemplateEngine.templateData[fieldName] = dataUrl;
      
      // Update preview - check both templateContainer and preview-panel
      var container = document.getElementById('templateContainer');
      if (!container) {
        // Fallback: try to find preview-panel or any container with preview
        container = document.querySelector('.preview-panel') || document.querySelector('[class*="preview"]');
      }
      if (container) {
        // For thumbnail images, specifically target IMG tags in the preview
        if (fieldName.includes('thumbnail')) {
          var imgElements = container.querySelectorAll('img[data-field="' + fieldName + '"]');
          imgElements.forEach(function(img) {
            if (img.tagName === 'IMG') {
              img.src = dataUrl;
              img.style.display = 'block';
              img.style.visibility = 'visible';
              img.style.opacity = '1';
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'cover';
              img.onload = function() {
                this.style.display = 'block';
                this.style.visibility = 'visible';
                this.style.opacity = '1';
              };
            }
          });
        }
        
        // Also update using the standard method for all fields
        var previewElements = container.querySelectorAll('[data-field="' + fieldName + '"]');
        previewElements.forEach(function(element) {
          if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA' && element.tagName !== 'SELECT') {
            FieldHandler.updatePreview(fieldName, dataUrl, element);
          }
        });
      }
      
      // Special handling for audio files
      if (type === 'audio' && file.type.startsWith('audio/')) {
        TemplateEngine.audioFile = file;
        var videoBtn = document.getElementById('downloadVideoBtn');
        if (videoBtn) {
          videoBtn.style.display = 'inline-block';
        }
      }
      
      // Show remove button in preview for thumbnail images (play controls stay visible)
      if ((type === 'image' && fieldName === 'thumbnail') || fieldName.includes('thumbnail')) {
        var removePreviewBtn = document.getElementById('removeThumbnailPreviewBtn');
        if (removePreviewBtn) removePreviewBtn.classList.add('show');
      }
      
      if (callback) callback(dataUrl);
    };
    
    reader.onerror = function(error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    };
    
    // Read based on file type
    if (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      reader.readAsDataURL(file);
    }
  }
};

