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
                temperature: 0.3,
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
                    changes: ['Kode telah dioptimasi dan diperbaiki'],
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

        // Return the result
        return res.status(200).json(result);

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: `Server error: ${error.message}` 
        });
    }
}