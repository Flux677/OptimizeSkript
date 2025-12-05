export class UIController {
    constructor() {
        this.fileListEl = document.getElementById('fileList');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsList = document.getElementById('resultsList');
    }

    renderFileList(files, onRemove) {
        if (files.length === 0) {
            this.fileListEl.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Belum ada file yang dipilih</p>';
            return;
        }

        this.fileListEl.innerHTML = files.map(file => `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-info">
                    <div class="file-icon">${this.getFileIcon(file.extension)}</div>
                    <div class="file-details">
                        <h4>${this.escapeHtml(file.name)}</h4>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                    </div>
                </div>
                <button class="file-remove" data-file-id="${file.id}">✕</button>
            </div>
        `).join('');

        // Attach remove event listeners
        this.fileListEl.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = parseInt(e.target.dataset.fileId);
                onRemove(fileId);
            });
        });
    }

    getFileIcon(extension) {
        const icons = {
            '.js': 'JS',
            '.jsx': 'JSX',
            '.ts': 'TS',
            '.tsx': 'TSX',
            '.json': 'JSON',
            '.yml': 'YML',
            '.yaml': 'YML'
        };
        return icons[extension] || 'FILE';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    showProgress() {
        this.progressSection.style.display = 'block';
        this.updateProgress(0, 'Memulai proses...');
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
    }

    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressFill.textContent = `${Math.round(percentage)}%`;
        this.progressText.textContent = text;
    }

    showResults(results) {
        this.resultsSection.style.display = 'block';
        
        this.resultsList.innerHTML = results.map((result, index) => {
            if (result.success) {
                return this.renderSuccessResult(result, index);
            } else {
                return this.renderErrorResult(result, index);
            }
        }).join('');

        // Attach event listeners for download buttons
        this.resultsList.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.downloadResult(results[index]);
            });
        });

        // Attach event listeners for view details buttons
        this.resultsList.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.viewResultDetails(results[index]);
            });
        });
    }

    renderSuccessResult(result, index) {
        return `
            <div class="result-item">
                <div class="result-header">
                    <h3>📄 ${this.escapeHtml(result.fileName)}</h3>
                    <span class="result-status success">✓ Berhasil</span>
                </div>
                <div class="result-details">
                    ${result.changes && result.changes.length > 0 ? `
                        <strong>Perubahan:</strong>
                        <ul style="margin: 0.5rem 0 0.5rem 1.5rem;">
                            ${result.changes.map(change => `<li>${this.escapeHtml(change)}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${result.issues && result.issues.length > 0 ? `
                        <strong>Issue yang diperbaiki:</strong>
                        <ul style="margin: 0.5rem 0 0.5rem 1.5rem;">
                            ${result.issues.map(issue => `<li>${this.escapeHtml(issue)}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
                <div class="result-actions">
                    <button class="btn btn-primary btn-small btn-download" data-index="${index}">
                        💾 Download
                    </button>
                    <button class="btn btn-secondary btn-small btn-view" data-index="${index}">
                        👁️ Lihat Detail
                    </button>
                </div>
            </div>
        `;
    }

    renderErrorResult(result, index) {
        return `
            <div class="result-item error">
                <div class="result-header">
                    <h3>📄 ${this.escapeHtml(result.fileName)}</h3>
                    <span class="result-status error">✗ Error</span>
                </div>
                <div class="result-details">
                    <strong>Error:</strong> ${this.escapeHtml(result.error)}
                </div>
            </div>
        `;
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    downloadResult(result) {
        if (!result.optimizedCode) {
            alert('Tidak ada kode yang bisa didownload');
            return;
        }

        const blob = new Blob([result.optimizedCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `optimized_${result.fileName}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    viewResultDetails(result) {
        const modalContent = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem;" id="detailModal">
                <div style="background: var(--bg-card); border-radius: 12px; padding: 2rem; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2>Detail: ${this.escapeHtml(result.fileName)}</h2>
                        <button onclick="document.getElementById('detailModal').remove()" style="background: var(--danger); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">✕ Tutup</button>
                    </div>
                    
                    ${result.changes && result.changes.length > 0 ? `
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="margin-bottom: 0.5rem;">📝 Perubahan:</h3>
                            <ul style="margin-left: 1.5rem; line-height: 1.8;">
                                ${result.changes.map(change => `<li>${this.escapeHtml(change)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${result.issues && result.issues.length > 0 ? `
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="margin-bottom: 0.5rem;">🔧 Issue yang Diperbaiki:</h3>
                            <ul style="margin-left: 1.5rem; line-height: 1.8;">
                                ${result.issues.map(issue => `<li>${this.escapeHtml(issue)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${result.suggestions && result.suggestions.length > 0 ? `
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="margin-bottom: 0.5rem;">💡 Saran:</h3>
                            <ul style="margin-left: 1.5rem; line-height: 1.8;">
                                ${result.suggestions.map(suggestion => `<li>${this.escapeHtml(suggestion)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${result.optimizedCode ? `
                        <div>
                            <h3 style="margin-bottom: 0.5rem;">💻 Kode yang Dioptimasi:</h3>
                            <pre style="background: var(--bg); padding: 1rem; border-radius: 8px; overflow-x: auto; max-height: 400px;"><code>${this.escapeHtml(result.optimizedCode)}</code></pre>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalContent);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}