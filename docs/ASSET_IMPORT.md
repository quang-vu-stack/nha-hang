# Import ghế Blender và giọng NPC vào VIETNAM LIFE 3D

## Trạng thái
- Nhánh: `feat/blender-stool-elevenlabs-greeting`
- Giao diện `index.html` đã hỗ trợ `GLTFLoader` và giọng NPC kích hoạt bằng nút.
- **Chưa có tệp nhị phân trong repository**: nếu chưa đưa GLB/MP3 lên nhánh, ghế vẫn là hình trụ mẫu và nút thoại chưa phát được.

## Tệp cần bổ sung
Sau khi giải nén gói tài nguyên được cung cấp riêng trong ChatGPT, sao chép **đúng đường dẫn tương đối**:

```text
nha-hang/
├── index.html
├── src/
├── assets/
│   ├── models/
│   │   └── ghe-nhua.glb
│   └── audio/
│       └── chao-khach-vien.mp3
└── docs/
    └── ASSET_IMPORT.md
```

### Import trên Windows / Antigravity
1. Mở repository trên Antigravity hoặc VS Code và checkout nhánh `feat/blender-stool-elevenlabs-greeting` (không sửa `main`).
2. Copy hai tệp vào đúng thư mục `assets/models/` và `assets/audio/`.
3. Chạy `py -m http.server 5173` ở thư mục gốc và mở `http://localhost:5173`.
4. Nếu tải GLB thành công, các ghế hình trụ quanh bàn sẽ được thay bằng chiếc ghế nhựa 3D.
5. Nhấn **Nghe giọng chào khách** để kích hoạt tiếng Việt. Sau khi người dùng bật tiếng, khách mới đến có thể kích hoạt thoại, cách nhau ít nhất 15 giây.
6. Kiểm tra Console / Network của trình duyệt nếu gặp lỗi 404.

### Kiểm thử
```powershell
node --check src/simulation.mjs
node --test tests/simulation.test.mjs
```

## Tài nguyên
- Mô hình `ghe-nhua.glb` được người dùng gửi: glTF 2.0, khoảng 24.9 KB, 240 tam giác, xuất từ Blender.
- Giọng `chao-khach-vien.mp3` được người dùng gửi: 7.16 giây, 44.1 kHz mono, giọng "Viên" qua ElevenLabs.
- Câu thoại: "Dạ, em chào anh chị ạ. Nhà mình đi mấy người, để em sắp xếp bàn? Anh chị muốn ngồi trong nhà hay ngoài trời ạ?"

## Giấy phép và quyền phát hành
Mô hình cần xác nhận rằng người gửi có quyền dùng/đưa lên repository. **Không tự tải MP3 lên GitHub công khai khi chưa xác nhận quyền phân phối**. ElevenLabs Free chỉ dành cho mục đích phi thương mại và yêu cầu ghi công khi công bố tác phẩm không thương mại; bản quyền thương mại phụ thuộc điều kiện của gói mà người dùng đã dùng để tạo file. Khi được phép, ghi credit tương ứng trong trò chơi.

Không tự merge, không tự triển khai công khai, không phát sinh phí.