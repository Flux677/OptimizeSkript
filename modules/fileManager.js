export class FileManager {
    constructor() {
        this.files = [];
        this.fileIdCounter = 0;
    }

    addFile(file) {
        const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.yml', '.yaml'];
        const fileExtension = this.getFileExtension(file.name);

        if (!supportedExtensions.includes(fileExtension)) {
            alert(`File ${file.name} tidak didukung. Hanya menerima: ${supportedExtensions.join(', ')}`);
            return false;
        }

        // Check if file already exists
        const exists = this.files.some(f => f.name === file.name);
        if (exists) {
            alert(`File ${file.name} sudah ditambahkan.`);
            return false;
        }

        this.files.push({
            id: ++this.fileIdCounter,
            name: file.name,
            size: file.size,
            type: file.type,
            extension: fileExtension,
            file: file
        });

        return true;
    }

    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
    }

    getFiles() {
        return this.files;
    }

    getFile(fileId) {
        return this.files.find(f => f.id === fileId);
    }

    clearAll() {
        this.files = [];
        this.fileIdCounter = 0;
    }

    getFileExtension(filename) {
        return filename.slice(filename.lastIndexOf('.')).toLowerCase();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Gagal membaca file'));
            reader.readAsText(file);
        });
    }

    downloadFile(fileName, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadAllAsZip(results) {
        // This would require a library like JSZip for actual implementation
        console.log('Download all as ZIP', results);
    }
}