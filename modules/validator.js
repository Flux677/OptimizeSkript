export class Validator {
    constructor() {
        this.skriptKeywords = [
            'command', 'on load', 'on join', 'on quit', 'on death',
            'set {', 'if {', 'loop', 'wait', 'broadcast', 'send',
            'execute', 'make', 'add', 'remove', 'clear', 'delete',
            'function', 'options:', 'variables:', 'else if:', 'else:'
        ];
    }

    isSkriptFile(fileName, content) {
        const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
        if (ext === '.sk') return true;

        // Check content for Skript patterns
        const hasSkriptKeywords = this.skriptKeywords.some(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );

        const hasSkriptVariables = content.includes('{_') || content.includes('{@');
        const hasSkriptConditions = /\b(is|is not|contains|does not contain)\b/.test(content);

        return hasSkriptKeywords || hasSkriptVariables || hasSkriptConditions;
    }

    validateSkriptSyntax(content) {
        const issues = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) return;

            // Check for common JavaScript/Java syntax that shouldn't be in Skript
            if (trimmed.includes('const ') || trimmed.includes('let ') || trimmed.includes('var ')) {
                issues.push({
                    line: lineNum,
                    type: 'error',
                    message: 'JavaScript variable declaration detected. Use Skript syntax: set {variable} to value'
                });
            }

            if (trimmed.includes('=>') || trimmed.includes('function(')) {
                issues.push({
                    line: lineNum,
                    type: 'error',
                    message: 'JavaScript function syntax detected. Use Skript function syntax'
                });
            }

            if (trimmed.endsWith(';') && !trimmed.startsWith('execute')) {
                issues.push({
                    line: lineNum,
                    type: 'warning',
                    message: 'Semicolon detected. Skript doesn\'t use semicolons'
                });
            }

            // Check for missing colons in conditions/events
            if ((trimmed.startsWith('if ') || trimmed.startsWith('else if ')) && 
                !trimmed.endsWith(':')) {
                issues.push({
                    line: lineNum,
                    type: 'error',
                    message: 'Missing colon at end of condition'
                });
            }
        });

        return issues;
    }

    preValidate(fileName, content) {
        const isSkript = this.isSkriptFile(fileName, content);
        
        if (isSkript) {
            const issues = this.validateSkriptSyntax(content);
            return {
                isSkript: true,
                valid: issues.filter(i => i.type === 'error').length === 0,
                issues: issues
            };
        }

        return {
            isSkript: false,
            valid: true,
            issues: []
        };
    }

    formatIssues(issues) {
        if (issues.length === 0) return 'No issues found';
        
        return issues.map(issue => 
            `Line ${issue.line} [${issue.type.toUpperCase()}]: ${issue.message}`
        ).join('\n');
    }
}