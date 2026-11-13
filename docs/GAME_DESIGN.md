# GAME DESIGN DOCUMENT — VIETNAM LIFE 3D

**Tầm nhìn:** Game thế giới mở mô phỏng đời sống Việt Nam, trong đó người chơi sống tại Hà Nội và trực tiếp điều hành một quán nhậu/nhà hàng. Thành phố vận hành không phụ thuộc hoàn toàn vào người chơi, có người dân và giao thông.

**Nguyên tắc cốt lõi:** "Không có dân là không có thành phố". NPC phải có mục đích tồn tại, hoạt động và lịch trình; không biến thành những mô hình đứng yên.

## 1. Vòng lặp người chơi

- Ở nhà → đi đến quán → mở quán → nhập hàng → phân công nhân viên → đón khách → xử lý món/phàn nàn/đặt bàn → thanh toán → chốt doanh thu → cải tạo/quảng cáo/mở rộng → nghỉ ngơi.
- Mục tiêu kinh tế: dòng tiền, lương, thuê mặt bằng, hàng tồn, bảo trì, giá thực đơn, danh tiếng, lượng khách, đánh giá.
- Mục tiêu sống: danh tiếng khu phố, người quen, lịch sinh hoạt, giao tiếp, đi lại, quan sát và tương tác với người dân.
- Mục tiêu mở rộng: từ một quán → nhiều cơ sở Hà Nội → các thành phố Việt Nam.

## 2. Không gian

- **V0.1:** Khu phố hư cấu lấy cảm hứng từ Hà Nội, 1 nhà hàng có thể hoạt động; map 2D Việt Nam thật để định vị.
- **MVP V0.3:** Chọn khu vực Hà Nội có dữ liệu GIS rõ nguồn; làm một số tuyến đường 3D sát thực địa hơn. Đo bản đồ bằng WGS84 → chuyển hệ tọa độ địa phương; tổ chức streaming dạng ô (chunk).
- **Sau MVP:** Quận mới, rồi các thành phố mới (Hải Phòng, Đà Nẵng, Huế, TP.HCM, Cần Thơ...), ưu tiên một số khu vực chơi được hơn là toàn bộ đất nước chỉ có mesh trắng.
- **Mục tiêu dài hạn:** Việt Nam đúng đại thể địa lý, đường sá và địa hình từ nguồn được phép sử dụng, mở rộng nội dung ở từng đô thị. Độ chính xác tòa nhà theo từng địa chỉ còn phụ thuộc dữ liệu và công sức dựng mô hình.

## 3. NPC và hệ sinh thái

### Dân cư

- Thuộc tính: `id`, `name`, `ageGroup`, `job`, `home`, `workplace`, `budget`, `needs`, `mood`, `relationships`, `schedule`, `shortTermMemory`.
- Lịch điển hình: ngủ → ăn sáng → đi học/đi làm → mua sắm → ăn uống → về nhà; biến thể thứ bảy/chủ nhật, mưa và sự kiện.
- Các vai trò: học sinh, sinh viên, tài xế công nghệ, người bán hàng, nhân viên văn phòng, khách du lịch, thợ sửa xe, nhân viên bếp, khách quen...
- NPC chỉ nhận **nhu cầu và vai trò**, không thiết kế định kiến từ dữ liệu cá nhân người thật.
- Hệ thống tương tác: FSM/utility AI/behavior tree cho 95% hoạt động; LLM tùy chọn chỉ khi thật sự cần hội thoại dài.

### Hiệu năng

- NPC gần camera: mô hình & animation đầy đủ, vật lý nhẹ.
- NPC vừa: animation đơn giản, quyết định theo nhịp thưa hơn.
- NPC xa: hiển thị theo cụm/instancing hoặc mô phỏng thống kê.
- Quản lý mật độ giao thông theo từng ô không gian, không tải toàn bộ dân số Việt Nam cùng lúc.

## 4. Quán nhậu/nhà hàng

- Nhân sự: đầu bếp, phục vụ, thu ngân, quản lý ca, bảo vệ, kho.
- Kinh doanh: công thức, nguyên liệu, đặt bàn, xếp bàn, chế biến, vệ sinh, tồn kho, đầu vào/đầu ra, doanh thu/lợi nhuận/tiền mặt.
- AI nhiệm vụ: người phục vụ nhận order; đầu bếp chế biến; khách đặt món dựa trên ngân sách và khẩu vị; quản lý đặt hàng khi kho xuống thấp.
- Có thể lấy cảm hứng không khí từ chuỗi *Quán Nhậu Tự Do*; không sử dụng tên/logo/tư liệu độc quyền cho bản phát hành khi chưa được phép.

## 5. Thời gian và sự kiện Việt Nam

- 24 giờ, mùa, mưa nắng, nhịp giờ cao điểm; không cần kết nối thời tiết thực.
- Tết Nguyên Đán, rằm Trung thu, ngày tựu trường, bóng đá, lễ hội địa phương làm tăng/giảm lưu lượng dân.
- Hệ thống âm thanh: xe máy, rao hàng, bếp nấu, tiếng bát đũa, trò chuyện (ưu tiên âm thanh đã được cấp quyền).
- Không mô phỏng việc lái xe sau khi uống rượu như hành vi được khuyến khích; nếu có cơ chế giao thông cần tuân thủ an toàn và phản ánh hậu quả.

