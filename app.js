import { FileManager } from './modules/fileManager.js';
import { ClaudeAPI } from './modules/claudeAPI.js';
import { UIController } from './modules/uiController.js';

class PluginOptimizer {
    constructor() {
        this.fileManager = new FileManager();
        this.claudeAPI = new ClaudeAPI();
        this.uiController = new UIController();
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
                const result = await this.claudeAPI.optimizePlugin(
                    file.name,
                    content,
                    options
                );

                results.push({
                    fileName: file.name,
                    success: true,
                    ...result
                });

            } catch (error) {
                results.push({
                    fileName: file.name,
                    success: false,
                    error: error.message
                });
            }

            processed++;
        }

        this.uiController.updateProgress(100, 'Selesai!');
        setTimeout(() => {
            this.uiController.hideProgress();
            this.uiController.showResults(results);
        }, 500);
    }

    clearAll() {
        this.fileManager.clearAll();
        this.updateUI();
        this.uiController.hideProgress();
        this.uiController.hideResults();
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