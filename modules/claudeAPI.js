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
        let prompt = `Kamu adalah expert developer yang akan menganalisis dan memperbaiki plugin script berikut.

FILE: ${fileName}
KONTEN:
\`\`\`
${content}
\`\`\`

TUGAS:
`;

        if (options.fixSyntax) {
            prompt += `1. Perbaiki semua syntax errors dengan teliti. Pastikan TIDAK ADA syntax error yang terlewat.\n`;
        }

        if (options.optimizeCode) {
            prompt += `2. Optimalisasi performa kode dengan menghilangkan redundansi, memperbaiki algoritma yang inefficient.\n`;
        }

        if (options.addComments) {
            prompt += `3. Tambahkan dokumentasi dan komentar yang jelas untuk setiap fungsi penting.\n`;
        }

        if (options.modernize) {
            prompt += `4. Modernisasi kode ke ES6+ syntax (arrow functions, const/let, template literals, dll).\n`;
        }

        if (options.securityCheck) {
            prompt += `5. Audit keamanan: identifikasi dan perbaiki potential security vulnerabilities.\n`;
        }

        if (options.bestPractices) {
            prompt += `6. Terapkan best practices dan coding standards terkini.\n`;
        }

        prompt += `
REQUIREMENTS:
- Pastikan kode 100% valid tanpa syntax errors
- Maintain functionality yang sudah ada
- Return kode yang sudah diperbaiki dalam format yang sama
- Berikan penjelasan singkat tentang perubahan yang dilakukan

FORMAT RESPONSE:
Berikan response dalam format JSON berikut:
{
  "optimizedCode": "kode yang sudah diperbaiki",
  "changes": ["daftar perubahan yang dilakukan"],
  "issues": ["daftar issue yang ditemukan dan diperbaiki"],
  "suggestions": ["saran tambahan untuk improvement"]
}`;

        return prompt;
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