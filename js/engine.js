// Add new templates by just dropping .html files into /templates/ folder
// Template files should be named: template1.html, template2.html, template3.html, etc.
// They will automatically appear in the dropdown without changing code

/**
 * Template Engine - Core functionality for dynamic template loading and binding
 * This file contains all the logic for auto-binding inputs to preview elements
 * Converted from Google Apps Script to pure static web app
 */

var TemplateEngine = {
  currentTemplate: null,
  templateData: {},
  audioFile: null,
  languageDropdownInitialized: false,
  templateList: ['template1', 'template2', 'template3', 'template4'], // Auto-update: Add new template names here (without .html)

  /**
   * Initialize the template engine
   */
  init: function () {
    this.loadTemplates();
    this.setupEventListeners();
    // Initialize dropdown after a delay to ensure DOM is ready
    // Use longer delay to ensure shared panel elements are available
    setTimeout(function () {
      TemplateEngine.initializeLanguageDropdown();
    }, 800);
  },

  /**
   * Load available templates - automatically discovers templates in /templates/ folder
   * Falls back to hardcoded list if auto-discovery fails
   */
  loadTemplates: function () {
    // Try to auto-discover templates by attempting to fetch them
    // Start with known templates and check if they exist
    var self = this;
    var discoveredTemplates = [];
    var checkPromises = [];

    // Check templates from hardcoded list first
    this.templateList.forEach(function (templateName) {
      var checkPromise = fetch('templates/' + templateName + '.html', { method: 'HEAD' })
        .then(function (response) {
          if (response.ok) {
            return templateName;
          }
          return null;
        })
        .catch(function () {
          return null;
        });
      checkPromises.push(checkPromise);
    });

    // Also try to discover additional templates (template4, template5, etc.)
    for (var i = 4; i <= 20; i++) {
      (function (templateName) {
        var checkPromise = fetch('templates/' + templateName + '.html', { method: 'HEAD' })
          .then(function (response) {
            if (response.ok) {
              return templateName;
            }
            return null;
          })
          .catch(function () {
            return null;
          });
        checkPromises.push(checkPromise);
      })('template' + i);
    }

    Promise.all(checkPromises).then(function (results) {
      discoveredTemplates = results.filter(function (t) { return t !== null; });

      // If no templates discovered, use hardcoded list
      if (discoveredTemplates.length === 0) {
        discoveredTemplates = self.templateList;
      }

      // Sort templates naturally (template1, template2, template10, not template1, template10, template2)
      discoveredTemplates.sort(function (a, b) {
        var numA = parseInt(a.replace(/template/i, '')) || 0;
        var numB = parseInt(b.replace(/template/i, '')) || 0;
        return numA - numB;
      });

      self.populateTemplateDropdown(discoveredTemplates);
    }).catch(function (error) {
      console.warn('Template auto-discovery failed, using hardcoded list:', error);
      self.populateTemplateDropdown(self.templateList);
    });
  },

  /**
   * Populate template dropdown
   */
  populateTemplateDropdown: function (templates) {
    var select = document.getElementById('templateSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select a Template --</option>';

    templates.forEach(function (template) {
      var option = document.createElement('option');
      option.value = template;
      // Format display name: template1 -> Template 1, template2 -> Template 2
      var displayName = template.replace(/^template/i, 'Template ');
      option.textContent = displayName;
      select.appendChild(option);
    });
  },

  /**
   * Setup event listeners
   */
  setupEventListeners: function () {
    var select = document.getElementById('templateSelect');
    if (select) {
      select.addEventListener('change', this.handleTemplateChange.bind(this));
    }

    // Export button listeners
    var zipBtn = document.getElementById('downloadZipBtn');
    if (zipBtn) {
      zipBtn.addEventListener('click', function () {
        // Show time estimate before starting
        var languages = TemplateEngine.getSelectedLanguages();
        if (languages.length > 0 && typeof ExportFunctions !== 'undefined' && ExportFunctions.calculateTimeEstimate) {
          var estimatedTime = ExportFunctions.calculateTimeEstimate(languages);
          var timeEstimateDiv = document.getElementById('timeEstimate');
          var timeEstimateValue = document.getElementById('timeEstimateValue');
          if (timeEstimateDiv && timeEstimateValue) {
            timeEstimateDiv.style.display = 'block';
            timeEstimateValue.textContent = ExportFunctions.formatTimeEstimate(estimatedTime);
          }
        }
        TemplateEngine.downloadZip();
      });
    }

    var imagesBtn = document.getElementById('downloadImagesBtn');
    if (imagesBtn) {
      imagesBtn.addEventListener('click', function () {
        // Show time estimate before starting
        var languages = TemplateEngine.getSelectedLanguages();
        if (languages.length > 0 && typeof ExportFunctions !== 'undefined' && ExportFunctions.calculateImagesTimeEstimate) {
          var estimatedTime = ExportFunctions.calculateImagesTimeEstimate(languages);
          var timeEstimateDiv = document.getElementById('timeEstimate');
          var timeEstimateValue = document.getElementById('timeEstimateValue');
          if (timeEstimateDiv && timeEstimateValue) {
            timeEstimateDiv.style.display = 'block';
            timeEstimateValue.textContent = ExportFunctions.formatTimeEstimate(estimatedTime);
          }
        }
        TemplateEngine.downloadImages();
      });
    }

    var videoBtn = document.getElementById('downloadVideoBtn');
    if (videoBtn) {
      videoBtn.addEventListener('click', function () {
        // Show time estimate before starting (if audio is loaded)
        if (TemplateEngine.audioFile && typeof ExportFunctions !== 'undefined' && ExportFunctions.calculateVideoTimeEstimate) {
          // Get audio duration for estimation
          var audioFile = TemplateEngine.audioFile;
          var reader = new FileReader();
          reader.onload = function (e) {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(e.target.result).then(function (decodedAudio) {
              var languages = TemplateEngine.getSelectedLanguages();
              if (languages.length > 0) {
                var estimatedTime = ExportFunctions.calculateVideoTimeEstimate(languages, decodedAudio.duration);
                var timeEstimateDiv = document.getElementById('timeEstimate');
                var timeEstimateValue = document.getElementById('timeEstimateValue');
                if (timeEstimateDiv && timeEstimateValue) {
                  timeEstimateDiv.style.display = 'block';
                  var timeText = ExportFunctions.formatTimeEstimate(estimatedTime);
                  timeText += ' (Audio: ' + Math.ceil(decodedAudio.duration) + 's per video)';
                  timeEstimateValue.textContent = timeText;
                }
              }
            }).catch(function (err) {
              console.warn('Could not decode audio for time estimate:', err);
            });
          };
          reader.readAsArrayBuffer(audioFile);
        }
        TemplateEngine.downloadVideo();
      });
    }

    // Blur intensity control with live preview
    var blurIntensitySlider = document.getElementById('blurIntensity');
    var blurValueDisplay = document.getElementById('blurValue');
    if (blurIntensitySlider && blurValueDisplay) {
      blurIntensitySlider.addEventListener('input', function () {
        blurValueDisplay.textContent = this.value;
        // Update live preview
        if (typeof TemplateEngine !== 'undefined') {
          TemplateEngine.updateBlurPreview(parseInt(this.value));
        }
      });

      // Initialize preview on load (wait for ExportFunctions to be available)
      var initPreview = function () {
        if (typeof TemplateEngine !== 'undefined' && typeof ExportFunctions !== 'undefined' && ExportFunctions.createBlurredAdBackground) {
          TemplateEngine.updateBlurPreview(parseInt(blurIntensitySlider.value));
        } else {
          setTimeout(initPreview, 200);
        }
      };
      setTimeout(initPreview, 500);
    }
  },

  /**
   * Handle template selection change
   */
  handleTemplateChange: function (event) {
    var templateName = event.target.value;
    if (!templateName) {
      var container = document.getElementById('templateContainer');
      if (container) {
        container.innerHTML = '<div class="loading" id="loading"><div class="spinner"></div><p>Loading template...</p></div>';
      }
      var sharedPanel = document.getElementById('sharedPanel');
      if (sharedPanel) {
        sharedPanel.style.display = 'none';
      }
      this.currentTemplate = null;
      this.templateData = {};
      this.audioFile = null;
      return;
    }

    // Always load template, even if switching between templates
    this.loadTemplate(templateName);
  },

  /**
   * Load template content dynamically using fetch
   */
  loadTemplate: function (templateName) {
    var container = document.getElementById('templateContainer');
    var sharedPanel = document.getElementById('sharedPanel');

    if (!container) return;

    // Clear container and recreate loading element
    container.innerHTML = '<div class="loading active" id="loading"><div class="spinner"></div><p>Loading template...</p></div>';

    this.currentTemplate = templateName;
    this.templateData = {};
    this.audioFile = null;

    // Hide video button initially
    var videoBtn = document.getElementById('downloadVideoBtn');
    if (videoBtn) {
      videoBtn.style.display = 'none';
    }

    // Fetch template content
    fetch('templates/' + templateName + '.html')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Template not found: ' + templateName);
        }
        return response.text();
      })
      .then(function (htmlContent) {
        var loading = document.getElementById('loading');
        if (loading) {
          loading.classList.remove('active');
        }
        container.innerHTML = htmlContent;
        if (sharedPanel) {
          sharedPanel.style.display = 'block';
        }

        // Initialize binding after template loads
        TemplateEngine.initializeBinding();

        // Update language dropdown text (dropdown is already initialized on page load)
        setTimeout(function () {
          TemplateEngine.updateLanguageDropdownText();
        }, 100);
      })
      .catch(function (error) {
        console.error('Error loading template:', error);
        var loading = document.getElementById('loading');
        if (loading) {
          loading.classList.remove('active');
        }
        container.innerHTML = '<div class="error" style="padding: 40px; text-align: center; color: #d32f2f;">Error loading template: ' + error.message + '</div>';
      });
  },

  /**
   * Initialize auto-binding between inputs and preview elements
   */
  initializeBinding: function () {
    var container = document.getElementById('templateContainer');
    if (!container) return;

    // Find all input elements with data-field attributes
    var inputs = container.querySelectorAll('[data-field]');

    inputs.forEach(function (input) {
      var fieldName = input.getAttribute('data-field');

      // Initialize template data
      if (!TemplateEngine.templateData[fieldName]) {
        TemplateEngine.templateData[fieldName] = input.value || input.textContent || '';
      }

      // Setup event listeners based on input type
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
        // For number inputs, use 'input' event for real-time updates
        if (input.type === 'number' || input.type === 'range') {
          input.addEventListener('input', function () {
            TemplateEngine.updatePreview(fieldName, input.value);
            // Special handling for rewindSeconds and forwardSeconds - update display format
            if (fieldName === 'rewindSeconds' || fieldName === 'forwardSeconds') {
              var container = document.getElementById('templateContainer');
              if (container) {
                var displayElements = container.querySelectorAll('[data-field="' + fieldName + '"]');
                displayElements.forEach(function (el) {
                  if (el.classList && el.classList.contains('control-btn-text')) {
                    el.textContent = input.value + 's';
                  } else if (el.tagName !== 'INPUT') {
                    el.textContent = input.value + 's';
                  }
                });
              }
            }
          });
        }
        // For all inputs, also listen to 'change' event
        input.addEventListener('change', function () {
          TemplateEngine.updatePreview(fieldName, input.value);
          // Special handling for rewindSeconds and forwardSeconds
          if (fieldName === 'rewindSeconds' || fieldName === 'forwardSeconds') {
            var container = document.getElementById('templateContainer');
            if (container) {
              var displayElements = container.querySelectorAll('[data-field="' + fieldName + '"]');
              displayElements.forEach(function (el) {
                if (el.classList && el.classList.contains('control-btn-text')) {
                  el.textContent = input.value + 's';
                } else if (el.tagName !== 'INPUT') {
                  el.textContent = input.value + 's';
                }
              });
            }
          }
        });
        // For text inputs, also listen to 'input' for real-time updates
        if (input.type === 'text' || input.type === 'textarea' || input.type === 'color') {
          input.addEventListener('input', function () {
            TemplateEngine.updatePreview(fieldName, input.value);
          });
        }
      } else if (input.tagName === 'SELECT') {
        input.addEventListener('change', function () {
          TemplateEngine.updatePreview(fieldName, input.value);
        });
      }

      // Handle file inputs (for images and audio)
      if (input.type === 'file') {
        input.addEventListener('change', function (e) {
          if (e.target.files && e.target.files.length > 0) {
            TemplateEngine.handleFileInput(fieldName, e.target.files[0]);
          } else {
            // File input cleared - remove image
            if (fieldName === 'thumbnail' || fieldName.includes('thumbnail')) {
              TemplateEngine.removeThumbnailImage();
            }
          }
        });
      }
    });

    // Initialize preview elements with current values
    this.syncPreview();
  },

  /**
   * Update preview element when input changes
   * NOW USES CENTRALIZED FieldHandler - Auto-detects field type from name!
   */
  updatePreview: function (fieldName, value) {
    var container = document.getElementById('templateContainer');
    if (!container) return;

    this.templateData[fieldName] = value;

    // Special handling for animation fields
    if (fieldName.includes('Animation') || fieldName.includes('animation')) {
      var animationElements = container.querySelectorAll('[data-field-animation="' + fieldName + '"]');
      animationElements.forEach(function(element) {
        FieldHandler.updateAnimation(element, value, fieldName);
      });
      return; // Exit early for animation fields
    }

    // Find the input element
    var inputElement = container.querySelector('input[data-field="' + fieldName + '"], textarea[data-field="' + fieldName + '"], select[data-field="' + fieldName + '"]');
    var inputType = inputElement ? inputElement.type : '';

    // Special handling for font size fields that target nested elements
    // Also handle color fields that target child elements
    if (inputType === 'number' && (fieldName.endsWith('Size') || fieldName.includes('FontSize'))) {
      var baseFieldName = fieldName.replace(/Size$/, '').replace(/FontSize$/, '');
      // Try to find element with data-field-size attribute first
      var sizeTarget = container.querySelector('[data-field-size="' + fieldName + '"]');

      if (!sizeTarget) {
        // Fallback: find by base field name
        var textContainer = container.querySelector('[data-field="' + baseFieldName + '"]');
        if (textContainer) {
          if (fieldName.includes('headerMain')) {
            sizeTarget = textContainer.querySelector('.header-main') || textContainer;
          } else if (fieldName.includes('headerSub')) {
            sizeTarget = textContainer.querySelector('.header-sub') || textContainer;
          } else if (fieldName.includes('subtitle')) {
            sizeTarget = textContainer.querySelector('.subtitle-text') || textContainer;
          } else if (fieldName.includes('footer')) {
            sizeTarget = textContainer.querySelector('.footer-text') || textContainer;
          } else {
            sizeTarget = textContainer;
          }
        }
      }

      if (sizeTarget) {
        FieldHandler.updateSize(sizeTarget, value, fieldName);
        return;
      }
    }

    // Special handling for link fields
    if (fieldName.includes('Link') || fieldName.includes('link') || fieldName === 'playButtonLink') {
      var linkElements = container.querySelectorAll('[data-field-link="' + fieldName + '"], a[data-field="' + fieldName + '"]');
      linkElements.forEach(function (element) {
        if (element.tagName === 'A') {
          element.href = value || '#';
          element.setAttribute('data-field-link', fieldName);
        }
      });
    }

    // Special handling for color fields that target child elements
    if (inputType === 'color' && fieldName.endsWith('Color') && !fieldName.includes('Bg')) {
      // Find all elements with data-field-color matching this color field
      var colorTargets = container.querySelectorAll('[data-field-color="' + fieldName + '"]');
      colorTargets.forEach(function (target) {
        FieldHandler.updateColor(target, value, fieldName);
      });

      // Also update elements with matching data-field (for backward compatibility)
      var colorElements = container.querySelectorAll('[data-field="' + fieldName + '"]');
      colorElements.forEach(function (element) {
        if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA' && element.tagName !== 'SELECT') {
          FieldHandler.updateColor(element, value, fieldName);
        }
      });
    }

    // Find all preview elements with matching data-field
    var previewElements = container.querySelectorAll('[data-field="' + fieldName + '"]');

    // Also find elements with data-field-* attributes (for child element targeting)
    var attrVariations = [
      '[data-field-' + fieldName.toLowerCase() + ']',
      '[data-field-color="' + fieldName + '"]',
      '[data-field-size="' + fieldName + '"]',
      '[data-field-top="' + fieldName + '"]',
      '[data-field-right="' + fieldName + '"]',
      '[data-field-height="' + fieldName + '"]',
      '[data-field-link="' + fieldName + '"]'
    ];

    var childElements = [];
    attrVariations.forEach(function (selector) {
      try {
        var found = container.querySelectorAll(selector);
        found.forEach(function (el) { childElements.push(el); });
      } catch (e) {
        // Invalid selector, skip
      }
    });

    // Combine both sets
    var allElements = [];
    previewElements.forEach(function (el) {
      if (allElements.indexOf(el) === -1) allElements.push(el);
    });
    childElements.forEach(function (el) {
      if (allElements.indexOf(el) === -1) allElements.push(el);
    });

    allElements.forEach(function (element) {
      // Skip input elements (only update preview elements)
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        return;
      }

      // Handle link fields specially
      if (fieldName.includes('Link') || fieldName.includes('link') || fieldName === 'playButtonLink') {
        if (element.tagName === 'A') {
          element.href = value || '#';
        }
        return;
      }

      // USE CENTRALIZED FieldHandler - Auto-detects type and handles correctly!
      FieldHandler.updatePreview(fieldName, value, element, inputElement);

      // OLD CODE BELOW - Keeping for reference but FieldHandler handles it now
      /*
      
      // Handle color inputs - NEVER set text content, only styles
      if (inputType === 'color') {
        // Background colors: ends with 'Bg' or contains 'BgColor' or 'Background'
        if (fieldName.endsWith('Bg') || fieldName.includes('BgColor') || fieldName.includes('Background')) {
          element.style.backgroundColor = value;
          // Remove any hex code text that might be showing
          if (element.textContent && element.textContent.match(/^#[0-9a-fA-F]{3,6}$/)) {
            element.textContent = '';
          }
          return;
        }
        // Text colors: ends with 'Color' or contains 'TextColor'
        if (fieldName.endsWith('Color') || fieldName.includes('TextColor')) {
          element.style.color = value;
          // Also update child text elements (common pattern: headerColor updates header-main, header-sub)
          var childTextElements = element.querySelectorAll('.header-main, .header-sub, .subtitle-text, .footer-text, [class*="text"], [class*="title"]');
          childTextElements.forEach(function(textEl) {
            textEl.style.color = value;
            // Remove any hex code text from children too
            if (textEl.textContent && textEl.textContent.match(/^#[0-9a-fA-F]{3,6}$/)) {
              textEl.textContent = '';
            }
          });
          return;
        }
      }
      
      // Handle number inputs (dimensions, padding, margin, etc. - NOT font sizes, handled above)
      if (inputType === 'number') {
        // Width: ends with 'Width' or contains 'Width' - ONLY update style, NOT text content
        if (fieldName.endsWith('Width') || fieldName.includes('Width')) {
          element.style.width = value + 'px';
          // Remove any numeric text that might be showing (like "320")
          if (element.textContent && element.textContent.trim().match(/^\d+$/)) {
            // Only remove if it's a pure number and element has children (means it's a container)
            if (element.children.length > 0) {
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
          return;
        }
        // Height: ends with 'Height' or contains 'Height'
        if (fieldName.endsWith('Height') || fieldName.includes('Height')) {
          element.style.height = value + 'px';
          // Remove any numeric text that might be showing
          if (element.textContent && element.textContent.trim().match(/^\d+$/)) {
            if (element.children.length > 0) {
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
          return;
        }
        // Padding Top/Bottom - update specific sections
        if (fieldName.includes('headerPaddingTop')) {
          var header = container.querySelector('.ad-header[data-field="headerBg"]');
          if (header) {
            var currentPadding = window.getComputedStyle(header).padding || '12px 15px';
            var paddingParts = currentPadding.split(' ');
            header.style.paddingTop = value + 'px';
            header.style.paddingBottom = paddingParts[2] || '12px';
            header.style.paddingLeft = paddingParts[3] || paddingParts[1] || '15px';
            header.style.paddingRight = paddingParts[1] || '15px';
          }
          return;
        }
        if (fieldName.includes('headerPaddingBottom')) {
          var header = container.querySelector('.ad-header[data-field="headerBg"]');
          if (header) {
            var currentPadding = window.getComputedStyle(header).padding || '12px 15px';
            var paddingParts = currentPadding.split(' ');
            header.style.paddingBottom = value + 'px';
            header.style.paddingTop = paddingParts[0] || '12px';
            header.style.paddingLeft = paddingParts[3] || paddingParts[1] || '15px';
            header.style.paddingRight = paddingParts[1] || '15px';
          }
          return;
        }
        if (fieldName.includes('subtitlePaddingTop')) {
          var subtitle = container.querySelector('.ad-subtitle[data-field="subtitleBg"]');
          if (subtitle) {
            var currentPadding = window.getComputedStyle(subtitle).padding || '10px 15px';
            var paddingParts = currentPadding.split(' ');
            subtitle.style.paddingTop = value + 'px';
            subtitle.style.paddingBottom = paddingParts[2] || '10px';
            subtitle.style.paddingLeft = paddingParts[3] || paddingParts[1] || '15px';
            subtitle.style.paddingRight = paddingParts[1] || '15px';
          }
          return;
        }
        if (fieldName.includes('subtitlePaddingBottom')) {
          var subtitle = container.querySelector('.ad-subtitle[data-field="subtitleBg"]');
          if (subtitle) {
            var currentPadding = window.getComputedStyle(subtitle).padding || '10px 15px';
            var paddingParts = currentPadding.split(' ');
            subtitle.style.paddingBottom = value + 'px';
            subtitle.style.paddingTop = paddingParts[0] || '10px';
            subtitle.style.paddingLeft = paddingParts[3] || paddingParts[1] || '15px';
            subtitle.style.paddingRight = paddingParts[1] || '15px';
          }
          return;
        }
        if (fieldName.includes('footerPaddingTop')) {
          var footer = container.querySelector('.ad-footer[data-field="footerBg"]');
          if (footer) {
            var currentPadding = window.getComputedStyle(footer).padding || '18px 15px';
            var paddingParts = currentPadding.split(' ');
            footer.style.paddingTop = value + 'px';
            footer.style.paddingBottom = paddingParts[2] || '18px';
            footer.style.paddingLeft = paddingParts[3] || paddingParts[1] || '15px';
            footer.style.paddingRight = paddingParts[1] || '15px';
          }
          return;
        }
        if (fieldName.includes('footerPaddingBottom')) {
          var footer = container.querySelector('.ad-footer[data-field="footerBg"]');
          if (footer) {
            var currentPadding = window.getComputedStyle(footer).padding || '18px 15px';
            var paddingParts = currentPadding.split(' ');
            footer.style.paddingBottom = value + 'px';
            footer.style.paddingTop = paddingParts[0] || '18px';
            footer.style.paddingLeft = paddingParts[3] || paddingParts[1] || '15px';
            footer.style.paddingRight = paddingParts[1] || '15px';
          }
          return;
        }
        if (fieldName.includes('Padding')) {
          element.style.padding = value + 'px';
          return;
        }
        // Margin
        if (fieldName.includes('Margin')) {
          element.style.margin = value + 'px';
          return;
        }
        // Button sizes - handle data-size attribute (these don't have matching data-field)
        if (fieldName.includes('playButtonSize') || fieldName.includes('PlayButtonSize')) {
          var playButtons = container.querySelectorAll('.play-button[data-size="playButtonSize"]');
          playButtons.forEach(function(btn) {
            btn.style.width = value + 'px';
            btn.style.height = value + 'px';
          });
          // Also update play icon size proportionally
          var playIcons = container.querySelectorAll('.play-icon');
          playIcons.forEach(function(icon) {
            var iconSize = Math.min(value * 0.25, 22);
            icon.style.borderLeftWidth = iconSize + 'px';
            icon.style.borderTopWidth = (iconSize * 0.6) + 'px';
            icon.style.borderBottomWidth = (iconSize * 0.6) + 'px';
          });
          return;
        }
        if (fieldName.includes('controlButtonSize') || fieldName.includes('ControlButtonSize')) {
          var controlButtons = container.querySelectorAll('.control-btn[data-size="controlButtonSize"]');
          controlButtons.forEach(function(btn) {
            btn.style.width = value + 'px';
            btn.style.height = value + 'px';
          });
          return;
        }
        // Watermark positions
        if (fieldName.includes('watermarkTop') || fieldName.includes('WatermarkTop')) {
          // Find watermark element and update top position
          var watermark = container.querySelector('.watermark[data-field="watermark"]');
          if (watermark) {
            watermark.style.top = value + 'px';
          }
          return;
        }
        if (fieldName.includes('watermarkRight') || fieldName.includes('WatermarkRight')) {
          // Find watermark element and update right position
          var watermark = container.querySelector('.watermark[data-field="watermark"]');
          if (watermark) {
            watermark.style.right = value + 'px';
          }
          return;
        }
        if (fieldName.includes('watermarkSize') || fieldName.includes('WatermarkSize')) {
          // Find watermark element and update font size
          var watermark = container.querySelector('.watermark[data-field="watermark"]');
          if (watermark) {
            watermark.style.fontSize = value + 'px';
          }
          return;
        }
        // Video height
        if (fieldName.includes('videoHeight') || fieldName.includes('VideoHeight')) {
          // Find video section element
          var videoSection = container.querySelector('.video-section');
          if (videoSection) {
            videoSection.style.height = value + 'px';
          }
          return;
        }
        // Rewind/Forward seconds (text content)
        if (fieldName.includes('rewindSeconds') || fieldName.includes('RewindSeconds')) {
          // Find rewind button and update text
          var rewindBtn = container.querySelector('.control-btn:first-child span:last-child');
          if (rewindBtn) {
            rewindBtn.textContent = value;
          }
          return;
        }
        if (fieldName.includes('forwardSeconds') || fieldName.includes('ForwardSeconds')) {
          // Find forward button and update text
          var forwardBtn = container.querySelector('.control-btn:last-child span:first-child');
          if (forwardBtn) {
            forwardBtn.textContent = value;
          }
          return;
        }
      }
      
      // Handle file inputs (images, audio) - background images
      if (inputType === 'file' && value && (value.startsWith('data:') || value.startsWith('blob:'))) {
        // Check if element is a container that should show background image
        if (element.classList.contains('video-section') || element.classList.contains('image-container') || 
            fieldName.includes('thumbnail') || fieldName.includes('background') || fieldName.includes('image')) {
          element.style.backgroundImage = 'url(' + value + ')';
          element.style.backgroundSize = 'cover';
          element.style.backgroundPosition = 'center';
          return;
        }
        // Otherwise treat as img src
        if (element.tagName === 'IMG') {
          element.src = value;
          return;
        }
      }
      
      // Handle style updates (padding, margin, etc.)
      if (fieldName.includes('Padding')) {
        element.style.padding = value;
        return;
      }
      
      if (fieldName.includes('Margin')) {
        element.style.margin = value;
        return;
      }
      
      // Update based on element type
      if (element.tagName === 'IMG') {
        if (value && (value.startsWith('data:') || value.startsWith('http') || value.startsWith('blob:'))) {
          element.src = value;
        }
      } else if (element.tagName === 'VIDEO' || element.tagName === 'AUDIO') {
        if (value && (value.startsWith('data:') || value.startsWith('http') || value.startsWith('blob:'))) {
          element.src = value;
        }
      } else {
        // Default: update text content
        // BUT: Skip if element has width/height data-field (these are style-only)
        if (fieldName.includes('Width') || fieldName.includes('Height') || 
            fieldName.includes('Size') || fieldName.includes('Padding') || 
            fieldName.includes('Margin') || fieldName.includes('Top') || 
            fieldName.includes('Bottom') || fieldName.includes('Right') || 
            fieldName.includes('Left')) {
          // These are style-only fields, don't update text content
          return;
        }
        
        // Skip file paths
        if (typeof value === 'string' && (value.includes('fakepath') || value.includes('C:\\') || value.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp)$/i))) {
          return; // Skip file paths
        }
        
        // Skip hex color codes (they should only be used for styles, not text)
        if (typeof value === 'string' && value.match(/^#[0-9a-fA-F]{3,6}$/)) {
          return; // Skip hex codes as text content
        }
        
        // Skip pure numeric values if element has children (it's a container, not a text element)
        if (typeof value === 'string' && value.trim().match(/^\d+$/) && element.children.length > 0) {
          var dataField = element.getAttribute('data-field');
          // If it's a dimension field, don't set as text
          if (dataField && (dataField.includes('Width') || dataField.includes('Height') || 
              dataField.includes('Size') || dataField.includes('Padding') || 
              dataField.includes('Margin'))) {
            return; // Skip numeric values for dimension fields
          }
        }
        
        element.textContent = value;
        // Also try innerHTML for HTML content (but be careful)
        if (value && value.includes('<')) {
          element.innerHTML = value;
        }
      }
      */
    });
  },

  /**
   * Handle file input (images, audio, video)
   * NOW USES CENTRALIZED FieldHandler - Auto-detects type from field name!
   */
  handleFileInput: function (fieldName, file) {
    if (!file) return;

    // Use centralized FieldHandler
    FieldHandler.handleFileInput(fieldName, file, function (dataUrl) {
      console.log('File uploaded for field "' + fieldName + '":', dataUrl.substring(0, 50) + '...');

      // Show remove button in preview (NOT hiding play controls)
      if (fieldName === 'thumbnail' || fieldName.includes('thumbnail')) {
        var removePreviewBtn = document.getElementById('removeThumbnailPreviewBtn');
        if (removePreviewBtn) removePreviewBtn.classList.add('show');
      }

      // Remove any file path text that might be showing in preview (but keep play controls visible)
      var container = document.getElementById('templateContainer');
      if (container) {
        var allElements = container.querySelectorAll('.preview-panel *');
        allElements.forEach(function (el) {
          // NEVER hide play-controls or control buttons
          if (el.classList.contains('play-controls') || 
              el.classList.contains('control-btn') || 
              el.classList.contains('play-button') ||
              el.closest('.play-controls')) {
            return; // Skip play controls
          }
          
          var text = el.textContent || '';
          if ((text.includes('fakepath') || text.includes('C:\\') ||
            text.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp|mp3|wav|mp4|webm)$/i) ||
            (file.name && text.includes(file.name))) &&
            el.tagName !== 'INPUT' && el.tagName !== 'LABEL') {
            var dataField = el.getAttribute('data-field');
            if (!dataField || dataField === fieldName) {
              el.style.display = 'none';
              el.textContent = '';
              el.innerHTML = '';
            }
          }
        });
        
        // Ensure play-controls are always visible after image upload
        var playControls = container.querySelector('.play-controls');
        if (playControls) {
          playControls.style.display = 'flex';
          playControls.style.visibility = 'visible';
          playControls.style.opacity = '1';
        }
      }
    });
  },

  /**
   * Remove thumbnail image
   */
  removeThumbnailImage: function () {
    // Clear template data
    this.templateData['thumbnail'] = null;

    // Clear file input
    var thumbnailInput = document.getElementById('thumbnailInput');
    if (thumbnailInput) {
      thumbnailInput.value = '';
    }

    // Hide remove buttons
    var removeBtn = document.getElementById('removeThumbnailBtn');
    var removePreviewBtn = document.getElementById('removeThumbnailPreviewBtn');
    if (removeBtn) removeBtn.style.display = 'none';
    if (removePreviewBtn) removePreviewBtn.classList.remove('show');

    // Clear background image and ensure play-controls are visible
    var videoSection = document.querySelector('.video-section[data-field="thumbnail"]');
    if (videoSection) {
      // Clear background image
      videoSection.style.backgroundImage = '';
      videoSection.style.backgroundColor = '#1a1a1a';
      
      // CRITICAL: Ensure play-controls are ALWAYS visible after removing image
      var playControls = videoSection.querySelector('.play-controls');
      if (playControls) {
        playControls.style.display = 'flex';
        playControls.style.visibility = 'visible';
        playControls.style.opacity = '1';
        playControls.style.position = 'relative';
        playControls.style.zIndex = '10';
      }
      
      // Also ensure individual buttons are visible
      var controlBtns = videoSection.querySelectorAll('.control-btn, .play-button');
      controlBtns.forEach(function(btn) {
        btn.style.display = 'flex';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
      });
    }

    console.log('Thumbnail image removed');
  },

  /**
   * Handle rewind button click
   */
  handleRewind: function () {
    var rewindSeconds = parseInt(this.templateData['rewindSeconds'] || document.querySelector('input[data-field="rewindSeconds"]')?.value || '10', 10);
    console.log('Rewind ' + rewindSeconds + ' seconds');
    // Add your video rewind logic here
    alert('Rewind ' + rewindSeconds + ' seconds');
  },

  /**
   * Handle forward button click
   */
  handleForward: function () {
    var forwardSeconds = parseInt(this.templateData['forwardSeconds'] || document.querySelector('input[data-field="forwardSeconds"]')?.value || '10', 10);
    console.log('Forward ' + forwardSeconds + ' seconds');
    // Add your video forward logic here
    alert('Forward ' + forwardSeconds + ' seconds');
  },

  /**
   * Sync all preview elements with current input values
   */
  syncPreview: function () {
    var container = document.getElementById('templateContainer');
    if (!container) return;

    var inputs = container.querySelectorAll('[data-field]');

    inputs.forEach(function (input) {
      var fieldName = input.getAttribute('data-field');
      var value = input.value || input.textContent || '';

      if (input.tagName !== 'INPUT' && input.tagName !== 'TEXTAREA' && input.tagName !== 'SELECT') {
        return;
      }

      // Skip file inputs during initial sync (they'll be handled when file is selected)
      if (input.type === 'file') {
        return;
      }

      TemplateEngine.updatePreview(fieldName, value);
    });

    // Remove any file path text overlays and hex codes that might be showing
    var allElements = container.querySelectorAll('.preview-panel *');
    allElements.forEach(function (el) {
      var text = el.textContent || '';

      // Remove file paths
      if ((text.includes('fakepath') || text.includes('C:\\') ||
        text.match(/^[A-Z]:\\.*\.(jpg|jpeg|png|gif|webp)$/i)) &&
        el.tagName !== 'INPUT' && el.tagName !== 'LABEL') {
        var dataField = el.getAttribute('data-field');
        if (!dataField || dataField.includes('thumbnail') || dataField.includes('image')) {
          el.style.display = 'none';
          el.textContent = '';
          el.innerHTML = '';
        }
      }

      // Remove hex color codes showing as text (like #00000, #2c5f8d, #8b2e2e)
      if (text.match(/^#[0-9a-fA-F]{3,6}$/) && el.tagName !== 'INPUT' && el.tagName !== 'LABEL') {
        var dataField = el.getAttribute('data-field');
        // Only remove if it's a color field (Bg, Color) or if it's not a content field
        if (dataField && (dataField.includes('Bg') || dataField.includes('Color'))) {
          el.textContent = '';
          el.innerHTML = '';
        } else if (!dataField) {
          el.style.display = 'none';
          el.textContent = '';
          el.innerHTML = '';
        }
      }

      // Remove pure numeric text (like "320") from container elements that have children
      // This prevents width/height values from showing as text
      if (text.match(/^\d+$/) && el.tagName !== 'INPUT' && el.tagName !== 'LABEL' && el.children.length > 0) {
        var dataField = el.getAttribute('data-field');
        // Remove if it's a dimension field (Width, Height) or if it's a container
        if (dataField && (dataField.includes('Width') || dataField.includes('Height'))) {
          // Remove text nodes that are pure numbers
          var textNodes = [];
          for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3) { // Text node
              textNodes.push(el.childNodes[i]);
            }
          }
          textNodes.forEach(function (node) {
            if (node.textContent.trim().match(/^\d+$/)) {
              node.remove();
            }
          });
        }
      }
    });
  },

  /**
   * Get all field values from current template
   * Captures images from preview elements directly to ensure uploaded images are included
   */
  getFieldValues: function () {
    var container = document.getElementById('templateContainer');
    if (!container) return {};

    var inputs = container.querySelectorAll('[data-field]');
    var currentValues = {};

    // Get current values from all input elements
    inputs.forEach(function (input) {
      var fieldName = input.getAttribute('data-field');

      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') {
        if (input.type === 'file') {
          // For file inputs, check multiple sources:
          // 1. Check templateData (stored when file was uploaded)
          // 2. Check preview image element src (current displayed image)
          var imageValue = null;

          if (TemplateEngine.templateData[fieldName] &&
            (TemplateEngine.templateData[fieldName].startsWith('data:') ||
              TemplateEngine.templateData[fieldName].startsWith('blob:'))) {
            imageValue = TemplateEngine.templateData[fieldName];
          } else {
            // Try to get from preview image element
            var previewImg = container.querySelector('img[data-field="' + fieldName + '"]');
            if (previewImg && previewImg.src &&
              (previewImg.src.startsWith('data:') || previewImg.src.startsWith('blob:'))) {
              imageValue = previewImg.src;
            }
          }

          if (imageValue) {
            currentValues[fieldName] = imageValue;
          }
        } else {
          currentValues[fieldName] = input.value || '';
        }
      }
    });

    // Also get values from preview elements (for images that might not have input)
    var previewImages = container.querySelectorAll('img[data-field]');
    previewImages.forEach(function (img) {
      var fieldName = img.getAttribute('data-field');
      // Only add if it's a data URL or blob URL (uploaded image)
      if (img.src && (img.src.startsWith('data:') || img.src.startsWith('blob:'))) {
        if (!currentValues[fieldName] || !currentValues[fieldName].startsWith('data:')) {
          currentValues[fieldName] = img.src;
        }
      }
    });

    // Merge with templateData to include any programmatically set values
    for (var key in this.templateData) {
      if (!currentValues.hasOwnProperty(key)) {
        currentValues[key] = this.templateData[key];
      } else if (key in this.templateData &&
        this.templateData[key] &&
        this.templateData[key].startsWith('data:')) {
        // Prefer templateData for images (more reliable)
        currentValues[key] = this.templateData[key];
      }
    }

    console.log('Captured field values:', Object.keys(currentValues));
    return currentValues;
  },

  /**
   * Get selected source language
   */
  getSourceLanguage: function () {
    var sourceSelect = document.getElementById('sourceLanguageSelect');
    if (sourceSelect && sourceSelect.value) {
      return sourceSelect.value;
    }
    return 'en'; // Default to English if not found
  },

  /**
   * Get selected languages
   */
  getSelectedLanguages: function () {
    var checkboxes = document.querySelectorAll('.language-checkbox input[type="checkbox"]:checked');
    var languages = [];
    checkboxes.forEach(function (cb) {
      // Skip the "Select All" checkbox
      if (cb.id !== 'selectAllLanguages' && cb.value) {
        languages.push(cb.value);
      }
    });
    return languages;
  },

  /**
   * Select or deselect all languages
   */
  toggleSelectAllLanguages: function (selectAll) {
    var checkboxes = document.querySelectorAll('.language-checkbox input[type="checkbox"]');
    checkboxes.forEach(function (cb) {
      // Skip the "Select All" checkbox itself
      if (cb.id !== 'selectAllLanguages') {
        cb.checked = selectAll;
      }
    });
    this.updateLanguageDropdownText();
  },

  /**
   * Update language dropdown text
   */
  updateLanguageDropdownText: function () {
    var selected = this.getSelectedLanguages();
    var text = document.getElementById('languageDropdownText');
    if (text) {
      if (selected.length === 0) {
        text.textContent = 'Select Languages (0 selected)';
      } else if (selected.length === 1) {
        text.textContent = '1 language selected';
      } else {
        text.textContent = selected.length + ' languages selected';
      }
    }
  },

  /**
   * Initialize language dropdown
   */
  initializeLanguageDropdown: function () {
    var dropdown = document.getElementById('languageDropdown');
    var button = document.getElementById('languageDropdownButton');
    var content = document.getElementById('languageDropdownContent');
    var searchInput = document.getElementById('languageSearch');
    var list = document.getElementById('languageDropdownList');

    if (!dropdown || !button || !content || !list) {
      console.log('Language dropdown elements not found, retrying in 200ms...');
      // Retry after a short delay if elements aren't ready
      setTimeout(function () {
        TemplateEngine.initializeLanguageDropdown();
      }, 200);
      return;
    }

    // Prevent duplicate initialization - but allow re-initialization if needed
    if (dropdown.dataset.initialized === 'true') {
      console.log('Language dropdown already initialized, just updating text');
      this.updateLanguageDropdownText();
      // Re-attach checkbox listeners in case they were lost
      var checkboxes = list.querySelectorAll('input[type="checkbox"]');
      var self = this;
      checkboxes.forEach(function (cb) {
        if (!cb.hasAttribute('data-dropdown-listener')) {
          cb.setAttribute('data-dropdown-listener', 'true');
          cb.addEventListener('change', function () {
            self.updateLanguageDropdownText();
          });
        }
      });
      return;
    }

    // Mark as initialized
    dropdown.dataset.initialized = 'true';
    console.log('Initializing language dropdown...');

    // Toggle dropdown
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
      if (dropdown.classList.contains('open')) {
        content.style.display = 'flex';
        if (searchInput) searchInput.focus();
      } else {
        content.style.display = 'none';
      }
    });

    // Close dropdown when clicking outside
    var clickOutsideHandler = function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        content.style.display = 'none';
      }
    };
    document.addEventListener('click', clickOutsideHandler);

    // Store handler for cleanup if needed
    dropdown._clickOutsideHandler = clickOutsideHandler;

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var searchTerm = this.value.toLowerCase();
        var checkboxes = list.querySelectorAll('.language-checkbox');
        checkboxes.forEach(function (checkbox) {
          var selectAllCheckbox = checkbox.querySelector('#selectAllLanguages');
          // Always show "Select All" checkbox
          if (selectAllCheckbox) {
            checkbox.style.display = 'flex';
          } else {
            var label = checkbox.querySelector('label');
            if (label) {
              var text = label.textContent.toLowerCase();
              checkbox.style.display = text.includes(searchTerm) ? 'flex' : 'none';
            }
          }
        });
      });
    }

    // Handle "Select All" checkbox
    var selectAllCheckbox = document.getElementById('selectAllLanguages');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', function () {
        var self = TemplateEngine;
        var selectAll = this.checked;
        self.toggleSelectAllLanguages(selectAll);
      });
    }

    // Update dropdown text when checkboxes change
    var checkboxes = list.querySelectorAll('input[type="checkbox"]');
    var self = this;
    checkboxes.forEach(function (cb) {
      // Check if listener already exists
      if (!cb.hasAttribute('data-dropdown-listener')) {
        cb.setAttribute('data-dropdown-listener', 'true');
        cb.addEventListener('change', function () {
          // Update "Select All" checkbox state
          if (cb.id !== 'selectAllLanguages') {
            var allCheckboxes = list.querySelectorAll('.language-checkbox input[type="checkbox"]:not(#selectAllLanguages)');
            var checkedCount = list.querySelectorAll('.language-checkbox input[type="checkbox"]:not(#selectAllLanguages):checked').length;
            if (selectAllCheckbox) {
              selectAllCheckbox.checked = (checkedCount === allCheckboxes.length);
              selectAllCheckbox.indeterminate = (checkedCount > 0 && checkedCount < allCheckboxes.length);
            }
          }
          self.updateLanguageDropdownText();
        });
      }
    });

    // Initial update
    this.updateLanguageDropdownText();

    // Update "Select All" checkbox initial state
    if (selectAllCheckbox) {
      var allCheckboxes = list.querySelectorAll('.language-checkbox input[type="checkbox"]:not(#selectAllLanguages)');
      var checkedCount = list.querySelectorAll('.language-checkbox input[type="checkbox"]:not(#selectAllLanguages):checked').length;
      selectAllCheckbox.checked = (checkedCount === allCheckboxes.length);
      selectAllCheckbox.indeterminate = (checkedCount > 0 && checkedCount < allCheckboxes.length);
    }

    console.log('Language dropdown initialized successfully');
  },

  /**
   * Update blur preview demo
   * Shows live preview of blur effect
   */
  updateBlurPreview: function (blurIntensity) {
    var previewCanvas = document.getElementById('blurPreviewCanvas');
    if (!previewCanvas || typeof ExportFunctions === 'undefined') {
      return;
    }

    try {
      var ctx = previewCanvas.getContext('2d');
      var previewWidth = 200;
      var previewHeight = 150;

      // Create demo source image (320x480 scaled down for preview)
      var sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = 320;
      sourceCanvas.height = 480;
      var sourceCtx = sourceCanvas.getContext('2d');

      // Draw a colorful demo ad pattern
      // Background gradient
      var bgGradient = sourceCtx.createLinearGradient(0, 0, 320, 480);
      bgGradient.addColorStop(0, '#667eea');
      bgGradient.addColorStop(0.5, '#764ba2');
      bgGradient.addColorStop(1, '#f093fb');
      sourceCtx.fillStyle = bgGradient;
      sourceCtx.fillRect(0, 0, 320, 480);

      // Add some demo content (circles, rectangles, text)
      sourceCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      sourceCtx.fillRect(40, 100, 240, 120);

      sourceCtx.fillStyle = '#667eea';
      sourceCtx.font = 'bold 24px Arial';
      sourceCtx.textAlign = 'center';
      sourceCtx.fillText('DEMO AD', 160, 160);

      sourceCtx.fillStyle = '#764ba2';
      sourceCtx.font = '16px Arial';
      sourceCtx.fillText('Sample Content', 160, 190);

      // Add some decorative elements
      sourceCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      sourceCtx.beginPath();
      sourceCtx.arc(80, 250, 30, 0, Math.PI * 2);
      sourceCtx.fill();

      sourceCtx.beginPath();
      sourceCtx.arc(240, 250, 30, 0, Math.PI * 2);
      sourceCtx.fill();

      sourceCtx.fillStyle = '#fff';
      sourceCtx.fillRect(120, 300, 80, 40);
      sourceCtx.fillStyle = '#667eea';
      sourceCtx.font = 'bold 14px Arial';
      sourceCtx.fillText('BUTTON', 160, 325);

      // Now apply blur effect using ExportFunctions method
      if (ExportFunctions.createBlurredAdBackground) {
        var blurredBg = ExportFunctions.createBlurredAdBackground(sourceCanvas, previewWidth, previewHeight, blurIntensity);

        // Draw blurred background
        ctx.drawImage(blurredBg, 0, 0);

        // Draw centered sharp demo ad on top (maintains 320×480 aspect ratio, no stretching)
        // Math.min ensures ad fits within preview while maintaining exact aspect ratio
        var scale = Math.min(previewWidth / 320, previewHeight / 480);
        var scaledWidth = 320 * scale;  // Maintains 320×480 aspect ratio
        var scaledHeight = 480 * scale; // Maintains 320×480 aspect ratio
        var x = (previewWidth - scaledWidth) / 2;  // Center horizontally
        var y = (previewHeight - scaledHeight) / 2; // Center vertically

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Draw ad - maintains original aspect ratio, never stretched
        ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
      } else {
        // Fallback: simple preview
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, previewWidth, previewHeight);
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Preview Loading...', previewWidth / 2, previewHeight / 2);
      }
    } catch (error) {
      console.error('Error updating blur preview:', error);
      var ctx = previewCanvas.getContext('2d');
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Preview Error', previewCanvas.width / 2, previewCanvas.height / 2);
    }
  },

  /**
   * Download ZIP file
   */
  downloadZip: function () {
    if (typeof ExportFunctions !== 'undefined') {
      ExportFunctions.downloadZip();
    }
  },

  /**
   * Download images
   */
  downloadImages: function () {
    if (typeof ExportFunctions !== 'undefined') {
      ExportFunctions.downloadImages();
    }
  },

  /**
   * Download video
   */
  downloadVideo: function () {
    if (typeof ExportFunctions !== 'undefined') {
      ExportFunctions.downloadVideo();
    }
  }
};

