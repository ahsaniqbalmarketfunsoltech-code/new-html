/**
 * Field Configuration - Centralized Configuration for All Data-Field Types
 * 
 * This file defines ALL field types and their behaviors.
 * When you add a new template, just follow the naming patterns and it will auto-sync!
 * 
 * NO CODE CHANGES NEEDED - Just add fields following the patterns below.
 */

var FieldConfig = {
  /**
   * Field Type Definitions
   * Each type defines: pattern, how to update preview, how to handle export
   */
  fieldTypes: {
    // ============================================
    // TEXT FIELDS - Updates text content
    // ============================================
    'text': {
      pattern: /^(title|heading|subtitle|description|content|text|label|name|footer|header|body|paragraph|message|caption|tagline|slogan|brand|company|address|phone|email|website|link|button|cta|callToAction)$/i,
      previewUpdate: 'textContent',
      exportHandling: 'textContent',
      inputTypes: ['text', 'textarea'],
      description: 'Text content fields - updates element text'
    },
    
    // ============================================
    // COLOR FIELDS - Updates color styles
    // ============================================
    'color': {
      pattern: /(Color|color|Bg|Background|bg|Fill|fill)$/i,
      previewUpdate: 'style',
      styleProperty: function(fieldName) {
        // Background colors
        if (fieldName.includes('Bg') || fieldName.includes('Background') || fieldName.includes('Fill')) {
          return 'backgroundColor';
        }
        // Text colors
        return 'color';
      },
      exportHandling: 'style',
      inputTypes: ['color'],
      description: 'Color fields - updates text or background color'
    },
    
    // ============================================
    // IMAGE FIELDS - Updates image src
    // ============================================
    'image': {
      pattern: /(image|Image|img|Img|thumbnail|Thumbnail|photo|Photo|picture|Picture|logo|Logo|icon|Icon|avatar|Avatar|banner|Banner|backgroundImage|background)$/i,
      previewUpdate: 'src',
      exportHandling: 'dataURL',
      inputTypes: ['file'],
      accept: 'image/*',
      description: 'Image fields - handles image uploads and display'
    },
    
    // ============================================
    // SIZE FIELDS - Updates width, height, font-size
    // ============================================
    'size': {
      pattern: /(Size|size|Width|width|Height|height|FontSize|fontSize|font-size|Font-Size)$/i,
      previewUpdate: 'style',
      styleProperty: function(fieldName) {
        if (fieldName.includes('Width') || fieldName.includes('width')) {
          return 'width';
        }
        if (fieldName.includes('Height') || fieldName.includes('height')) {
          return 'height';
        }
        if (fieldName.includes('Size') || fieldName.includes('FontSize') || fieldName.includes('fontSize')) {
          return 'fontSize';
        }
        return 'fontSize'; // Default
      },
      exportHandling: 'style',
      inputTypes: ['number', 'range'],
      unit: 'px',
      description: 'Size fields - updates width, height, or font-size'
    },
    
    // ============================================
    // SPACING FIELDS - Updates padding/margin
    // ============================================
    'spacing': {
      pattern: /(Padding|padding|Margin|margin|Top|Bottom|Left|Right|Spacing|spacing|Gap|gap)$/i,
      previewUpdate: 'style',
      styleProperty: function(fieldName) {
        var prop = '';
        
        // Determine base property
        if (fieldName.includes('Padding') || fieldName.includes('padding')) {
          prop = 'padding';
        } else if (fieldName.includes('Margin') || fieldName.includes('margin')) {
          prop = 'margin';
        } else if (fieldName.includes('Gap') || fieldName.includes('gap')) {
          prop = 'gap';
        } else {
          prop = 'padding'; // Default
        }
        
        // Add direction suffix
        if (fieldName.includes('Top')) {
          prop += 'Top';
        } else if (fieldName.includes('Bottom')) {
          prop += 'Bottom';
        } else if (fieldName.includes('Left')) {
          prop += 'Left';
        } else if (fieldName.includes('Right')) {
          prop += 'Right';
        }
        
        return prop;
      },
      exportHandling: 'style',
      inputTypes: ['number', 'range'],
      unit: 'px',
      description: 'Spacing fields - updates padding, margin, or gap'
    },
    
    // ============================================
    // AUDIO FIELDS - Updates audio src
    // ============================================
    'audio': {
      pattern: /(audio|Audio|sound|Sound|music|Music|mp3|wav|ogg)$/i,
      previewUpdate: 'src',
      exportHandling: 'dataURL',
      inputTypes: ['file'],
      accept: 'audio/*',
      description: 'Audio fields - handles audio file uploads'
    },
    
    // ============================================
    // VIDEO FIELDS - Updates video src
    // ============================================
    'video': {
      pattern: /(video|Video|movie|Movie|mp4|webm|mov)$/i,
      previewUpdate: 'src',
      exportHandling: 'dataURL',
      inputTypes: ['file'],
      accept: 'video/*',
      description: 'Video fields - handles video file uploads'
    },
    
    // ============================================
    // SELECT/DROPDOWN FIELDS - Updates selected option
    // ============================================
    'select': {
      pattern: /(select|Select|choice|Choice|option|Option|dropdown|Dropdown|menu|Menu)$/i,
      previewUpdate: 'textContent',
      exportHandling: 'textContent',
      inputTypes: ['select'],
      description: 'Select fields - updates based on dropdown selection'
    },
    
    // ============================================
    // BORDER FIELDS - Updates border styles
    // ============================================
    'border': {
      pattern: /(border|Border|borderRadius|BorderRadius|border-radius|Border-Radius|borderWidth|BorderWidth|borderColor|BorderColor)$/i,
      previewUpdate: 'style',
      styleProperty: function(fieldName) {
        if (fieldName.includes('Radius') || fieldName.includes('radius')) {
          return 'borderRadius';
        }
        if (fieldName.includes('Width') || fieldName.includes('width')) {
          return 'borderWidth';
        }
        if (fieldName.includes('Color') || fieldName.includes('color')) {
          return 'borderColor';
        }
        return 'border';
      },
      exportHandling: 'style',
      inputTypes: ['number', 'color', 'text'],
      unit: function(fieldName) {
        if (fieldName.includes('Color')) return '';
        return 'px';
      },
      description: 'Border fields - updates border styles'
    },
    
    // ============================================
    // OPACITY FIELDS - Updates opacity
    // ============================================
    'opacity': {
      pattern: /(opacity|Opacity|alpha|Alpha|transparency|Transparency)$/i,
      previewUpdate: 'style',
      styleProperty: 'opacity',
      exportHandling: 'style',
      inputTypes: ['number', 'range'],
      unit: '', // No unit for opacity (0-1)
      description: 'Opacity fields - updates element opacity'
    },
    
    // ============================================
    // POSITION FIELDS - Updates position (top, left, right, bottom)
    // ============================================
    'position': {
      pattern: /(position|Position|top|Top|left|Left|right|Right|bottom|Bottom|zIndex|ZIndex|z-index)$/i,
      previewUpdate: 'style',
      styleProperty: function(fieldName) {
        if (fieldName.includes('top') || fieldName.includes('Top')) return 'top';
        if (fieldName.includes('left') || fieldName.includes('Left')) return 'left';
        if (fieldName.includes('right') || fieldName.includes('Right')) return 'right';
        if (fieldName.includes('bottom') || fieldName.includes('Bottom')) return 'bottom';
        if (fieldName.includes('zIndex') || fieldName.includes('z-index')) return 'zIndex';
        return 'position';
      },
      exportHandling: 'style',
      inputTypes: ['number', 'text'],
      unit: function(fieldName) {
        if (fieldName.includes('zIndex')) return '';
        return 'px';
      },
      description: 'Position fields - updates element position'
    },
    
    // ============================================
    // FONT FIELDS - Updates font properties
    // ============================================
    'font': {
      pattern: /(font|Font|fontFamily|FontFamily|font-weight|FontWeight|fontWeight|fontStyle|FontStyle|font-style|textAlign|TextAlign|text-align|lineHeight|LineHeight|line-height|letterSpacing|LetterSpacing|letter-spacing)$/i,
      previewUpdate: 'style',
      styleProperty: function(fieldName) {
        if (fieldName.includes('Family') || fieldName.includes('family')) return 'fontFamily';
        if (fieldName.includes('Weight') || fieldName.includes('weight')) return 'fontWeight';
        if (fieldName.includes('Style') || fieldName.includes('style')) return 'fontStyle';
        if (fieldName.includes('Align') || fieldName.includes('align')) return 'textAlign';
        if (fieldName.includes('Height') || fieldName.includes('height')) return 'lineHeight';
        if (fieldName.includes('Spacing') || fieldName.includes('spacing')) return 'letterSpacing';
        return 'fontFamily';
      },
      exportHandling: 'style',
      inputTypes: ['text', 'select', 'number'],
      unit: function(fieldName) {
        if (fieldName.includes('Height') || fieldName.includes('Spacing')) return '';
        return '';
      },
      description: 'Font fields - updates font properties'
    },
    
    // ============================================
    // BACKGROUND FIELDS - Updates background styles
    // ============================================
    'background': {
      pattern: /(background|Background|bg|Bg|gradient|Gradient)$/i,
      previewUpdate: 'style',
      styleProperty: function(fieldName) {
        if (fieldName.includes('gradient') || fieldName.includes('Gradient')) {
          return 'background';
        }
        return 'backgroundColor';
      },
      exportHandling: 'style',
      inputTypes: ['color', 'text'],
      description: 'Background fields - updates background color or gradient'
    }
  },
  
  /**
   * Auto-detect field type from field name
   * Checks patterns in order of specificity (most specific first)
   */
  detectFieldType: function(fieldName) {
    if (!fieldName || typeof fieldName !== 'string') {
      return 'text'; // Default
    }
    
    // Check each field type pattern
    for (var type in this.fieldTypes) {
      var config = this.fieldTypes[type];
      if (config.pattern && config.pattern.test(fieldName)) {
        return type;
      }
    }
    
    // Default to text if no pattern matches
    return 'text';
  },
  
  /**
   * Get complete field configuration
   * Returns type and config object
   */
  getFieldConfig: function(fieldName) {
    var type = this.detectFieldType(fieldName);
    return {
      type: type,
      config: this.fieldTypes[type],
      fieldName: fieldName
    };
  },
  
  /**
   * Get style property name for a field
   */
  getStyleProperty: function(fieldName) {
    var fieldConfig = this.getFieldConfig(fieldName);
    var config = fieldConfig.config;
    
    if (config.styleProperty) {
      if (typeof config.styleProperty === 'function') {
        return config.styleProperty(fieldName);
      }
      return config.styleProperty;
    }
    
    return null;
  },
  
  /**
   * Get unit for a field value
   */
  getUnit: function(fieldName, value) {
    var fieldConfig = this.getFieldConfig(fieldName);
    var config = fieldConfig.config;
    
    if (config.unit) {
      if (typeof config.unit === 'function') {
        return config.unit(fieldName);
      }
      return config.unit;
    }
    
    return ''; // No unit
  },
  
  /**
   * Check if field should update text content
   */
  shouldUpdateTextContent: function(fieldName) {
    var fieldConfig = this.getFieldConfig(fieldName);
    return fieldConfig.config.previewUpdate === 'textContent';
  },
  
  /**
   * Check if field should update style
   */
  shouldUpdateStyle: function(fieldName) {
    var fieldConfig = this.getFieldConfig(fieldName);
    return fieldConfig.config.previewUpdate === 'style';
  },
  
  /**
   * Check if field should update src (for images, audio, video)
   */
  shouldUpdateSrc: function(fieldName) {
    var fieldConfig = this.getFieldConfig(fieldName);
    return fieldConfig.config.previewUpdate === 'src';
  },
  
  /**
   * Get all supported field types (for documentation)
   */
  getSupportedTypes: function() {
    var types = [];
    for (var type in this.fieldTypes) {
      types.push({
        type: type,
        description: this.fieldTypes[type].description,
        pattern: this.fieldTypes[type].pattern.toString()
      });
    }
    return types;
  }
};

