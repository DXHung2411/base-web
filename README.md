# Landing CMS: base project cho nhiều landing page

Một bộ khung dùng lại được để làm nhiều landing page (A, B, C...) mà không phải viết lại CMS. Nội dung, section, thứ tự, hình ảnh, menu, SEO, theme và trạng thái xuất bản đều quản lý trong trang quản trị. Website công khai được render ở server, gần như không tải JavaScript.

| Thành phần | Công nghệ |
|---|---|
| Backend | ASP.NET Core 8 Web API, EF Core, SQL Server, JWT, Swagger |
| Website + Admin | Astro (SSR, adapter Node), TypeScript, Tailwind CSS 4 |
| Admin UI | Preact, chỉ nạp ở `/admin` (website công khai không dùng framework JS) |

```
.
├── backend/
│   ├── src/CmsApi/            # Một project duy nhất: Controllers → Services → EF Core
│   │   ├── Controllers/       #   Admin/ (cần JWT)  ·  Public/ (không cần đăng nhập)
│   │   ├── Services/          #   nghiệp vụ (landing page, section, media, SEO, người dùng...)
│   │   ├── Storage/           #   IFileStorage + LocalFileStorage (thay được bằng S3/Azure/R2)
│   │   ├── Entities/ Data/    #   entity, DbContext, migration, seed (Data/Seed/demo.json)
│   │   └── Common/ Options/   #   response thống nhất, xử lý lỗi toàn cục, cấu hình
│   └── tests/CmsApi.Tests/    # xUnit: sắp xếp, upload, auth, preview token
├── frontend/
│   ├── src/pages/             # [...slug] (trang công khai), preview/, admin/, sitemap.xml, robots.txt
│   ├── src/components/        # Header, Footer, ui/, sections/<Tên>/<Tên>Section.astro
│   ├── src/lib/               # api, theme, sectionRegistry, settingDefs, ...
│   ├── src/admin/             # giao diện quản trị (Preact)
│   ├── src/layouts/ styles/ types/
│   └── public/
└── docker-compose.yml         # SQL Server + backend + frontend
```

## 1. Yêu cầu

- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)
- Node.js 22.12 trở lên
- SQL Server 2019+ (cách nhanh nhất là Docker, xem bên dưới). Docker cũng cần nếu muốn chạy bằng `docker compose`.
- Công cụ migration (chỉ khi bạn muốn tạo migration mới): `dotnet tool install --global dotnet-ef --version 8.*`

## 2. Chạy ở môi trường phát triển

### 2.1 Database

```bash
docker run -d --name landing-sql -e ACCEPT_EULA=Y \
  -e MSSQL_SA_PASSWORD='Your_strong_Passw0rd' -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
```

Chuỗi kết nối trong `backend/src/CmsApi/appsettings.Development.json` đã khớp với lệnh trên. Nếu dùng SQL Server có sẵn, sửa `ConnectionStrings:Default` ở đó (hoặc đặt biến môi trường `ConnectionStrings__Default`).

> Máy Apple Silicon: image SQL Server chạy qua giả lập x64. Có thể dùng Azure SQL Edge hoặc một SQL Server từ xa.

### 2.2 Backend

```bash
cd backend/src/CmsApi
dotnet run --urls http://localhost:5040
```

Ở môi trường Development, lần chạy đầu tiên tự động **áp dụng migration và seed**: tạo vai trò, tài khoản admin và một landing page demo hoàn chỉnh (12 section, menu, SEO, ảnh minh họa). Swagger: <http://localhost:5040/swagger>.

### 2.3 Frontend (website + admin)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- Website: <http://localhost:4321>
- Quản trị: <http://localhost:4321/admin>

### 2.4 Tài khoản mặc định (chỉ để phát triển)

| Tên đăng nhập | Mật khẩu |
|---|---|
| `admin` | `Admin@123456` |

Mật khẩu này nằm trong `appsettings.Development.json`, **chỉ dùng cho máy của bạn**. Ở production tài khoản admin chỉ được tạo khi bạn đặt `Seed__AdminPassword`; hãy đổi mật khẩu sau lần đăng nhập đầu tiên (Admin, mục Tài khoản). Mật khẩu được băm bằng PBKDF2 (`PasswordHasher` của ASP.NET), không bao giờ lưu dạng thường.

Vai trò: **Admin** có toàn quyền (kể cả Cài đặt chung và Người dùng); **Editor** chỉ sửa nội dung (landing page, section, menu, SEO, ảnh).

### 2.5 Thử nghiệm luồng chính

