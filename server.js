require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Lấy thông tin GitHub từ .env
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPO = process.env.GITHUB_REPO;

// Sử dụng memory storage của Multer (không lưu file cục bộ)
const upload = multer({ storage: multer.memoryStorage() });

// Serve file tĩnh từ thư mục public
app.use(express.static('public'));

/**
 * Endpoint /upload:
 * - Nhận file từ form (file field: video)
 * - Nếu có tham số folder từ client, file sẽ được lưu vào đường dẫn uploads/<folder>/filename
 * - Chuyển file sang Base64 và gửi lên GitHub qua API.
 */
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được upload' });
    }
    
    // Lấy tên folder nếu có, nếu không thì để trống
    let folder = req.body.folder ? req.body.folder.trim() : '';
    // Tạo tên file với timestamp để tránh trùng lặp
    let filePath = folder 
      ? `${folder}/${Date.now()}-${req.file.originalname}` 
      : `${Date.now()}-${req.file.originalname}`;
    
    // Chuyển file buffer thành Base64
    const base64Content = req.file.buffer.toString('base64');
    
    // Gọi API GitHub để tạo file tại đường dẫn: /contents/uploads/<filePath>
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/uploads/${filePath}`;
    
    const response = await axios.put(url, {
      message: 'Upload video',
      content: base64Content
    }, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, message: error.response?.data?.message || error.message });
  }
});

/**
 * Endpoint /videos:
 * - Lấy danh sách các file trong thư mục uploads trên GitHub.
 */
app.get('/videos', async (req, res) => {
  try {
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/uploads/`;
    const response = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    
    // Lọc các file có đuôi video (mp4, avi, mov)
    const videos = response.data.filter(file => file.type === 'file' && file.name.match(/\.(mp4|avi|mov)$/i));
    res.json(videos);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: error.response?.data?.message || error.message });
  }
});

// Serve trang index.html cho route gốc
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
