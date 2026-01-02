// Deksmo WebGrab - Export Helpers
// PDF and ZIP export functionality for grabbed images

var DeksmoExport = {

    /**
     * Export images as a single PDF file
     * @param {Array} images - Array of image objects with dataUrl or src
     * @param {string} title - PDF filename (without extension)
     * @param {function} onProgress - Progress callback (0-100)
     */
    exportAsPDF: async function(images, title, onProgress) {
        if (!images || images.length === 0) {
            alert('No images to export');
            return;
        }

        onProgress = onProgress || function() {};
        title = title || 'DeksmoExport_' + Date.now();

        try {
            // Initialize jsPDF
            var pdf = null;
            
            for (var i = 0; i < images.length; i++) {
                var img = images[i];
                var dataUrl = img.dataUrl || img.src;
                
                // If it's a URL, we need to fetch it first
                if (dataUrl && !dataUrl.startsWith('data:')) {
                    dataUrl = await DeksmoExport.fetchAsDataUrl(dataUrl);
                }
                
                if (!dataUrl) {
                    console.warn('Skip image without data:', i);
                    continue;
                }

                // Load image to get dimensions
                var imgEl = await DeksmoExport.loadImage(dataUrl);
                var width = imgEl.width;
                var height = imgEl.height;

                // Initialize PDF on first image
                if (!pdf) {
                    pdf = new jspdf.jsPDF({
                        orientation: width > height ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [width, height],
                        compress: true
                    });
                } else {
                    // Add new page matching image dimensions
                    pdf.addPage([width, height], width > height ? 'landscape' : 'portrait');
                }

                // Add image filling entire page
                pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST');
                
                onProgress(Math.round(((i + 1) / images.length) * 100));
            }

            if (!pdf) {
                alert('No valid images to export');
                return;
            }

            // Download the PDF
            pdf.save(title + '.pdf');
            
        } catch (error) {
            console.error('PDF export error:', error);
            alert('PDF export failed: ' + error.message);
        }
    },

    /**
     * Export images as a ZIP archive
     * @param {Array} images - Array of image objects with dataUrl or src
     * @param {string} title - ZIP filename (without extension)
     * @param {function} onProgress - Progress callback (0-100)
     */
    exportAsZIP: async function(images, title, onProgress) {
        if (!images || images.length === 0) {
            alert('No images to export');
            return;
        }

        onProgress = onProgress || function() {};
        title = title || 'DeksmoExport_' + Date.now();

        try {
            var zip = new JSZip();
            var folder = zip.folder(title);
            
            for (var i = 0; i < images.length; i++) {
                var img = images[i];
                var dataUrl = img.dataUrl || img.src;
                var filename = img.filename || img.name || ('image_' + String(i + 1).padStart(3, '0'));
                
                // Ensure filename has extension
                if (!filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                    filename += '.jpg';
                }
                
                // If it's a URL, fetch it
                if (dataUrl && !dataUrl.startsWith('data:')) {
                    dataUrl = await DeksmoExport.fetchAsDataUrl(dataUrl);
                }
                
                if (!dataUrl) {
                    console.warn('Skip image without data:', i);
                    continue;
                }

                // Convert data URL to blob data
                var base64Data = dataUrl.split(',')[1];
                folder.file(filename, base64Data, { base64: true });
                
                onProgress(Math.round(((i + 1) / images.length) * 100));
            }

            // Generate ZIP and download
            var content = await zip.generateAsync({ type: 'blob' });
            var url = URL.createObjectURL(content);
            
            var link = document.createElement('a');
            link.href = url;
            link.download = title + '.zip';
            link.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('ZIP export error:', error);
            alert('ZIP export failed: ' + error.message);
        }
    },

    /**
     * Fetch an image URL and convert to data URL
     */
    /**
     * Fetch an image URL and convert to data URL
     */
    fetchAsDataUrl: function(url) {
        return new Promise(function(resolve, reject) {
            
            // Try via background script first to avoid CORS
            if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ action: 'fetchImage', url: url }, function(response) {
                    if (chrome.runtime.lastError) {
                         // Fallback to direct load
                         loadDirectly(url, resolve, reject);
                    } else if (response && response.success) {
                        resolve(response.dataUrl);
                    } else {
                         // Fallback to direct load
                         loadDirectly(url, resolve, reject);
                    }
                });
            } else {
                loadDirectly(url, resolve, reject);
            }
        });
        
        function loadDirectly(url, resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                try {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = function() {
                reject(new Error('Failed to load image: ' + url));
            };
            img.src = url;
        }
    },

    /**
     * Load image and get its dimensions
     */
    loadImage: function(dataUrl) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
                resolve(img);
            };
            img.onerror = function() {
                reject(new Error('Failed to load image'));
            };
            img.src = dataUrl;
        });
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.DeksmoExport = DeksmoExport;
}
