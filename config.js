export const CONFIG = {
    // Supported file extensions
    SUPPORTED_EXTENSIONS: ['.js', '.jsx', '.ts', '.tsx', '.json', '.yml', '.yaml', '.sk', '.py', '.java'],
    
    // API Configuration
    API: {
        ENDPOINT: '/api/optimize',
        MODEL: 'claude-sonnet-4-20250514',
        MAX_TOKENS: 8000,
        TEMPERATURE: 0.2,
        TIMEOUT: 120000 // 2 minutes
    },
    
    // File size limits (in bytes)
    LIMITS: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB per file
        MAX_FILES: 50, // Maximum number of files
        MAX_TOTAL_SIZE: 50 * 1024 * 1024 // 50MB total
    },
    
    // Skript detection patterns
    SKRIPT: {
        EXTENSIONS: ['.sk'],
        KEYWORDS: [
            'command', 'on load', 'on join', 'on quit', 'on death',
            'set {', 'if {', 'loop', 'wait', 'broadcast', 'send',
            'execute', 'make', 'add', 'remove', 'clear', 'delete',
            'function', 'options:', 'variables:', 'else if:', 'else:'
        ],
        VARIABLE_PATTERNS: ['{_', '{@', '{-'],
        COMMENT_CHAR: '#'
    },
    
    // UI Messages
    MESSAGES: {
        SUCCESS: '✅ Optimasi berhasil!',
        ERROR: '❌ Terjadi kesalahan',
        PROCESSING: '⏳ Sedang memproses...',
        SKRIPT_DETECTED: '⚠️ Skript file detected - syntax will be preserved',
        FILE_TOO_LARGE: 'File terlalu besar (max 5MB)',
        TOO_MANY_FILES: 'Terlalu banyak file (max 50)',
        UNSUPPORTED_FILE: 'File type tidak didukung'
    },
    
    // Default options
    DEFAULT_OPTIONS: {
        fixSyntax: true,
        optimizeCode: true,
        addComments: true,
        modernize: true, // Will be disabled for Skript
        securityCheck: true,
        bestPractices: true
    },
    
    // Language detection
    LANGUAGE_MAP: {
        '.js': 'JavaScript',
        '.jsx': 'React JSX',
        '.ts': 'TypeScript',
        '.tsx': 'React TSX',
        '.py': 'Python',
        '.java': 'Java',
        '.sk': 'Skript',
        '.json': 'JSON',
        '.yml': 'YAML',
        '.yaml': 'YAML'
    },
    
    // Feature flags
    FEATURES: {
        ENABLE_BACKUP: true,
        ENABLE_COMPARISON: true,
        ENABLE_PRE_VALIDATION: true,
        ENABLE_AUTO_DOWNLOAD: false,
        SHOW_STATISTICS: true
    }
};

export default CONFIG;