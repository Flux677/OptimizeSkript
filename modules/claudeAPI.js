export class ClaudeAPI {
    constructor() {
        this.apiEndpoint = '/api/optimize';
    }

    async optimizePlugin(fileName, content, options) {
        const prompt = this.buildPrompt(fileName, content, options);

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName,
                    content,
                    options,
                    prompt
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Claude API Error:', error);
            throw new Error(`Gagal mengoptimasi ${fileName}: ${error.message}`);
        }
    }

    buildPrompt(fileName, content, options) {
        // Detect file type/language
        const fileExt = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
        const isSkript = fileExt === '.sk' || content.includes('command ') || content.includes('on load:') || content.includes('options:');
        
        let prompt = `Kamu adalah expert developer yang akan menganalisis dan memperbaiki plugin script berikut.

FILE: ${fileName}
DETECTED LANGUAGE: ${isSkript ? 'Skript (Minecraft Plugin Language)' : this.detectLanguage(fileExt)}
KONTEN:
\`\`\`
${content}
\`\`\`

⚠️ CRITICAL WARNING:
`;

        if (isSkript) {
            prompt += `- Ini adalah file SKRIPT untuk Minecraft server
- JANGAN UBAH syntax menjadi JavaScript/Java/Python atau bahasa lain
- PERTAHANKAN syntax Skript yang original (on, command, set, if, else, loop, dll)
- JANGAN gunakan arrow functions, const/let, atau syntax modern JS
- JANGAN tambahkan semicolons di akhir baris
- PERTAHANKAN format indentasi dengan tab/spaces sesuai original
- Syntax Skript berbeda total dari bahasa pemrograman umum
`;
        } else {
            prompt += `- Deteksi bahasa pemrograman dengan benar
- Gunakan syntax yang sesuai dengan bahasa yang digunakan
- Jangan mengubah ke bahasa lain
`;
        }

        prompt += `
TUGAS:
`;

        if (options.fixSyntax) {
            if (isSkript) {
                prompt += `1. Perbaiki syntax errors SKRIPT (bukan JavaScript):
   - Check kondisi yang salah (is, is not, contains, dll)
   - Perbaiki loop syntax yang error
   - Fix expression yang tidak valid dalam Skript
   - Pastikan variables menggunakan {_variable} atau {variable}
   - JANGAN ubah ke syntax bahasa lain\n`;
            } else {
                prompt += `1. Perbaiki syntax errors sesuai bahasa yang digunakan.\n`;
            }
        }

        if (options.optimizeCode) {
            if (isSkript) {
                prompt += `2. Optimalisasi kode Skript:
   - Hilangkan redundansi
   - Perbaiki loop yang inefficient
   - Gunakan wait/delay dengan bijak
   - TETAP gunakan syntax Skript original\n`;
            } else {
                prompt += `2. Optimalisasi performa dengan menghilangkan redundansi.\n`;
            }
        }

        if (options.addComments) {
            prompt += `3. Tambahkan komentar yang jelas (gunakan # untuk Skript, // atau sesuai bahasa).\n`;
        }

        if (options.modernize && !isSkript) {
            prompt += `4. Modernisasi kode (SKIP untuk Skript, hanya untuk JS/TS/Python dll).\n`;
        }

        if (options.securityCheck) {
            prompt += `${isSkript ? '4' : '5'}. Audit keamanan: identifikasi vulnerability.\n`;
        }

        if (options.bestPractices) {
            if (isSkript) {
                prompt += `5. Terapkan best practices Skript:\n   - Proper event handling\n   - Efficient variable usage\n   - Clear command structure\n`;
            } else {
                prompt += `6. Terapkan best practices bahasa tersebut.\n`;
            }
        }

        prompt += `
CRITICAL REQUIREMENTS:
${isSkript ? '- WAJIB: Output harus tetap valid Skript syntax, BUKAN JavaScript/Java' : ''}
- Pastikan kode 100% valid tanpa syntax errors
- JANGAN UBAH bahasa pemrograman yang digunakan
- Maintain functionality yang sudah ada
- Return kode dalam format dan bahasa yang SAMA PERSIS
- Jika tidak yakin dengan perubahan, JANGAN ubah

FORMAT RESPONSE:
Berikan response dalam format JSON berikut:
{
  "optimizedCode": "kode yang sudah diperbaiki (SAME LANGUAGE)",
  "changes": ["daftar perubahan yang dilakukan"],
  "issues": ["daftar issue yang ditemukan dan diperbaiki"],
  "suggestions": ["saran tambahan"],
  "language": "${isSkript ? 'Skript' : 'auto-detect'}"
}`;

        return prompt;
    }

    detectLanguage(ext) {
        const langMap = {
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
        };
        return langMap[ext] || 'Unknown';
    }

    parseResponse(responseText) {
        try {
            // Try to extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback if no JSON found
            return {
                optimizedCode: responseText,
                changes: ['Kode telah dioptimasi'],
                issues: [],
                suggestions: []
            };
        } catch (error) {
            console.error('Parse error:', error);
            return {
                optimizedCode: responseText,
                changes: ['Response diterima'],
                issues: [],
                suggestions: []
            };
        }
    }
}