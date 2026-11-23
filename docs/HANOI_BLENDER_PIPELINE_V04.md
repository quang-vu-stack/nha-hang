# HANOI WORLD — Blender production pipeline V0.4

**Dự án:** VIETNAM LIFE 3D — Restaurant & City Simulator
**Repository:** https://github.com/quang-vu-stack/nha-hang
**Nhánh:** feat/hanoi-blender-world-pipeline — tách biệt với main và các PR V0.3.

## Đã có trên GitHub

- tools/blender_finalize_hanoi.py — Blender Python (bpy) tự động mở scene, thêm cảnh, lưu bản sao .blend, xuất GLB riêng, tạo báo cáo kiểm tra.
- tools/run_blender_windows.ps1 — trình khởi chạy Blender trên Windows.
- assets/models/hanoi-expansion-v04.glb — asset khu phố Hà Nội độc lập, GLB 2.0 khoảng 135 KB, 20 nhà ống, 8 cây, 8 đèn, 7 xe máy, 5 bàn; 6.076 tam giác. Đây là cảnh mới tạo bằng code, KHÔNG phải cảnh trích xuất từ file .blend của người dùng.
- tests/test_blender_pipeline.py — chín bài kiểm tra tĩnh.
- .github/workflows/blender-pipeline.yml — kiểm tra cú pháp script và test trên GitHub Actions (không chạy Blender).

## Cách sử dụng trên Windows

1. Lưu file gốc VIETNAM_LIFE_3D_HANOI_WORLD.blend (đã gửi trong ChatGPT) vào thư mục gốc của repository, cạnh index.html.
2. Mở PowerShell trong thư mục nha-hang.
3. Chạy:

    powershell -ExecutionPolicy Bypass -File .\tools\run_blender_windows.ps1

Nếu file .blend của bạn nằm ở nơi khác:

    powershell -ExecutionPolicy Bypass -File .\tools\run_blender_windows.ps1 -SourceBlend "D:\Blender\VIETNAM_LIFE_3D_HANOI_WORLD.blend"

Nếu không tìm thấy Blender tự động, chỉ định đường dẫn tùy bản cài:

    powershell -ExecutionPolicy Bypass -File .\tools\run_blender_windows.ps1 -SourceBlend "D:\Blender\VIETNAM_LIFE_3D_HANOI_WORLD.blend" -BlenderExe "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe"

## Đầu ra do Blender tạo khi script chạy thành công

Thư mục HANOI_WORLD_V04_OUTPUT nằm cạnh file gốc sẽ chứa:

- VIETNAM_LIFE_3D_HANOI_WORLD_V04.blend — scene mới, không ghi đè bản gốc.
- glb/hanoi_original_streets.glb — đường phố gốc (nếu collection tồn tại và export được).
- glb/nhau_pho_viet.glb — nhà hàng/nội thất gốc.
- glb/vehicles_original.glb — phương tiện gốc.
- glb/npc_original.glb — nhân vật/armature gốc.
- glb/hanoi_expansion_v04.glb — khu phố mở rộng vừa tạo.
- HANOI_WORLD_BUILD_REPORT.json — số object, tam giác, rig, texture thiếu và kết quả xuất GLB.
- HANOI_WORLD_BUILD_SUMMARY.txt — báo cáo đọc nhanh, ghi FAIL nếu export hỏng.

Kết quả chỉ được tạo **sau khi chạy thật trên Blender**.

## Mở mẫu GLB ngay

Blender → File → Import → glTF 2.0 → chọn assets/models/hanoi-expansion-v04.glb.
Dùng nút giữa chuột xoay, lăn chuột zoom, phím Home để căn cảnh.

## Trạng thái thực tế

- Đã xác minh file GLB mới đăng trên GitHub có header glTF Binary 2.0 hợp lệ.
- File .blend người dùng gửi còn nguyên trên phiên làm việc và trong gói ZIP tải xuống được cung cấp ở ChatGPT. **Chưa upload bản gốc .blend lên repository**, do chưa chuyển được nhị phân đính kèm trực tiếp sang GitHub qua công cụ hiện có.
- Script Python và tệp xuất động từ Blender chưa được chạy/kiểm thử trên Blender thật vì môi trường hiện tại không có bpy/Blender.
- Chưa thể xác nhận ảnh render, animation, quy mô FPS, đường di chuyển NPC hay GLB xuất từ tệp gốc.
- Cảnh 3D mới không đồng nghĩa đã có hệ thống NPC AI, giao thông runtime, bản đồ Việt Nam 3D 1:1 hoặc toàn bộ game hoàn chỉnh.
- Thận trọng quyền sử dụng logo thương hiệu và audio ElevenLabs khi xuất bản repository công khai.

## Tích hợp game

Chỉ ghép các GLB sau khi kiểm tra thật trên Blender. Dùng Three.js GLTFLoader và có collision/navigation riêng, đồng bộ trạng thái nhân viên và khách từ src/simulation.mjs. Không merge PR #1/#2/#3 một cách mù quáng vì cùng sửa index.html.

## Kiểm thử mã (không chạy Blender)

    python -m py_compile tools/blender_finalize_hanoi.py
    python -m unittest discover -s tests -p "test_blender_pipeline.py" -v

## Các bước triển khai tiếp theo

1. Chạy script trên laptop Windows và đọc báo cáo TXT/JSON.
2. Sửa lỗi geometry/texture/rig/GLB xuất nếu có.
3. Kiểm tra preview, tỷ lệ nhân vật/xe máy/nội thất và quyết định các asset cần sửa.
4. Đưa GLB đã được nghiệm thu vào game qua PR riêng, không đụng main trước khi test.
