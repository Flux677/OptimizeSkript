export class Scanner {
    constructor() {
        this.files = [];
        this.scanResults = [];
        this.detectedFeatures = new Set();
    }

    init() {
        const uploadArea = document.getElementById('scanUploadArea');
        const fileInput = document.getElementById('scanFileInput');
        const scanBtn = document.getElementById('scanBtn');
        const clearBtn = document.getElementById('clearScanBtn');

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

        scanBtn.addEventListener('click', () => this.scanAllFiles());
        clearBtn.addEventListener('click', () => this.clear());

        // Setup tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (!this.files.find(f => f.name === file.name)) {
                this.files.push(file);
            }
        });
        this.updateFileList();
    }

    updateFileList() {
        const fileList = document.getElementById('scanFileList');
        const scanBtn = document.getElementById('scanBtn');

        if (this.files.length === 0) {
            fileList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Belum ada file</p>';
            scanBtn.disabled = true;
            return;
        }

        fileList.innerHTML = this.files.map((file, i) => `
            <div class="file-item">
                <span>📄 ${file.name} <small style="color: var(--text-muted);">(${this.formatSize(file.size)})</small></span>
                <button onclick="window.scanner.removeFile(${i})" style="background: var(--danger); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
        `).join('');

        scanBtn.disabled = false;
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
    }

    async scanAllFiles() {
        this.scanResults = [];
        this.detectedFeatures.clear();
        
        const scanIssues = document.getElementById('scanIssues').checked;
        const scanFeatures = document.getElementById('scanFeatures').checked;
        const scanSuggestions = document.getElementById('scanSuggestions').checked;
        
        for (const file of this.files) {
            const content = await this.readFile(file);
            
            // Analyze file (similar to scanner.js logic)
            const result = {
                fileName: file.name,
                content: content,
                issues: scanIssues ? this.detectIssues(file.name, content) : [],
                features: scanFeatures ? this.detectFeatures(file.name, content) : [],
                stats: {
                    lines: content.split('\n').length,
                    size: content.length
                }
            };
            
            this.scanResults.push(result);
            
            if (scanFeatures && result.features) {
                result.features.forEach(f => this.detectedFeatures.add(JSON.stringify(f)));
            }
        }

        this.displayResults(scanIssues, scanFeatures, scanSuggestions);
    }

    detectIssues(fileName, content) {
        // Basic issue detection (can be expanded)
        const issues = [];
        const lines = content.split('\n');
        const isSkript = fileName.endsWith('.sk');

        if (isSkript) {
            lines.forEach((line, i) => {
                const trimmed = line.trim();
                if (trimmed === '') return;
                if (trimmed.startsWith('#')) return;

                // Missing colons
                if ((trimmed.startsWith('if ') || trimmed.startsWith('else if ')) && !trimmed.endsWith(':')) {
                    issues.push({
                        severity: 'critical',
                        line: i + 1,
                        message: 'Missing colon at end of condition',
                        code: line
                    });
                }

                // JS syntax in Skript
                if (trimmed.includes('var ') || trimmed.includes('let ') || trimmed.includes('const ')) {
                    issues.push({
                        severity: 'critical',
                        line: i + 1,
                        message: 'JavaScript variable declaration in Skript file',
                        code: line
                    });
                }
            });
        }

        return issues;
    }

    detectFeatures(fileName, content) {
        const features = [];
        const lines = content.split('\n');
        const isSkript = fileName.endsWith('.sk');

        if (isSkript) {
            // Commands
            lines.forEach((line, i) => {
                const cmdMatch = line.match(/^command\s+\/(\w+)/);
                if (cmdMatch) {
                    features.push({
                        name: `/${cmdMatch[1]}`,
                        category: 'Commands',
                        line: i + 1
                    });
                }
            });

            // Events
            const eventPatterns = [
                { pattern: /^on\s+join/, name: 'Player Join' },
                { pattern: /^on\s+quit/, name: 'Player Quit' },
                { pattern: /^on\s+death/, name: 'Player Death' },
                { pattern: /^on\s+break/, name: 'Block Break' },
                { pattern: /^on\s+place/, name: 'Block Place' }
            ];

            lines.forEach((line, i) => {
                eventPatterns.forEach(ep => {
                    if (ep.pattern.test(line.trim())) {
                        features.push({
                            name: ep.name,
                            category: 'Events',
                            line: i + 1
                        });
                    }
                });
            });

            // Functions
            lines.forEach((line, i) => {
                const funcMatch = line.match(/^function\s+(\w+)/);
                if (funcMatch) {
                    features.push({
                        name: `${funcMatch[1]}()`,
                        category: 'Functions',
                        line: i + 1
                    });
                }
            });
        }

        return features;
    }

    generateSuggestions() {
        const features = Array.from(this.detectedFeatures).map(f => JSON.parse(f));
        const suggestions = [];
        
        const hasCommands = features.some(f => f.category === 'Commands');
        const hasEvents = features.some(f => f.category === 'Events');

        if (hasCommands) {
            suggestions.push({
                title: 'Add Cooldown System',
                icon: '⏱️',
                priority: 'high',
                description: 'Prevent command spam by adding cooldowns.',
                reason: 'Commands without cooldowns can be spammed.',
                example: 'set {cooldown::%player%} to now\nif difference between {cooldown::%player%} and now < 5 seconds:\n    send "Wait!"\n    stop'
            });

            suggestions.push({
                title: 'Add Permission Checks',
                icon: '🔒',
                priority: 'high',
                description: 'Secure commands with permissions.',
                reason: 'Public commands are security risks.',
                example: 'command /admin:\n    permission: myplugin.admin\n    trigger:\n        # code'
            });
        }

        if (hasCommands || hasEvents) {
            suggestions.push({
                title: 'Add Configuration File',
                icon: '⚙️',
                priority: 'medium',
                description: 'Make plugin customizable.',
                reason: 'Hardcoded values are inflexible.',
                example: 'options:\n    prefix: &7[&bPlugin&7]\n    cooldown: 5 seconds'
            });
        }

        return suggestions;
    }

    displayResults(showIssues, showFeatures, showSuggestions) {
        document.getElementById('scanResultsSection').style.display = 'block';

        if (showIssues) this.displayIssues();
        if (showFeatures) this.displayFeatures();
        if (showSuggestions) this.displaySuggestions();

        // Show first enabled tab
        if (showIssues) this.switchTab('issues');
        else if (showFeatures) this.switchTab('features');
        else if (showSuggestions) this.switchTab('suggestions');
    }

    displayIssues() {
        let totalIssues = 0;
        let critical = 0, high = 0;

        this.scanResults.forEach(r => {
            totalIssues += r.issues.length;
            critical += r.issues.filter(i => i.severity === 'critical').length;
            high += r.issues.filter(i => i.severity === 'high').length;
        });

        document.getElementById('issuesSummary').innerHTML = `
            <div class="summary-card">
                <div class="summary-number">${totalIssues}</div>
                <div>Total Issues</div>
            </div>
            <div class="summary-card">
                <div class="summary-number" style="color: var(--critical);">${critical}</div>
                <div>🚨 Critical</div>
            </div>
            <div class="summary-card">
                <div class="summary-number" style="color: var(--high);">${high}</div>
                <div>⚠️ High</div>
            </div>
        `;

        let html = '';
        this.scanResults.forEach(result => {
            if (result.issues.length > 0) {
                html += `<div class="card" style="margin-bottom: 1rem;">
                    <h3>📄 ${result.fileName}</h3>
                    <div class="issue-list">`;
                
                result.issues.forEach(issue => {
                    html += `<div class="issue-item issue-${issue.severity}">
                        <strong>Line ${issue.line}:</strong> ${issue.message}
                        <div class="code-preview">${this.escapeHtml(issue.code)}</div>
                    </div>`;
                });
                
                html += `</div></div>`;
            }
        });

        document.getElementById('issuesResults').innerHTML = html || '<p style="text-align:center;color:var(--success);">✅ No issues found!</p>';
    }

    displayFeatures() {
        const allFeatures = {};
        
        this.scanResults.forEach(result => {
            result.features.forEach(feature => {
                if (!allFeatures[feature.category]) {
                    allFeatures[feature.category] = [];
                }
                allFeatures[feature.category].push(feature);
            });
        });

        let html = `<div style="margin-bottom: 1.5rem; background: var(--bg); padding: 1rem; border-radius: 8px;">
            <strong>📊 Total Features: ${Object.values(allFeatures).flat().length}</strong>
        </div>`;

        for (const [category, features] of Object.entries(allFeatures)) {
            html += `<div class="card" style="margin-bottom: 1rem;">
                <h3>${this.getCategoryIcon(category)} ${category} (${features.length})</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">`;
            
            features.forEach(f => {
                html += `<span class="priority-badge priority-ok">${f.name}</span>`;
            });
            
            html += `</div></div>`;
        }

        document.getElementById('featuresResults').innerHTML = html || '<p style="text-align:center;color:var(--text-muted);">No features detected</p>';
    }

    displaySuggestions() {
        const suggestions = this.generateSuggestions();
        
        let html = '';
        suggestions.forEach(s => {
            html += `<div class="card" style="border-left: 4px solid var(--${s.priority}); margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                    <h3>${s.icon} ${s.title}</h3>
                    <span class="priority-badge priority-${s.priority}">${s.priority.toUpperCase()}</span>
                </div>
                <p style="margin-bottom: 1rem; color: var(--text-muted);">${s.description}</p>
                <div style="background: rgba(99, 102, 241, 0.1); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                    <strong>💡 Why:</strong> ${s.reason}
                </div>
                <div>
                    <strong>📝 Example:</strong>
                    <div class="code-preview">${this.escapeHtml(s.example)}</div>
                </div>
            </div>`;
        });

        document.getElementById('suggestionsResults').innerHTML = html || '<p style="text-align:center;color:var(--text-muted);">No suggestions at the moment</p>';
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    getCategoryIcon(category) {
        const icons = {
            'Commands': '⚡',
            'Events': '🎯',
            'Functions': '📦',
            'Variables': '💾',
            'Integrations': '🔌'
        };
        return icons[category] || '✨';
    }

    readFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsText(file);
        });
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clear() {
        this.files = [];
        this.scanResults = [];
        this.detectedFeatures.clear();
        this.updateFileList();
        document.getElementById('scanResultsSection').style.display = 'none';
        document.getElementById('scanFileInput').value = '';
    }
}

// Make scanner available globally for onclick handlers
window.scanner = null;