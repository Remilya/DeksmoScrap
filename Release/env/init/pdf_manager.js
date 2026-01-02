/**
 * Deksmo PDF Manager Logic
 * Replicates the React-based AutoPDF functionality in vanilla JS.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        chapters: [], // [{ id, name, images: [{ id, name, src, file }] }]
        isProcessing: false
    };

    // --- DOM Elements ---
    const els = {
        btnExportAll: document.getElementById('btn-export-all'),
        btnAddFolders: document.getElementById('btn-add-folders'),
        fileInput: document.getElementById('file-input'),
        emptyState: document.getElementById('empty-state'),
        contentView: document.getElementById('content-view'),
        chapterList: document.getElementById('chapter-list'),
        chapterCount: document.getElementById('chapter-count'),
        btnClearAll: document.getElementById('btn-clear-all'),
        btnImportBig: document.getElementById('btn-import-big'),
        tplChapterCard: document.getElementById('tpl-chapter-card'),
        progressOverlay: document.getElementById('progress-overlay'),
        progressPercent: document.getElementById('progress-percent'),
        progressMessage: document.getElementById('progress-message'),
        body: document.body
    };

    // --- Event Listeners ---

    // File Input Changes
    els.fileInput.addEventListener('change', handleFiles);

    // Buttons
    els.btnAddFolders.addEventListener('click', () => els.fileInput.click());
    els.btnImportBig.addEventListener('click', () => els.fileInput.click());
    els.btnClearAll.addEventListener('click', clearAll);
    
    // Drag & Drop on Body
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        els.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    els.body.addEventListener('drop', handleDrop, false);


    // --- Lightbox Logic ---
    const lightboxState = {
        active: false,
        chapter: null,
        index: -1
    };

    function openLightbox(chapter, index) {
        if (!chapter || index < 0 || index >= chapter.images.length) return;
        
        lightboxState.active = true;
        lightboxState.chapter = chapter;
        lightboxState.index = index;
        
        updateLightbox();
        document.getElementById('lightbox-overlay').classList.remove('hidden');
    }

    function closeLightbox() {
        lightboxState.active = false;
        document.getElementById('lightbox-overlay').classList.add('hidden');
    }

    function updateLightbox() {
        const img = lightboxState.chapter.images[lightboxState.index];
        const imgEl = document.getElementById('lightbox-image');
        const nameEl = document.getElementById('lightbox-filename');
        const countEl = document.getElementById('lightbox-counter');

        imgEl.src = img.src;
        nameEl.textContent = img.name;
        countEl.textContent = `${lightboxState.index + 1} / ${lightboxState.chapter.images.length}`;
    }

    function nextLightbox() {
        if (lightboxState.index < lightboxState.chapter.images.length - 1) {
            lightboxState.index++;
            updateLightbox();
        }
    }

    function prevLightbox() {
        if (lightboxState.index > 0) {
            lightboxState.index--;
            updateLightbox();
        }
    }

    // Lightbox Events
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    
    // Close on background click
    document.getElementById('lightbox-overlay').addEventListener('click', (e) => {
        // Close if clicking the overlay background or the main wrapper (but not image/buttons)
        if (e.target.id === 'lightbox-overlay' || 
            e.target.classList.contains('lightbox-content') || 
            e.target.classList.contains('lightbox-main') ||
            e.target.classList.contains('lightbox-image-wrapper')) {
            closeLightbox();
        }
    });

    document.getElementById('lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); nextLightbox(); });
    document.getElementById('lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); prevLightbox(); });
    
    // --- Core Logic ---

    // State for selection and drag
    let draggingItem = null;
    let draggingSourceChapterId = null;
    let selectedImageId = null;

    async function handleFiles(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        await processFiles(Array.from(files));
        els.fileInput.value = ''; // Reset
    }

    async function handleDrop(e) {
        // Handled by specific drop zones now, mostly
        // But main drop zone is body for new chapters
        if (!e.target.closest('.chapter-card')) {
             const dt = e.dataTransfer;
             const files = dt.files;
             if (files.length > 0) await processFiles(Array.from(files));
        }
    }

    async function processFiles(fileList, targetChapterId = null) {
        showProgress(true, "Scanning files...");

        const imageFiles = fileList.filter(f => f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
        
        if (imageFiles.length === 0) {
            showProgress(false);
            return;
        }

        // Processing logic
        // If targetChapterId is present, add to that chapter
        if (targetChapterId) {
            const chapter = state.chapters.find(c => c.id === targetChapterId);
            if (chapter) {
                const newImages = imageFiles.map(file => ({
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    src: URL.createObjectURL(file),
                    file: file
                }));
                chapter.images.push(...newImages);
                render();
            }
        } else {
             // ... Existing logic for creating new chapters ...
             const folderMap = {};
             // ... Logic to group by folder ...
             for (const file of imageFiles) {
                let folderName = "New Folder";
                if (file.webkitRelativePath) {
                    const parts = file.webkitRelativePath.split('/');
                    if (parts.length > 1) folderName = parts[parts.length - 2];
                }
                if (!folderMap[folderName]) folderMap[folderName] = [];
                folderMap[folderName].push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    src: URL.createObjectURL(file),
                    file: file
                });
            }

            // Sort and Create
            Object.keys(folderMap).forEach(key => {
                folderMap[key].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            });
            const newChapters = Object.entries(folderMap).map(([name, images]) => ({
                id: Math.random().toString(36).substr(2, 9),
                name,
                images
            }));
            state.chapters = [...state.chapters, ...newChapters];
            render();
        }
        showProgress(false);
    }

    function render() {
        // Toggle Views
        if (state.chapters.length === 0) {
            els.emptyState.classList.remove('hidden');
            els.contentView.classList.add('hidden');
            els.btnExportAll.classList.add('hidden');
        } else {
            els.emptyState.classList.add('hidden');
            els.contentView.classList.remove('hidden');
            els.btnExportAll.classList.remove('hidden');
            els.chapterCount.textContent = `${state.chapters.length} CHAPTERS QUEUED`;
        }

        els.chapterList.innerHTML = '';

        state.chapters.forEach(chapter => {
            const card = els.tplChapterCard.content.cloneNode(true);
            const cardEl = card.querySelector('.chapter-card');
            
            // Allow dropping files on card to add pages
            cardEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                cardEl.classList.add('drag-over');
            });
            cardEl.addEventListener('dragleave', () => cardEl.classList.remove('drag-over'));
            cardEl.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop bubbling to body
                cardEl.classList.remove('drag-over');
                const dt = e.dataTransfer;
                if (dt.files && dt.files.length > 0) {
                    await processFiles(Array.from(dt.files), chapter.id);
                }
            });


            // Title Rename Logic
            const titleEl = card.querySelector('.chapter-title');
            titleEl.textContent = chapter.name;
            titleEl.contentEditable = true;
            
            const saveTitle = () => {
                const newName = titleEl.textContent.trim();
                if (newName) chapter.name = newName;
                else titleEl.textContent = chapter.name; // Revert if empty
            };
            titleEl.addEventListener('blur', saveTitle);
            titleEl.addEventListener('keydown', (e) => { 
                if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); } 
                e.stopPropagation(); // Prevent card toggle
            });
            
            
            // Count
            card.querySelector('.page-count').textContent = chapter.images.length;
            
            if (chapter.images.length > 0) {
                const bgDiv = card.querySelector('.card-preview');
                bgDiv.style.backgroundImage = `linear-gradient(to right, var(--bg-card), transparent), url('${chapter.images[0].src}')`;
                
                // Clicking Header Preview triggers lightbox too? Or keeps accordion?
                // For now, let's make the preview area trigger toggle as normal, 
                // but user said "closes inspection" so maybe we prevent it?
                // Let's just leave header toggle logic as is, it's standard.
            }

            // Buttons
            card.querySelector('.btn-pdf').addEventListener('click', (e) => { e.stopPropagation(); exportItem(chapter, 'pdf'); });
            card.querySelector('.btn-zip').addEventListener('click', (e) => { e.stopPropagation(); exportItem(chapter, 'zip'); });
            card.querySelector('.btn-delete-red').addEventListener('click', (e) => { e.stopPropagation(); removeChapter(chapter.id); });

            // Grid
            const header = card.querySelector('.card-header');
            const grid = card.querySelector('.card-grid');
            const imageGrid = card.querySelector('.image-grid');
            
            // Restore expansion state
            if (chapter.isExpanded) {
                grid.classList.remove('hidden');
            } else {
                grid.classList.add('hidden');
            }

            header.addEventListener('click', (e) => {
                if (e.target.isContentEditable) return;
                if (e.target.closest('button')) return;
                
                // Toggle state
                chapter.isExpanded = !chapter.isExpanded;
                if (chapter.isExpanded) {
                    grid.classList.remove('hidden');
                } else {
                    grid.classList.add('hidden');
                }
            });

            // Render Images in Grid
            chapter.images.forEach((img, index) => {
                const div = document.createElement('div');
                div.className = 'grid-item';
                div.draggable = true;
                if (img.id === selectedImageId) div.classList.add('selected');

                div.innerHTML = `
                    <div class="grid-delete-btn" title="Remove Page">✕</div>
                    <img src="${img.src}" loading="lazy">
                    <span class="grid-item-name">${img.name}</span>
                `;
                
                // Click Handler -> Open Lightbox
                div.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    if (e.target.closest('.grid-delete-btn')) return;
                    
                    selectedImageId = img.id; 
                    openLightbox(chapter, index);
                });

                // Delete Page Handler
                div.querySelector('.grid-delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    chapter.images.splice(index, 1);
                    render();
                });

                // Drag Sort Handlers
                div.addEventListener('dragstart', (e) => {
                    draggingItem = img;
                    draggingSourceChapterId = chapter.id;
                    e.dataTransfer.effectAllowed = 'move';
                    div.classList.add('dragging');
                    e.stopPropagation();
                });
                
                div.addEventListener('dragend', () => {
                    draggingItem = null;
                    draggingSourceChapterId = null;
                    div.classList.remove('dragging');
                    document.querySelectorAll('.grid-item').forEach(el => el.classList.remove('drag-over'));
                });

                div.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (draggingItem && draggingSourceChapterId === chapter.id && draggingItem !== img) {
                         div.classList.add('drag-over');
                    }
                });

                div.addEventListener('dragleave', () => div.classList.remove('drag-over'));

                div.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    div.classList.remove('drag-over');
                    if (draggingItem && draggingSourceChapterId === chapter.id && draggingItem !== img) {
                        // Reorder logic
                        const oldIndex = chapter.images.indexOf(draggingItem);
                        const newIndex = chapter.images.indexOf(img);
                        
                        if (oldIndex > -1 && newIndex > -1) {
                            chapter.images.splice(oldIndex, 1);
                            chapter.images.splice(newIndex, 0, draggingItem);
                            render();
                        }
                    }
                });

                imageGrid.appendChild(div);
            });

            els.chapterList.appendChild(card);
        });
    }

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        // If lightbox active, handle there
        if (lightboxState.active) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextLightbox();
            if (e.key === 'ArrowLeft') prevLightbox();
            e.stopPropagation();
            return;
        }

        if (!selectedImageId) return;
        
        let foundChapter = null;
        let foundIndex = -1;
        
        for (const c of state.chapters) {
            const idx = c.images.findIndex(img => img.id === selectedImageId);
            if (idx > -1) { foundChapter = c; foundIndex = idx; break; }
        }

        if (!foundChapter) return;

        if (e.key === 'ArrowRight') {
            const next = foundChapter.images[foundIndex + 1];
            if (next) { selectedImageId = next.id; renderSelection(); }
        } else if (e.key === 'ArrowLeft') {
             const prev = foundChapter.images[foundIndex - 1];
             if (prev) { selectedImageId = prev.id; renderSelection(); }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
             foundChapter.images.splice(foundIndex, 1);
             selectedImageId = null;
             if (foundChapter.images[foundIndex]) selectedImageId = foundChapter.images[foundIndex].id;
             else if (foundChapter.images[foundIndex - 1]) selectedImageId = foundChapter.images[foundIndex - 1].id;
             render();
        } else if (e.key === 'Enter') {
             // Enter to open lightbox for selected
             openLightbox(foundChapter, foundIndex);
        }
    });
    
    function renderSelection() {
        document.querySelectorAll('.grid-item').forEach(el => el.classList.remove('selected'));
        // Re-render is easiest way to ensure visually correct state without finding individual DOM nodes
        render();
    }

    function removeChapter(id) {
        state.chapters = state.chapters.filter(c => c.id !== id);
        render();
    }

    function clearAll() {
        if (!confirm('Clear all queued chapters?')) return;
        state.chapters = [];
        render();
    }

    // --- Import from Extension Storage ---

    function checkPendingImports() {
        if (!chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get('deksmo_pdf_import', (data) => {
            if (data.deksmo_pdf_import) {
                const importData = data.deksmo_pdf_import;
                
                // Clear storage immediately to prevent re-import on refresh
                chrome.storage.local.remove('deksmo_pdf_import');

                if (importData.images && importData.images.length > 0) {
                    importFromGrabber(importData);
                }
            }
        });
    }

    function importFromGrabber(importData) {
        const title = importData.title || "Grabber Export";
        const images = importData.images.map(img => ({
            id: Math.random().toString(36).substr(2, 9),
            name: img.filename,
            src: img.src,
            file: null
        }));

        const newChapter = {
            id: Math.random().toString(36).substr(2, 9),
            name: title,
            images: images
        };

        state.chapters.push(newChapter);
        render();
        
        // Auto-start is disabled for better UX
    }

    // Check on load
    checkPendingImports();

    // --- Export Logic ---

    async function exportItem(chapter, type) {
        if (!window.DeksmoExport) {
            alert("Export helpers not loaded!");
            return;
        }

        showProgress(true, `Generating ${type.toUpperCase()} for ${chapter.name}`);
        
        try {
            const imagesForExport = chapter.images.map(img => ({
                src: img.src,
                filename: img.name
            }));

            if (type === 'pdf') {
                await window.DeksmoExport.exportAsPDF(imagesForExport, chapter.name, updateProgress);
            } else {
                await window.DeksmoExport.exportAsZIP(imagesForExport, chapter.name, updateProgress);
            }

        } catch (e) {
            console.error(e);
            alert("Export failed: " + e.message);
        } finally {
            showProgress(false);
        }
    }

    function showProgress(show, msg) {
        if (show) {
            els.progressOverlay.classList.remove('hidden');
            els.progressMessage.textContent = msg || 'Processing...';
            els.progressPercent.textContent = '0';
        } else {
            els.progressOverlay.classList.add('hidden');
        }
    }

    function updateProgress(percent) {
        els.progressPercent.textContent = percent;
    }

    // Export All Handler
    els.btnExportAll.addEventListener('click', async () => {
        if (!confirm(`Export all ${state.chapters.length} chapters as PDFs?`)) return;
        
        for (let i = 0; i < state.chapters.length; i++) {
            const chapter = state.chapters[i];
            await exportItem(chapter, 'pdf');
            await new Promise(r => setTimeout(r, 500));
        }
    });

});
