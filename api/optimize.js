// Vercel Serverless Function untuk handle Claude API
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileName, content, options, prompt } = req.body;

        if (!fileName || !content) {
            return res.status(400).json({ error: 'fileName and content are required' });
        }

        // Get API key from environment variable
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
        }

        // Enhanced system prompt for better accuracy
        const systemPrompt = `You are an expert code optimizer with deep knowledge of multiple programming languages including:
- JavaScript/TypeScript/React
- Python
- Java
- Skript (Minecraft plugin language)
- YAML/JSON

CRITICAL: When working with Skript files (.sk), you MUST:
1. Preserve ALL Skript-specific syntax (command, on, set, if, loop, etc.)
2. NEVER convert to JavaScript, Java, or any other language
3. Keep variable syntax as {variable} or {_variable}
4. Maintain indentation with tabs/spaces as in original
5. Do NOT add semicolons
6. Fix errors according to Skript language rules ONLY

For other languages, apply modern best practices while maintaining the original language.`;

        // Call Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 8000,
                temperature: 0.2, // Lower temperature for more consistent output
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Claude API Error:', errorData);
            return res.status(response.status).json({ 
                error: `Claude API error: ${errorData.error?.message || 'Unknown error'}` 
            });
        }

        const data = await response.json();
        
        // Extract text content from Claude's response
        const textContent = data.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');

        // Try to parse as JSON, fallback to plain text
        let result;
        try {
            // Try to extract JSON from the response
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, create structured response
                result = {
                    optimizedCode: textContent,
                    changes: ['Kode telah dioptimasi dan diperbaiki sesuai bahasa yang digunakan'],
                    issues: ['Analisis lengkap telah dilakukan'],
                    suggestions: ['Review kode untuk memastikan semuanya sesuai kebutuhan']
                };
            }
        } catch (parseError) {
            console.error('Parse error:', parseError);
            result = {
                optimizedCode: textContent,
                changes: ['Kode telah diproses'],
                issues: [],
                suggestions: []
            };
        }

        // Validate that we didn't accidentally convert Skript to another language
        const isSkriptFile = fileName.endsWith('.sk') || 
                            content.includes('command ') || 
                            content.includes('on load:');
        
        if (isSkriptFile && result.optimizedCode) {
            // Basic check: if output has JS syntax, revert to original
            const hasJSSyntax = result.optimizedCode.includes('const ') || 
                               result.optimizedCode.includes('let ') ||
                               result.optimizedCode.includes('=>') ||
                               result.optimizedCode.includes('function(');
            
            if (hasJSSyntax) {
                console.warn('Detected JS syntax in Skript file output, reverting to original');
                result.optimizedCode = content;
                result.changes = ['PRESERVED: Kode original dipertahankan karena terdeteksi perubahan syntax yang tidak sesuai'];
                result.issues = ['System mencegah perubahan yang bisa merusak Skript syntax'];
            }
        }

        // Return the result
        return res.status(200).json(result);

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: `Server error: ${error.message}` 
        });
    }
}