1. Đăng nhập tại `/admin`.
2. **Landing page → Trang chủ**: bạn thấy 12 section demo.
3. **Sửa** một section (ví dụ Hero), bấm **Lưu và xem trước** để xem trang thật trong khung xem trước (máy tính/điện thoại).
4. **Kéo thả** để đổi thứ tự (hoặc dùng nút ▲ ▼), bật/tắt hiển thị bằng công tắc.
5. **Xuất bản / Gỡ xuất bản**.
6. Mở <http://localhost:4321>: thay đổi hiển thị ngay (trang đang xuất bản được cache tối đa 60 giây ở CDN nếu có).

## 3. Migration và seed

```bash
cd backend
# Tạo migration mới sau khi sửa entity
dotnet ef migrations add TenMigration --project src/CmsApi -o Data/Migrations
# Áp dụng thủ công (không bắt buộc nếu bật tự động bên dưới)
dotnet ef database update --project src/CmsApi
```

| Cấu hình | Ý nghĩa |
|---|---|
| `Database:MigrateAndSeedOnStartup` | `true`: mỗi lần khởi động áp dụng migration và seed vai trò/admin. Mặc định `false`, bật ở Development và trong docker-compose. |
| `Seed:AdminUsername` / `Seed:AdminPassword` | Tài khoản admin được tạo khi chưa có người dùng nào. Để trống mật khẩu thì không tạo. |
| `Seed:DemoContent` | `true`: nạp trang demo từ `Data/Seed/demo.json` **chỉ khi DB chưa có landing page và cài đặt nào**. Đặt `false` cho site thật. |

Nội dung demo là dữ liệu mẫu (nhà hàng tiệc cưới hư cấu, ảnh minh họa vẽ bằng SVG). Hãy thay bằng nội dung và ảnh thật của bạn.

## 4. Cấu hình

Không có chuỗi kết nối, secret hay đường dẫn nào được viết cứng trong code. Thứ tự ưu tiên: biến môi trường > `appsettings.{Environment}.json` > `appsettings.json`. Với ASP.NET, dùng `__` thay cho `:` trong tên biến (`Jwt__Secret`).

### Backend

| Khóa | Mô tả | Mặc định |
|---|---|---|
| `ConnectionStrings:Default` | Chuỗi kết nối SQL Server | (bắt buộc) |
| `Jwt:Secret` | Khóa ký token, tối thiểu 32 ký tự. Thiếu hoặc quá ngắn thì **app không khởi động**. | (bắt buộc) |
| `Jwt:Issuer`, `Jwt:Audience`, `Jwt:ExpiryMinutes` | Cấu hình token | `CmsApi`, `CmsAdmin`, `480` |
| `Cors:AllowedOrigins` | Danh sách origin của website/admin, ví dụ `Cors__AllowedOrigins__0` | `[]` |
| `Storage:UploadPath` | Thư mục lưu ảnh (tương đối so với thư mục app, hoặc đường dẫn tuyệt đối) | `uploads` |
| `Storage:MaxFileSizeMb` | Dung lượng tối đa mỗi ảnh | `5` |
| `Swagger:Enabled` | Bật Swagger | `false` (bật ở Development) |

Tạo secret ngẫu nhiên: `openssl rand -base64 48`.

### Frontend

| Biến | Mô tả |
|---|---|
| `SITE_URL` | Địa chỉ công khai của website, dùng cho canonical, Open Graph, sitemap, robots |
| `API_URL` | Địa chỉ API mà **server** của website gọi (trong Docker: `http://backend:8080`) |
| `PUBLIC_API_URL` | Địa chỉ API mà **trình duyệt** truy cập (trang admin và ảnh upload) |

Các biến này đọc lúc chạy, nên cùng một bản build triển khai được cho nhiều môi trường.

## 5. Build production

```bash
# Backend
cd backend && dotnet publish src/CmsApi -c Release -o publish
# Frontend
cd frontend && npm ci && npm run build && node dist/server/entry.mjs   # lắng nghe HOST/PORT (mặc định 4321)
```

Kiểm tra mã nguồn: `cd frontend && npm run check` (type-check), `cd backend && dotnet test`.

## 6. Docker

```bash
cp .env.example .env     # điền SQL_SA_PASSWORD, JWT_SECRET, ADMIN_PASSWORD
docker compose up -d --build
```

