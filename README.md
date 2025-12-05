# 🔧 Plugin Script Optimizer

Tools berbasis AI untuk memperbaiki dan mengoptimalisasi plugin script dengan akurasi tinggi menggunakan Claude API.

## ✨ Fitur

- ✅ **Perbaikan Syntax Error** - Deteksi dan perbaiki semua syntax errors
- 🚀 **Optimalisasi Performa** - Tingkatkan efisiensi kode
- 📝 **Auto Documentation** - Tambahkan komentar dan dokumentasi
- 🔄 **Modernisasi Kode** - Update ke ES6+ syntax
- 🔒 **Security Audit** - Identifikasi vulnerability
- 📦 **Best Practices** - Terapkan coding standards terkini
- 🎯 **High Accuracy** - Keakuratan tinggi tanpa miss syntax
- 📊 **Batch Processing** - Proses 40+ file sekaligus

## 🏗️ Struktur Project

```
plugin-optimizer/
├── index.html              # Main HTML
├── style.css              # Styling
├── app.js                 # Main application
├── modules/
│   ├── fileManager.js     # File management
│   ├── claudeAPI.js       # Claude API integration
│   └── uiController.js    # UI management
├── api/
│   └── optimize.js        # Vercel serverless function
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
└── README.md              # Documentation
```

## 🚀 Setup & Deployment

### 1. Clone atau Download Project

```bash
git clone <your-repo-url>
cd plugin-optimizer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` atau set di Vercel Dashboard:

```env
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### 4. Local Development

```bash
npm run dev
```

Buka `http://localhost:3000`

### 5. Deploy ke Vercel

#### Via Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel --prod
```

#### Via Vercel Dashboard:

1. Push code ke GitHub/GitLab/Bitbucket
2. Import project di [vercel.com](https://vercel.com)
3. Tambahkan Environment Variable `ANTHROPIC_API_KEY`
4. Deploy!

### 6. Set Environment Variable di Vercel

1. Buka project di Vercel Dashboard
2. Go to **Settings** → **Environment Variables**
3. Tambahkan:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `your_actual_api_key`
   - Environment: Production, Preview, Development
4. Redeploy project

## 📖 Cara Penggunaan

1. **Upload Files**
   - Klik area upload atau drag & drop
   - Support: `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.yml`, `.yaml`
   - Bisa upload 40+ files sekaligus

2. **Pilih Opsi Optimasi**
   - Centang fitur yang diinginkan
   - Semua opsi default aktif

3. **Proses**
   - Klik tombol "🚀 Proses Semua File"
   - Tunggu hingga selesai

4. **Download Hasil**
   - Review hasil optimasi
   - Download per file atau semua sekaligus
   - Lihat detail perubahan

## 🎨 Fitur UI

- 🌙 Dark mode modern
- 📱 Responsive design
- 🎯 Drag & drop upload
- 📊 Progress tracking
- 💾 Individual/bulk download
- 👁️ Preview hasil optimasi
- 🎨 Gradient styling

## 🔧 API Endpoint

### POST `/api/optimize`

Request body:
```json
{
  "fileName": "plugin.js",
  "content": "// code here",
  "options": {
    "fixSyntax": true,
    "optimizeCode": true,
    "addComments": true,
    "modernize": true,
    "securityCheck": true,
    "bestPractices": true
  },
  "prompt": "detailed prompt"
}
```

Response:
```json
{
  "optimizedCode": "// optimized code",
  "changes": ["list of changes"],
  "issues": ["list of fixed issues"],
  "suggestions": ["improvement suggestions"]
}
```

## ⚙️ Configuration

### Vercel.json

File ini mengatur routing dan environment variables untuk Vercel deployment.

### Claude API Settings

- Model: `claude-sonnet-4-20250514`
- Max tokens: `8000`
- Temperature: `0.3` (untuk konsistensi)

## 🔒 Security

- API key disimpan di environment variables
- CORS configured
- Input validation
- Error handling

## 🐛 Troubleshooting

### API Key Error
- Pastikan `ANTHROPIC_API_KEY` sudah di-set di Vercel
- Check API key valid di [console.anthropic.com](https://console.anthropic.com)

### CORS Error
- Vercel.json sudah configured untuk CORS
- Jika masih error, check deployment logs

### File Upload Error
- Check file extension yang didukung
- Max file size tergantung browser
- Clear cache dan reload

## 📝 License

MIT License

## 🤝 Contributing

Pull requests welcome! Untuk perubahan besar, buka issue dulu.

## 📧 Support

Jika ada masalah atau pertanyaan, buka issue di repository.

---

**Made with ❤️ using Claude AI**