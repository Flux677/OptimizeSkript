export class Scanner {
    constructor() {
        this.files = [];
        this.scanResults = [];
        this.detectedFeatures = new Map();
        this.projectStats = {
            totalLines: 0,
            totalCommands: 0,
            totalEvents: 0,
            totalFunctions: 0,
            totalVariables: new Set(),
            usedLibraries: new Set()
        };
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
        this.resetProjectStats();
        
        const scanIssues = document.getElementById('scanIssues').checked;
        const scanFeatures = document.getElementById('scanFeatures').checked;
        const scanSuggestions = document.getElementById('scanSuggestions').checked;
        
        for (const file of this.files) {
            const content = await this.readFile(file);
            
            const result = {
                fileName: file.name,
                content: content,
                issues: scanIssues ? this.detectIssues(file.name, content) : [],
                features: scanFeatures ? this.detectFeatures(file.name, content) : [],
                stats: this.analyzeFileStats(content),
                dependencies: this.detectDependencies(content)
            };
            
            this.scanResults.push(result);
            this.updateProjectStats(result);
        }

        this.displayResults(scanIssues, scanFeatures, scanSuggestions);
    }

    resetProjectStats() {
        this.projectStats = {
            totalLines: 0,
            totalCommands: 0,
            totalEvents: 0,
            totalFunctions: 0,
            totalVariables: new Set(),
            usedLibraries: new Set(),
            fileTypes: {}
        };
    }

    updateProjectStats(result) {
        this.projectStats.totalLines += result.stats.lines;
        
        result.features.forEach(feature => {
            if (feature.category === 'Commands') this.projectStats.totalCommands++;
            if (feature.category === 'Events') this.projectStats.totalEvents++;
            if (feature.category === 'Functions') this.projectStats.totalFunctions++;
        });

        result.dependencies.variables.forEach(v => this.projectStats.totalVariables.add(v));
        result.dependencies.libraries.forEach(l => this.projectStats.usedLibraries.add(l));
    }

    detectIssues(fileName, content) {
        const issues = [];
        const lines = content.split('\n');
        const isSkript = fileName.endsWith('.sk');

        if (isSkript) {
            lines.forEach((line, i) => {
                const trimmed = line.trim();
                if (trimmed === '' || trimmed.startsWith('#')) return;

                if ((trimmed.startsWith('if ') || trimmed.startsWith('else if ')) && !trimmed.endsWith(':')) {
                    issues.push({
                        severity: 'critical',
                        line: i + 1,
                        message: 'Missing colon at end of condition',
                        code: line,
                        fix: line + ':'
                    });
                }

                if (trimmed.includes('var ') || trimmed.includes('let ') || trimmed.includes('const ')) {
                    issues.push({
                        severity: 'critical',
                        line: i + 1,
                        message: 'JavaScript variable declaration in Skript file',
                        code: line,
                        fix: 'Use: set {variable} to value'
                    });
                }

                if (trimmed.endsWith(';') && !trimmed.startsWith('execute')) {
                    issues.push({
                        severity: 'medium',
                        line: i + 1,
                        message: 'Unnecessary semicolon in Skript',
                        code: line,
                        fix: line.replace(/;$/, '')
                    });
                }

                const varMatches = trimmed.match(/\{([^}]+)\}/g);
                if (varMatches) {
                    varMatches.forEach(v => {
                        if (!v.includes('_') && !v.includes('@') && !v.includes('::')) {
                            issues.push({
                                severity: 'low',
                                line: i + 1,
                                message: `Global variable ${v} might cause conflicts`,
                                code: line,
                                fix: `Consider using {_${v.slice(1, -1)}} for local scope`
                            });
                        }
                    });
                }

                if (trimmed.startsWith('command /') && !content.includes('permission:')) {
                    issues.push({
                        severity: 'high',
                        line: i + 1,
                        message: 'Command without permission check',
                        code: line,
                        fix: 'Add: permission: your.plugin.command'
                    });
                }

                if (trimmed.includes('parse') || trimmed.includes('loop')) {
                    const nextLines = lines.slice(i, i + 10).join('\n');
                    if (!nextLines.includes('if') && !nextLines.includes('else')) {
                        issues.push({
                            severity: 'medium',
                            line: i + 1,
                            message: 'Potential error without validation',
                            code: line,
                            fix: 'Add validation checks'
                        });
                    }
                }
            });

            if (content.length > 50000) {
                issues.push({
                    severity: 'high',
                    line: 1,
                    message: 'File too large (>50KB), consider splitting',
                    code: '',
                    fix: 'Split into multiple files by feature'
                });
            }

            if (this.projectStats.totalCommands > 20 && !content.includes('function')) {
                issues.push({
                    severity: 'medium',
                    line: 1,
                    message: 'Many commands without reusable functions',
                    code: '',
                    fix: 'Create functions for common logic'
                });
            }
        }

        return issues;
    }

    detectFeatures(fileName, content) {
        const features = [];
        const lines = content.split('\n');
        const isSkript = fileName.endsWith('.sk');

        if (isSkript) {
            lines.forEach((line, i) => {
                const cmdMatch = line.match(/^command\s+\/(\w+)(?:\s+<(.+)>)?/);
                if (cmdMatch) {
                    const args = cmdMatch[2] ? cmdMatch[2].split(/>\s*</).map(a => a.replace(/[<>]/g, '')) : [];
                    features.push({
                        name: `/${cmdMatch[1]}`,
                        category: 'Commands',
                        line: i + 1,
                        details: {
                            arguments: args,
                            hasPermission: lines.slice(i, i + 5).some(l => l.includes('permission:')),
                            hasCooldown: lines.slice(i, i + 10).some(l => l.includes('cooldown'))
                        }
                    });
                }
            });

            const eventPatterns = [
                { pattern: /^on\s+join/, name: 'Player Join', icon: '👋' },
                { pattern: /^on\s+quit/, name: 'Player Quit', icon: '👋' },
                { pattern: /^on\s+death/, name: 'Player Death', icon: '💀' },
                { pattern: /^on\s+break/, name: 'Block Break', icon: '⛏️' },
                { pattern: /^on\s+place/, name: 'Block Place', icon: '🧱' },
                { pattern: /^on\s+damage/, name: 'Player Damage', icon: '❤️' },
                { pattern: /^on\s+chat/, name: 'Player Chat', icon: '💬' },
                { pattern: /^on\s+click/, name: 'Player Click', icon: '👆' },
                { pattern: /^on\s+inventory/, name: 'Inventory Action', icon: '🎒' }
            ];

            lines.forEach((line, i) => {
                eventPatterns.forEach(ep => {
                    if (ep.pattern.test(line.trim())) {
                        features.push({
                            name: ep.name,
                            category: 'Events',
                            line: i + 1,
                            icon: ep.icon,
                            details: {
                                hasCondition: lines.slice(i, i + 5).some(l => l.trim().startsWith('if')),
                                complexity: this.calculateComplexity(lines.slice(i, i + 20))
                            }
                        });
                    }
                });
            });

            lines.forEach((line, i) => {
                const funcMatch = line.match(/^function\s+(\w+)\s*\(([^)]*)\)/);
                if (funcMatch) {
                    const params = funcMatch[2] ? funcMatch[2].split(',').map(p => p.trim()) : [];
                    features.push({
                        name: `${funcMatch[1]}()`,
                        category: 'Functions',
                        line: i + 1,
                        details: {
                            parameters: params,
                            returns: lines.slice(i, i + 20).some(l => l.includes('return')),
                            length: this.getFunctionLength(lines, i)
                        }
                    });
                }
            });

            if (content.includes('options:')) {
                const optionsStart = lines.findIndex(l => l.trim() === 'options:');
                const optionsEnd = lines.slice(optionsStart + 1).findIndex(l => !l.startsWith('\t') && l.trim() !== '');
                const optionLines = lines.slice(optionsStart + 1, optionsStart + 1 + optionsEnd);
                
                optionLines.forEach((line, i) => {
                    const optMatch = line.match(/^\s+(\w+):\s*(.+)/);
                    if (optMatch) {
                        features.push({
                            name: optMatch[1],
                            category: 'Configuration',
                            line: optionsStart + i + 2,
                            details: {
                                defaultValue: optMatch[2],
                                type: this.guessType(optMatch[2])
                            }
                        });
                    }
                });
            }

            const integrations = [
                { pattern: /balance|economy|money|vault/i, name: 'Economy (Vault)', icon: '💰' },
                { pattern: /placeholder|papi|%.*%/i, name: 'PlaceholderAPI', icon: '🏷️' },
                { pattern: /permission|perm|has permission/i, name: 'Permissions', icon: '🔒' },
                { pattern: /scoreboard|sidebar/i, name: 'Scoreboard', icon: '📊' },
                { pattern: /hologram/i, name: 'Holograms', icon: '👁️' },
                { pattern: /particle/i, name: 'Particles', icon: '✨' },
                { pattern: /nbt/i, name: 'NBT Data', icon: '🏷️' }
            ];

            integrations.forEach(int => {
                if (int.pattern.test(content)) {
                    features.push({
                        name: int.name,
                        category: 'Integrations',
                        line: 0,
                        icon: int.icon,
                        details: {
                            usage: this.countPatternOccurrences(content, int.pattern)
                        }
                    });
                }
            });
        }

        return features;
    }

    analyzeFileStats(content) {
        const lines = content.split('\n');
        return {
            lines: lines.length,
            nonEmpty: lines.filter(l => l.trim() !== '').length,
            comments: lines.filter(l => l.trim().startsWith('#')).length,
            size: content.length,
            complexity: this.calculateComplexity(lines)
        };
    }

    calculateComplexity(lines) {
        let complexity = 0;
        lines.forEach(line => {
            if (line.includes('if ') || line.includes('else if ')) complexity += 1;
            if (line.includes('loop ')) complexity += 2;
            if (line.includes('while ')) complexity += 2;
            if (line.includes('function')) complexity += 1;
        });
        return complexity;
    }

    getFunctionLength(lines, startIndex) {
        let length = 1;
        const indent = lines[startIndex].match(/^\s*/)[0].length;
        
        for (let i = startIndex + 1; i < lines.length; i++) {
            const currentIndent = lines[i].match(/^\s*/)[0].length;
            if (currentIndent <= indent && lines[i].trim() !== '') break;
            length++;
        }
        
        return length;
    }

    guessType(value) {
        if (!isNaN(value)) return 'number';
        if (value === 'true' || value === 'false') return 'boolean';
        if (value.startsWith('&')) return 'text (colored)';
        return 'text';
    }

    countPatternOccurrences(content, pattern) {
        const matches = content.match(new RegExp(pattern, 'gi'));
        return matches ? matches.length : 0;
    }

    detectDependencies(content) {
        const variables = new Set();
        const libraries = new Set();
        
        const varMatches = content.match(/\{[^}]+\}/g);
        if (varMatches) {
            varMatches.forEach(v => variables.add(v));
        }

        if (content.includes('skquery')) libraries.add('skQuery');
        if (content.includes('skellett')) libraries.add('Skellett');
        if (content.includes('skript-mirror')) libraries.add('skript-mirror');
        if (content.includes('reqn')) libraries.add('skript-reflect');
        if (content.includes('tuske')) libraries.add('TuSKe');

        return {
            variables: Array.from(variables),
            libraries: Array.from(libraries)
        };
    }

    generateSuggestions() {
        const suggestions = [];
        
        const hasCommands = this.projectStats.totalCommands > 0;
        const hasEvents = this.projectStats.totalEvents > 0;
        const hasFunctions = this.projectStats.totalFunctions > 0;
        const hasConfig = Array.from(this.detectedFeatures.values())
            .some(features => features.some(f => f.category === 'Configuration'));

        if (hasCommands) {
            const commandsWithCooldown = this.scanResults.flatMap(r => r.features)
                .filter(f => f.category === 'Commands' && f.details?.hasCooldown).length;
            
            if (commandsWithCooldown < this.projectStats.totalCommands) {
                suggestions.push({
                    title: 'Add Cooldown System',
                    icon: '⏱️',
                    priority: 'high',
                    description: 'Prevent command spam by adding cooldowns to commands.',
                    reason: `${this.projectStats.totalCommands - commandsWithCooldown} command(s) without cooldown protection.`,
                    example: `command /daily:
    trigger:
        if difference between {cooldown::%player%} and now < 24 hours:
            send "Please wait %difference between 24 hours and difference between {cooldown::%player%} and now%"
            stop
        set {cooldown::%player%} to now
        # Your command logic`,
                    impact: 'Prevents abuse and server lag'
                });
            }
        }

        if (hasCommands) {
            const commandsWithPerms = this.scanResults.flatMap(r => r.features)
                .filter(f => f.category === 'Commands' && f.details?.hasPermission).length;
            
            if (commandsWithPerms < this.projectStats.totalCommands) {
                suggestions.push({
                    title: 'Add Permission Checks',
                    icon: '🔒',
                    priority: 'critical',
                    description: 'Secure your commands with permission checks.',
                    reason: `${this.projectStats.totalCommands - commandsWithPerms} command(s) accessible to everyone.`,
                    example: `command /admin:
    permission: myplugin.admin
    permission message: &cYou don't have permission!
    trigger:
        # Your admin code`,
                    impact: 'Essential for security'
                });
            }
        }

        if (!hasConfig && (hasCommands || hasEvents)) {
            suggestions.push({
                title: 'Add Configuration File',
                icon: '⚙️',
                priority: 'high',
                description: 'Make your plugin customizable with options.',
                reason: 'Hardcoded values make plugin inflexible.',
                example: `options:
    prefix: &7[&bMyPlugin&7]
    cooldown: 5 seconds
    max-uses: 3
    debug-mode: false

command /test:
    trigger:
        send "{@prefix} This uses config!"`,
                impact: 'Easy customization without code changes'
            });
        }

        if (hasCommands && this.projectStats.totalCommands > 5 && this.projectStats.totalFunctions < 3) {
            suggestions.push({
                title: 'Create Reusable Functions',
                icon: '📦',
                priority: 'medium',
                description: 'Reduce code duplication with functions.',
                reason: `${this.projectStats.totalCommands} commands with only ${this.projectStats.totalFunctions} functions.`,
                example: `function sendMessage(p: player, msg: text):
    send "{@prefix} %{_msg}%" to {_p}

command /test:
    trigger:
        sendMessage(player, "Hello World!")`,
                impact: 'Easier maintenance and updates'
            });
        }

        if (hasEvents || hasCommands) {
            suggestions.push({
                title: 'Add Error Handling',
                icon: '🛡️',
                priority: 'medium',
                description: 'Prevent crashes with proper validation.',
                reason: 'Many operations without error checks detected.',
                example: `command /teleport <player>:
    trigger:
        if arg-1 is set:
            if arg-1 is online:
                teleport player to arg-1
            else:
                send "&cPlayer is not online!"
        else:
            send "&cUsage: /teleport <player>"`,
                impact: 'Better user experience and stability'
            });
        }

        if (hasCommands && this.projectStats.totalCommands > 3) {
            suggestions.push({
                title: 'Implement GUI Menu',
                icon: '🎮',
                priority: 'low',
                description: 'Replace commands with intuitive GUI menus.',
                reason: 'Many commands could be simplified with GUI.',
                example: `command /menu:
    trigger:
        open chest with 3 rows named "&6Main Menu" to player
        wait 1 tick
        set slot 13 of player's current inventory to diamond named "&bSettings"`,
                impact: 'Better user experience'
            });
        }

        if (this.projectStats.totalVariables.size > 20) {
            suggestions.push({
                title: 'Implement Database System',
                icon: '💾',
                priority: 'medium',
                description: 'Store data efficiently in database.',
                reason: `${this.projectStats.totalVariables.size} variables detected.`,
                example: `# Using Skript YAML addon
on load:
    if yaml "playerdata" doesn't exist:
        create yaml "playerdata"

function savePlayer(p: player):
    set yaml value "players.%uuid of {_p}%.name" to name of {_p}
    save yaml "playerdata"`,
                impact: 'Better performance and data persistence'
            });
        }

        if (hasCommands || hasEvents) {
            suggestions.push({
                title: 'Add Update Checker',
                icon: '🔄',
                priority: 'low',
                description: 'Notify about new versions automatically.',
                reason: 'Users won\'t know about updates.',
                example: `on join:
    if player is op:
        if {latest-version} is not set or difference between {last-check} and now > 1 day:
            # Check for updates using API
            send "&aNew version available!" to player`,
                impact: 'Keep users informed'
            });
        }

        if (!this.projectStats.usedLibraries.has('PlaceholderAPI') && hasEvents) {
            suggestions.push({
                title: 'Add PlaceholderAPI Support',
                icon: '🏷️',
                priority: 'low',
                description: 'Allow other plugins to use your data.',
                reason: 'Increases plugin compatibility.',
                example: `# Requires skript-placeholderapi
on placeholder request for "myplugin_balance":
    set result to "%{balance::%player%}%"`,
                impact: 'Better ecosystem integration'
            });
        }

        if (this.projectStats.totalLines > 500) {
            const complexFiles = this.scanResults.filter(r => r.stats.complexity > 20);
            if (complexFiles.length > 0) {
                suggestions.push({
                    title: 'Optimize Performance',
                    icon: '⚡',
                    priority: 'high',
                    description: 'Reduce lag with optimization techniques.',
                    reason: `${complexFiles.length} file(s) with high complexity detected.`,
                    example: `# Cache frequently accessed data
on load:
    set {cached::prefix} to colored "{@prefix}"

# Use local variables
command /test:
    trigger:
        set {_prefix} to {cached::prefix}
        send "%{_prefix}% Message" to player`,
                    impact: 'Better server performance'
                });
            }
        }

        return suggestions.sort((a, b) => {
            const priority = { critical: 0, high: 1, medium: 2, low: 3 };
            return priority[a.priority] - priority[b.priority];
        });
    }

    displayResults(showIssues, showFeatures, showSuggestions) {
        document.getElementById('scanResultsSection').style.display = 'block';

        if (showIssues) this.displayIssues();
        if (showFeatures) this.displayFeatures();
        if (showSuggestions) this.displaySuggestions();

        if (showIssues) this.switchTab('issues');
        else if (showFeatures) this.switchTab('features');
        else if (showSuggestions) this.switchTab('suggestions');
    }

    displayIssues() {
        let totalIssues = 0;
        let critical = 0, high = 0, medium = 0;

        this.scanResults.forEach(r => {
            totalIssues += r.issues.length;
            critical += r.issues.filter(i => i.severity === 'critical').length;
            high += r.issues.filter(i => i.severity === 'high').length;
            medium += r.issues.filter(i => i.severity === 'medium').length;
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
            <div class="summary-card">
                <div class="summary-number" style="color: var(--medium);">${medium}</div>
                <div>⚡ Medium</div>
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
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>Line ${issue.line}:</strong>
                            <span class="priority-badge priority-${issue.severity}">${issue.severity.toUpperCase()}</span>
                        </div>
                        <div style="margin-bottom: 0.5rem;">${this.escapeHtml(issue.message)}</div>
                        ${issue.code ? `<div class="code-preview" style="margin-bottom: 0.5rem;">${this.escapeHtml(issue.code)}</div>` : ''}
                        ${issue.fix ? `
                            <div style="background: rgba(16, 185, 129, 0.1); padding: 0.5rem; border-radius: 4px; font-size: 0.9rem;">
                                <strong>✅ Suggested Fix:</strong><br>
                                <code>${this.escapeHtml(issue.fix)}</code>
                            </div>
                        ` : ''}
                    </div>`;
                });
                
                html += `</div></div>`;
            }
        });

        document.getElementById('issuesResults').innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">✅</div><p>No issues found! Your code looks good.</p></div>';
    }

    displayFeatures() {
        const allFeatures = {};
        
        this.scanResults.forEach(result => {
            result.features.forEach(feature => {
                if (!allFeatures[feature.category]) {
                    allFeatures[feature.category] = [];
                }
                allFeatures[feature.category].push({...feature, file: result.fileName});
            });
        });

        let html = `
            <div class="info-box" style="margin-bottom: 2rem;">
                <div class="info-box-header">
                    <span>📊</span>
                    <span>Project Statistics</span>
                </div>
                <div class="info-box-content">
                    <strong>Total Files:</strong> ${this.files.length} | 
                    <strong>Total Lines:</strong> ${this.projectStats.totalLines} | 
                    <strong>Commands:</strong> ${this.projectStats.totalCommands} | 
                    <strong>Events:</strong> ${this.projectStats.totalEvents} | 
                    <strong>Functions:</strong> ${this.projectStats.totalFunctions}
                    ${this.projectStats.usedLibraries.size > 0 ? `<br><strong>Libraries:</strong> ${Array.from(this.projectStats.usedLibraries).join(', ')}` : ''}
                </div>
            </div>
        `;

        for (const [category, features] of Object.entries(allFeatures)) {
            html += `<div class="card" style="margin-bottom: 1rem;">
                <h3>${this.getCategoryIcon(category)} ${category} (${features.length})</h3>
                <div class="feature-grid">`;
            
            features.forEach(f => {
                html += `<div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">${f.icon || this.getCategoryIcon(category)}</div>
                        <span class="priority-badge priority-ok">${f.file}</span>
                    </div>
                    <div class="feature-name">${f.name}</div>
                    <div class="feature-category">Line ${f.line}</div>
                    ${f.details ? `
                        <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                            ${f.details.arguments ? `<div>Args: ${f.details.arguments.join(', ')}</div>` : ''}
                            ${f.details.parameters ? `<div>Params: ${f.details.parameters.join(', ')}</div>` : ''}
                            ${f.details.hasPermission !== undefined ? `<div>${f.details.hasPermission ? '✅' : '❌'} Permission</div>` : ''}
                            ${f.details.hasCooldown !== undefined ? `<div>${f.details.hasCooldown ? '✅' : '❌'} Cooldown</div>` : ''}
                            ${f.details.complexity ? `<div>Complexity: ${f.details.complexity}</div>` : ''}
                        </div>
                    ` : ''}
                </div>`;
            });
            
            html += `</div></div>`;
        }

        document.getElementById('featuresResults').innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📦</div><p>No features detected</p></div>';
    }

    displaySuggestions() {
        const suggestions = this.generateSuggestions();
        
        let html = `
            <div class="info-box" style="margin-bottom: 2rem;">
                <div class="info-box-header">
                    <span>💡</span>
                    <span>Next Steps for Your Plugin</span>
                </div>
                <div class="info-box-content">
                    Based on the analysis of your ${this.files.length} file(s), here are personalized recommendations to improve your plugin.
                </div>
            </div>
        `;
        
        suggestions.forEach((s, index) => {
            html += `<div class="suggestion-card fade-in" style="border-left-color: var(--${s.priority}); animation-delay: ${index * 0.1}s;">
                <div class="suggestion-header">
                    <div class="suggestion-title">
                        <span class="suggestion-icon">${s.icon}</span>
                        <span>${s.title}</span>
                    </div>
                    <span class="priority-badge priority-${s.priority}">${s.priority.toUpperCase()}</span>
                </div>
                <p class="suggestion-description">${s.description}</p>
                <div class="suggestion-reason">
                    <strong>💭 Why:</strong> ${s.reason}
                </div>
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(234, 179, 8, 0.1); border-radius: 6px; font-size: 0.9rem;">
                    <strong>⚡ Impact:</strong> ${s.impact}
                </div>
                <div>
                    <strong>📝 Example Implementation:</strong>
                    <pre class="suggestion-example">${this.escapeHtml(s.example)}</pre>
                </div>
            </div>`;
        });

        document.getElementById('suggestionsResults').innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">✨</div><p>No suggestions at the moment</p></div>';
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
            'Configuration': '⚙️',
            'Integrations': '🔌',
            'Variables': '💾'
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
        this.resetProjectStats();
        this.updateFileList();
        document.getElementById('scanResultsSection').style.display = 'none';
        document.getElementById('scanFileInput').value = '';
    }
}

window.scanner = null;