- Website: <http://localhost:4321> · Admin: <http://localhost:4321/admin> · API: <http://localhost:5040>
- Dữ liệu SQL và ảnh upload nằm trong volume `sqldata` và `uploads`.
- Compose bắt buộc đặt `JWT_SECRET`, `ADMIN_PASSWORD` và `SQL_SA_PASSWORD`; không có giá trị mặc định nào được commit.
- Chạy phát triển bình thường không cần Docker (mục 2).

## 7. API

Tài liệu tương tác: `/swagger` (khi bật). Mọi phản hồi dùng một định dạng:

```jsonc
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "message": "Mô tả lỗi", "errors": { "Slug": ["..."] } }   // errors chỉ có khi lỗi validation
```

Mã trạng thái: `200`, `201` (tạo mới), `400` (dữ liệu sai), `401` (chưa đăng nhập/token hết hạn), `403` (không đủ quyền), `404`, `409` (trùng slug...), `429` (đăng nhập quá nhiều lần), `500` (không kèm stack trace ở production).

**Xác thực**

| Phương thức | Đường dẫn | Ghi chú |
|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` → `{ token, expiresAt, user }`. Giới hạn 10 lần/phút/IP |
| GET | `/api/auth/me` | Người dùng hiện tại |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` |

**Admin** (header `Authorization: Bearer <token>`)

| Nhóm | Đường dẫn |
|---|---|
| Landing page | `GET/POST /api/admin/landing-pages` · `GET/PUT/DELETE /api/admin/landing-pages/{id}` · `PATCH .../{id}/publish` · `POST .../{id}/preview-token` |
| Section | `GET/POST /api/admin/landing-pages/{id}/sections` · `PUT/DELETE /api/admin/sections/{id}` · `PUT /api/admin/sections/reorder` |
| Media | `GET/POST /api/admin/media` · `PUT/DELETE /api/admin/media/{id}` |
| Menu | `GET/POST /api/admin/menu` · `PUT/DELETE /api/admin/menu/{id}` · `PUT /api/admin/menu/reorder` |
| SEO | `GET/PUT /api/admin/seo/{landingPageId}` |
| Cài đặt | `GET /api/admin/settings` · `PUT /api/admin/settings` (nhiều khóa) · `PUT /api/admin/settings/{key}` (Admin) |
| Người dùng | `GET/POST /api/admin/users` · `PUT/DELETE /api/admin/users/{id}` (Admin) |

**Public** (không cần đăng nhập)

| Đường dẫn | Mô tả |
|---|---|
| `GET /api/public/landing-pages` | Danh sách trang đã xuất bản (cho sitemap) |
| `GET /api/public/landing-pages/{slug}` | Trang đã xuất bản cùng menu, SEO và các section đang hiển thị, đã sắp xếp |
| `GET /api/public/settings` | Cài đặt chung (thương hiệu, liên hệ, theme) |
| `GET /api/public/preview/{id}?token=` | Xem trước một trang chưa xuất bản. Token sống 10 phút, chỉ dùng cho đúng trang đó |

## 8. Kiến trúc section: thêm loại section mới

Frontend nhận `{ sectionType, title, subtitle, content, settings }` và tra `sectionType` trong một registry (`frontend/src/lib/sectionRegistry.ts`) để lấy component. Không có chuỗi `if/else` theo loại. Dữ liệu riêng của từng loại (danh sách mục, ảnh, nút...) nằm trong `settings` (cột JSON), nên thêm loại mới **không cần sửa database**.

Để thêm section `video`:

1. Tạo `frontend/src/components/sections/Video/VideoSection.astro` (nhận `id, title, subtitle, content, settings`).
2. Khai báo kiểu `settings` trong `frontend/src/types/sections.ts`.
3. Thêm form cho admin trong `frontend/src/admin/sections/sectionDefs.ts` (form được dựng tự động từ định nghĩa trường, gồm danh sách lồng nhau, ảnh, liên kết...).
4. Đăng ký ở `sectionRegistry.ts` và thêm `"video"` vào `SectionTypes.All` (`backend/src/CmsApi/Entities/LandingSection.cs`).

Mỗi section có trường **neo liên kết (anchor)** để menu trỏ tới (`#bang-gia`). Nếu để trống, anchor là tên loại section.

## 9. Theme, SEO, ảnh

