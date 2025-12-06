export class ErrorHandler {
    constructor() {
        this.errors = [];
    }

    handle(error, context = {}) {
        const errorInfo = {
            message: error.message || 'Unknown error',
            type: error.name || 'Error',
            context: context,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };

        this.errors.push(errorInfo);
        console.error('Error occurred:', errorInfo);

        return this.formatErrorMessage(errorInfo);
    }

    formatErrorMessage(errorInfo) {
        const messages = {
            'NetworkError': 'Koneksi terputus. Pastikan internet aktif.',
            'TimeoutError': 'Request timeout. Coba lagi dalam beberapa saat.',
            'APIError': 'Error dari Claude API. Periksa API key atau coba lagi.',
            'ValidationError': 'File gagal validasi. Periksa format file.',
            'ParseError': 'Gagal mem-parse response. Coba lagi.',
            'FileError': 'Error saat membaca file. Pastikan file valid.'
        };

        return messages[errorInfo.type] || errorInfo.message;
    }

    handleAPIError(error, fileName) {
        if (error.message.includes('401') || error.message.includes('authentication')) {
            return {
                fileName,
                success: false,
                error: '🔑 API Key tidak valid. Periksa ANTHROPIC_API_KEY di environment variables.'
            };
        }

        if (error.message.includes('429') || error.message.includes('rate limit')) {
            return {
                fileName,
                success: false,
                error: '⏱️ Rate limit tercapai. Tunggu beberapa saat dan coba lagi.'
            };
        }

        if (error.message.includes('timeout')) {
            return {
                fileName,
                success: false,
                error: '⏰ Request timeout. File mungkin terlalu besar atau koneksi lambat.'
            };
        }

        return {
            fileName,
            success: false,
            error: `❌ ${error.message}`
        };
    }

    handleValidationError(fileName, validation) {
        const errorIssues = validation.issues.filter(i => i.type === 'error');
        
        return {
            fileName,
            success: false,
            error: `Validation failed dengan ${errorIssues.length} error(s)`,
            validationIssues: validation.issues
        };
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 1.5rem;">⚠️</span>
                <div>
                    <strong>Error!</strong><br>
                    <span style="font-size: 0.9rem;">${message}</span>
                </div>
            </div>
        `;

        // Add animation
        const style = document.createElement('style');
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

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 1.5rem;">✅</span>
                <div>
                    <strong>Success!</strong><br>
                    <span style="font-size: 0.9rem;">${message}</span>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getErrorLog() {
        return this.errors;
    }

    clearErrors() {
        this.errors = [];
    }

    exportErrorLog() {
        const log = JSON.stringify(this.errors, null, 2);
        const blob = new Blob([log], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}