export class BackupManager {
    constructor() {
        this.backups = new Map();
    }

    createBackup(fileName, originalContent) {
        const backupId = `backup_${Date.now()}_${fileName}`;
        this.backups.set(fileName, {
            id: backupId,
            fileName: fileName,
            content: originalContent,
            timestamp: new Date().toISOString(),
            hash: this.hashCode(originalContent)
        });
        return backupId;
    }

    getBackup(fileName) {
        return this.backups.get(fileName);
    }

    hasBackup(fileName) {
        return this.backups.has(fileName);
    }

    restoreBackup(fileName) {
        const backup = this.backups.get(fileName);
        if (backup) {
            return backup.content;
        }
        return null;
    }

    compareWithBackup(fileName, newContent) {
        const backup = this.backups.get(fileName);
        if (!backup) return null;

        const changes = {
            hasChanges: backup.hash !== this.hashCode(newContent),
            originalSize: backup.content.length,
            newSize: newContent.length,
            sizeDiff: newContent.length - backup.content.length,
            linesOriginal: backup.content.split('\n').length,
            linesNew: newContent.split('\n').length
        };

        return changes;
    }

    exportBackup(fileName) {
        const backup = this.backups.get(fileName);
        if (!backup) return null;

        return {
            fileName: `${fileName}.backup`,
            content: backup.content,
            timestamp: backup.timestamp
        };
    }

    clearBackups() {
        this.backups.clear();
    }

    clearBackup(fileName) {
        this.backups.delete(fileName);
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    getAllBackups() {
        return Array.from(this.backups.values());
    }

    downloadAllBackups() {
        const backups = this.getAllBackups();
        if (backups.length === 0) {
            alert('Tidak ada backup untuk didownload');
            return;
        }

        backups.forEach(backup => {
            this.downloadBackup(backup.fileName);
        });
    }

    downloadBackup(fileName) {
        const backup = this.backups.get(fileName);
        if (!backup) return;

        const blob = new Blob([backup.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.backup`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}