- **Theme**: màu nhấn, màu phụ, màu nền, màu chữ, font, bo góc nằm trong **Cài đặt chung → Giao diện**. Website biến chúng thành CSS variables (`src/lib/theme.ts`); component chỉ dùng token (`bg-accent`, `text-ink`, `rounded-ui`...), không viết cứng màu. Danh sách và giá trị mặc định của mọi cài đặt ở `frontend/src/lib/settingDefs.ts`.
- **Font**: tự host (Newsreader + Be Vietnam Pro, chỉ subset Latin và tiếng Việt). Muốn đổi font, thêm `@font-face` trong `src/styles/site.css` rồi đặt tên font trong Cài đặt.
- **SEO**: title, description, canonical, Open Graph, Twitter Card, favicon, `sitemap.xml`, `robots.txt`, dữ liệu có cấu trúc (Organization, FAQPage), heading đúng thứ bậc. Nhớ chọn **ảnh Open Graph định dạng JPG/PNG** (mạng xã hội thường bỏ qua SVG).
- **Ảnh**: tải lên JPG, PNG, WEBP, SVG (kiểm tra phần mở rộng, MIME, dung lượng, chữ ký tệp; SVG chứa script bị từ chối). Ảnh `lazy` trừ ảnh đầu trang, luôn có `width/height`. Hệ thống **không tự đổi kích thước/định dạng**; hãy tải lên ảnh đã tối ưu (WebP, đúng kích thước) hoặc đặt CDN có tối ưu ảnh trước `/uploads`.
- **Đổi nơi lưu ảnh**: hiện lưu ở ổ đĩa (`/uploads/{năm}/{tháng}/...`). Để dùng S3, Azure Blob hoặc R2, viết một lớp implement `IFileStorage` (`SaveAsync`, `DeleteAsync`) và đăng ký thay `LocalFileStorage` trong `Program.cs`. `MediaService` và controller không phải sửa.
- **Biểu mẫu liên hệ**: website không có backend nhận form. Đặt "Địa chỉ nhận biểu mẫu" trong section Liên hệ (Formspree, Google Apps Script, API của bạn...). Dữ liệu demo dùng `mailto:`; hãy thay.

## 10. Triển khai

- Chạy backend, website và SQL Server sau một reverse proxy HTTPS (Nginx, Caddy, Traefik...). Website nên cùng domain với admin; API có thể ở subdomain, nhớ khai báo `Cors__AllowedOrigins__0`.
- Đặt `ASPNETCORE_ENVIRONMENT=Production`, `Jwt__Secret`, `ConnectionStrings__Default`, `SITE_URL`, `API_URL`, `PUBLIC_API_URL`.
- Mount volume bền vững cho thư mục upload (hoặc chuyển sang object storage) và sao lưu SQL Server.
- Bật `Database__MigrateAndSeedOnStartup=true` cho lần chạy đầu, hoặc áp migration bằng `dotnet ef database update` / script (`dotnet ef migrations script --idempotent`).
- Nếu API đứng sau reverse proxy, cấu hình Forwarded Headers để giới hạn đăng nhập theo IP thật của người dùng.
- Website tự nén HTML (brotli/gzip) và gửi `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300`; thêm CDN phía trước để đạt tốc độ tốt nhất.

## 11. Bảo mật: những gì đã làm và giới hạn

- JWT ký HS256, secret từ cấu hình, thời hạn cấu hình được; admin tự đăng xuất khi token hết hạn hoặc nhận 401.
- Token được lưu trong `localStorage` của trình duyệt (đơn giản, không cần cookie/CSRF). Đổi lại, một lỗ hổng XSS trong trang admin có thể đọc được token; phần HTML tùy chỉnh do admin nhập được render nguyên văn, nên chỉ cấp quyền cho người tin cậy.
- Truy vấn dùng EF Core (tham số hóa), dữ liệu vào được validate, upload kiểm tra nhiều lớp, file tĩnh gửi `nosniff` và CSP chặn script trong SVG.
- Phản hồi lỗi không chứa stack trace ở production; lỗi được log ở server.
- Không có secret nào trong repository: các giá trị trong `appsettings.Development.json` chỉ dành cho máy phát triển.

## 12. Nguyên tắc thiết kế giao diện mẫu

Landing demo không dùng gradient, kính mờ, glow hay lưới thẻ giống nhau. Mỗi section có bố cục riêng theo nội dung (hero lệch, danh sách đánh số, dải ảnh, bảng giá dạng hàng, mosaic ảnh...), 2 font, một màu nhấn, bo góc có thứ bậc, và chỉ một hiệu ứng vào trang (hero), tôn trọng `prefers-reduced-motion`. Mobile được bố trí lại thứ tự thay vì thu nhỏ desktop. Khi thêm section mới hãy giữ các nguyên tắc này: ít trang trí hơn, mỗi thứ xuất hiện đều có lý do.