## 6. Kiến trúc đề xuất khi mở rộng

- **Hiện tại:** Three.js browser prototype để kiểm chứng cảm giác sống động và vòng lặp kinh doanh.
- **Game client tiếp theo:** TypeScript + React/React Three Fiber hoặc tách sang Godot 4 khi mục tiêu PC-first và di chuyển 3D phức tạp; đánh giá benchmark trước khi quyết định, tránh viết lại theo trào lưu.
- **World module:** Geographic coordinates, MapLibre/OSM viewer, projection, chunk loader, LOD, procedural buildings.
- **Simulation module:** Time, weather, needs, NPC schedule, shops, traffic routes, economy.
- **Persistence:** V0.1 localStorage; các bản sau IndexedDB rồi SQLite/server nếu cần đa thiết bị. Chỉ triển khai Supabase sau khi rõ yêu cầu cloud và chi phí.
- **Asset pipeline:** Blender + Tripo AI (nếu điều khoản sử dụng phù hợp); GLB/glTF, LOD, texture atlas, kiểm tra polygon count và bản quyền.
- **AI dialogue:** hội thoại template/FSM trước; về sau có thể chọn model local trên laptop đủ cấu hình (Ollama) hoặc model cloud do người dùng cho phép. Không hardcode secret trên client.

## 7. Phối hợp các AI, không trùng trách nhiệm

| Vai trò | Công cụ đề xuất | Bàn giao |
|---|---|---|
| Chủ thiết kế / Product Owner | Người dùng | Tầm nhìn, duyệt mốc, trải nghiệm mong muốn |
| GDD, kiến trúc, lập kế hoạch/QA | ChatGPT | GDD, issue, acceptance criteria, phản biện game loop |
| Code chính, tích hợp, test | Claude Code | Branch tính năng, commit, PR, build và test |
| Prototype 3D/ý tưởng phụ, review code | Gemini | Khung cảnh, asset spec, code review độc lập |
| Tạo mô hình từ hình ảnh | Tripo AI | GLB/FBX đã tối ưu và giấy phép hợp lệ |
| Voice/sound tùy chọn | ElevenLabs hoặc nguồn âm thanh hợp pháp | Tệp âm thanh được cấp quyền, không bắt buộc API runtime |

Quy ước: Mọi AI cùng làm một repository; task được gán rõ; branch riêng và PR review; không để 3 AI đồng thời thay file trên cùng branch; không giao token/secret vào prompt công khai.

## 8. Roadmap thực chất

| Bản | Điều kiện hoàn thành (definition of done) |
|---|---|
| **0.1** | Có cảnh chơi thử, NPC, xe máy, thời gian, vòng lặp bán hàng, lưu local |
| **0.2** | Đi xuyên quán không xuyên tường, camera tốt, khu nhà bếp/bàn ghế, 4 vai trò NPC, tối thiểu 5 loại hành vi quan sát được |
| **0.3** | Nhập đường phố 1 khu vực Hà Nội từ nguồn geodata có ghi công, kiểm tra 10 vị trí khớp dữ liệu, streaming chunk |
| **0.4** | Công thức món, từng công đoạn, thu-chi-đặt hàng-lương/thuê đúng logic; báo cáo cuối ngày có thể test |
| **0.5** | Bản đồ Việt Nam, chọn thành phố và di chuyển giữa các instance; có ít nhất 2 nơi 3D khác nhau |
| **0.6** | Lịch sống NPC, quan hệ, xe chạy tuyến theo đường; tối ưu FPS trên laptop mục tiêu |
| **1.0** | Single-player có thể chơi, save/load tin cậy, onboarding, test trên cấu hình mục tiêu, gỡ lỗi và giải quyết bản quyền |

## 9. Rủi ro cần kiểm soát

- Không thể sinh toàn bộ Việt Nam 3D chi tiết như ngoài đời bằng một prompt.
- Dữ liệu OSM có giới hạn độ đầy đủ, phải tuân thủ ODbL và tile usage policy; không sao chép ảnh/mesh từ Google Maps/Street View nếu không có quyền.
- Biểu trưng Quán Nhậu Tự Do thuộc một chủ thể thật; cần xin quyền để dùng chính thức.
- AI tạo 3D cần cleanup UV/rigging/collision/LOD, không thể đưa thẳng vào game lớn mà không kiểm tra.
- Không được tự triển khai công khai, đăng ký dịch vụ tính phí, hoặc dùng API trả tiền khi chưa được người dùng chấp thuận.

## 10. Checklist QA v0.1

- [x] Cú pháp JavaScript đã qua `node --check`.
- [x] 5 unit tests logic kinh tế đã qua `node --test`.
- [ ] Chạy kiểm thử tương tác đầy đủ với WebGL trong Chrome Windows.
- [ ] Chạy trên Safari iPhone.
- [ ] Đo FPS và bộ nhớ trong ít nhất 10 phút.
- [ ] Kiểm tra reconnect/tắt mạng khi tải CDN.
- [ ] Kiểm tra save/load trên từng trình duyệt mục tiêu.
