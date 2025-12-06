import { FileManager } from './modules/fileManager.js';
import { ClaudeAPI } from './modules/claudeAPI.js';
import { UIController } from './modules/uiController.js';
import { Validator } from './modules/validator.js';
import { BackupManager } from './modules/backupManager.js';
import { ErrorHandler } from './modules/errorHandler.js';

class PluginOptimizer {
    constructor() {
        this.fileManager = new FileManager();
        this.claudeAPI = new ClaudeAPI();
        this.uiController = new UIController();
        this.validator = new Validator();
        this.backupManager = new BackupManager();
        this.errorHandler = new ErrorHandler();
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Upload area events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Button events
        document.getElementById('processBtn').addEventListener('click', () => {
            this.processAllFiles();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAll();
        });

        document.getElementById('downloadAllBtn')?.addEventListener('click', () => {
            this.downloadAllResults();
        });
    }

    handleFiles(files) {
        const fileArray = Array.from(files);
        fileArray.forEach(file => {
            this.fileManager.addFile(file);
        });
        this.updateUI();
        this.checkSkriptFiles();
    }

    checkSkriptFiles() {
        const files = this.fileManager.getFiles();
        const hasSkript = files.some(f => f.extension === '.sk');
        
        if (hasSkript) {
            // Disable modernize option for Skript files
            const modernizeCheckbox = document.getElementById('modernize');
            modernizeCheckbox.checked = false;
            
            // Show warning
            this.showSkriptWarning();
        }
    }

    showSkriptWarning() {
        const existingWarning = document.getElementById('skriptWarning');
        if (existingWarning) return;

        const warning = document.createElement('div');
        warning.id = 'skriptWarning';
        warning.style.cssText = `
            background: rgba(245, 158, 11, 0.2);
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            color: #fbbf24;
        `;
        warning.innerHTML = `
            <strong>⚠️ Skript Files Detected</strong><br>
            <small>Modernize option telah di-disable. Tool akan mempertahankan syntax Skript original.</small>
        `;
        
        const optionsCard = document.querySelector('.options-grid').parentElement;
        optionsCard.insertBefore(warning, document.querySelector('.options-grid'));
    }

    updateUI() {
        const files = this.fileManager.getFiles();
        this.uiController.renderFileList(files, (fileId) => {
            this.fileManager.removeFile(fileId);
            this.updateUI();
        });

        const processBtn = document.getElementById('processBtn');
        processBtn.disabled = files.length === 0;
    }

    async processAllFiles() {
        const files = this.fileManager.getFiles();
        if (files.length === 0) return;

        // Get selected options
        const options = {
            fixSyntax: document.getElementById('fixSyntax').checked,
            optimizeCode: document.getElementById('optimizeCode').checked,
            addComments: document.getElementById('addComments').checked,
            modernize: document.getElementById('modernize').checked,
            securityCheck: document.getElementById('securityCheck').checked,
            bestPractices: document.getElementById('bestPractices').checked
        };

        // Show progress section
        this.uiController.showProgress();
        this.uiController.hideResults();

        const results = [];
        let processed = 0;

        for (const file of files) {
            try {
                this.uiController.updateProgress(
                    (processed / files.length) * 100,
                    `Memproses ${file.name}... (${processed + 1}/${files.length})`
                );

                const content = await this.fileManager.readFileContent(file.file);
                
                // Create backup before processing
                this.backupManager.createBackup(file.name, content);
                
                // Pre-validate
                const validation = this.validator.preValidate(file.name, content);
                
                // If Skript file, ensure modernize is disabled
                const fileOptions = { ...options };
                if (validation.isSkript) {
                    fileOptions.modernize = false;
                }

                const result = await this.claudeAPI.optimizePlugin(
                    file.name,
                    content,
                    fileOptions
                );

                // Add validation info to result
                result.preValidation = validation;
                
                // Compare with backup
                result.comparison = this.backupManager.compareWithBackup(
                    file.name, 
                    result.optimizedCode || content
                );

                results.push({
                    fileName: file.name,
                    success: true,
                    originalContent: content,
                    ...result
                });

            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                const errorResult = this.errorHandler.handleAPIError(error, file.name);
                results.push(errorResult);
            }

            processed++;
        }

        this.uiController.updateProgress(100, 'Selesai!');
        setTimeout(() => {
            this.uiController.hideProgress();
            this.uiController.showResults(results, this.backupManager);
        }, 500);
    }

    clearAll() {
        this.fileManager.clearAll();
        this.backupManager.clearBackups();
        this.updateUI();
        this.uiController.hideProgress();
        this.uiController.hideResults();
        
        // Remove skript warning if exists
        const warning = document.getElementById('skriptWarning');
        if (warning) warning.remove();
    }

    downloadAllResults() {
        // This will be implemented based on results
        console.log('Download all results');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PluginOptimizer();
});