export class AutoSave {
    constructor() {
        this.storageKey = 'plugin_optimizer_results';
        this.sessionKey = 'plugin_optimizer_session';
    }

    // Save results to browser storage
    saveResults(results) {
        try {
            const data = {
                results: results,
                timestamp: new Date().toISOString(),
                sessionId: this.getSessionId()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('✅ Results auto-saved to browser storage');
            return true;
        } catch (error) {
            console.error('Failed to save results:', error);
            return false;
        }
    }

    // Load saved results
    loadResults() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;

            const parsed = JSON.parse(data);
            return parsed;
        } catch (error) {
            console.error('Failed to load results:', error);
            return null;
        }
    }

    // Check if has saved results
    hasSavedResults() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    // Clear saved results
    clearSavedResults() {
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Saved results cleared');
    }

    // Get or create session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem(this.sessionKey);
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem(this.sessionKey, sessionId);
        }
        return sessionId;
    }

    // Export results to file automatically
    autoExportResults(results) {
        try {
            const data = {
                exportedAt: new Date().toISOString(),
                totalFiles: results.length,
                results: results.map(r => ({
                    fileName: r.fileName,
                    success: r.success,
                    optimizedCode: r.optimizedCode,
                    changes: r.changes,
                    issues: r.issues,
                    suggestions: r.suggestions
                }))
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `optimization-results-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ Results auto-exported to JSON file');
            return true;
        } catch (error) {
            console.error('Failed to auto-export:', error);
            return false;
        }
    }

    // Show restore notification
    showRestoreNotification(onRestore, onDismiss) {
        const notification = document.createElement('div');
        notification.id = 'restoreNotification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        const savedData = this.loadResults();
        const timeAgo = this.getTimeAgo(savedData.timestamp);

        notification.innerHTML = `
            <div style="display: flex; align-items: start; gap: 1rem;">
                <span style="font-size: 2rem;">💾</span>
                <div style="flex: 1;">
                    <strong style="font-size: 1.1rem;">Previous Session Found!</strong>
                    <p style="margin: 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">
                        ${savedData.results.length} file(s) optimized ${timeAgo}
                    </p>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button id="restoreBtn" style="
                            background: white;
                            color: #6366f1;
                            border: none;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                        ">📂 Restore</button>
                        <button id="dismissBtn" style="
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: none;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            cursor: pointer;
                        ">✕ Dismiss</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        document.getElementById('restoreBtn').addEventListener('click', () => {
            onRestore(savedData.results);
            notification.remove();
        });

        document.getElementById('dismissBtn').addEventListener('click', () => {
            onDismiss();
            notification.remove();
        });

        // Add CSS animation
        if (!document.getElementById('autoSaveStyles')) {
            const style = document.createElement('style');
            style.id = 'autoSaveStyles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Get human-readable time ago
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = Math.floor((now - past) / 1000); // seconds

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    }

    // Get storage info
    getStorageInfo() {
        try {
            const data = this.loadResults();
            if (!data) return null;

            const size = new Blob([JSON.stringify(data)]).size;
            return {
                fileCount: data.results.length,
                timestamp: data.timestamp,
                size: this.formatSize(size),
                timeAgo: this.getTimeAgo(data.timestamp)
            };
        } catch (error) {
            return null;
        }
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}