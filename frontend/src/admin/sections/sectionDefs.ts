import type { SectionType } from '../../types/sections';

export type Field =
  | { kind: 'text'; key: string; label: string; hint?: string; placeholder?: string }
  | { kind: 'textarea'; key: string; label: string; hint?: string; rows?: number }
  | { kind: 'image'; key: string; label: string }
  | { kind: 'imageList'; key: string; label: string }
  | { kind: 'link'; key: string; label: string }
  | { kind: 'boolean'; key: string; label: string }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'stringList'; key: string; label: string; addLabel: string }
  | { kind: 'list'; key: string; label: string; itemTitleKey: string; addLabel: string; fields: Field[] };

export interface SectionDef {
  type: SectionType;
  label: string;
  description: string;
  /** Labels of the common fields. A missing label hides the field for this section type. */
  title?: string;
  subtitle?: string;
  content?: string;
  settings: Field[];
  defaults: { title?: string; subtitle?: string; content?: string; settings: Record<string, unknown> };
}

const imageFields = (): Field[] => [{ kind: 'image', key: 'image', label: 'Ảnh' }];

export const sectionDefs: SectionDef[] = [
  {
    type: 'hero',
    label: 'Đầu trang (Hero)',
    description: 'Tiêu đề chính, ảnh lớn và các thông tin nhanh. Mỗi trang nên có một.',
    title: 'Tiêu đề chính',
    subtitle: 'Dòng mô tả',
    content: 'Đoạn giới thiệu (tùy chọn)',
    settings: [
      { kind: 'text', key: 'eyebrow', label: 'Dòng nhỏ phía trên tiêu đề' },
      ...imageFields(),
      { kind: 'link', key: 'primaryCta', label: 'Nút chính' },
      { kind: 'link', key: 'secondaryCta', label: 'Nút phụ' },
      {
        kind: 'list', key: 'facts', label: 'Thông tin nhanh', itemTitleKey: 'label', addLabel: 'Thêm thông tin',
        fields: [
          { kind: 'text', key: 'label', label: 'Nhãn' },
          { kind: 'text', key: 'value', label: 'Giá trị' },
        ],
      },
    ],
    defaults: { title: 'Tiêu đề trang', settings: {} },
  },
  {
    type: 'about',
    label: 'Giới thiệu',
    description: 'Đoạn văn dài kèm trích dẫn nổi bật và một ảnh.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    content: 'Nội dung (cách đoạn bằng một dòng trống)',
    settings: [
      { kind: 'textarea', key: 'quote', label: 'Trích dẫn nổi bật', rows: 3 },
      { kind: 'text', key: 'quoteAuthor', label: 'Người trích dẫn' },
      ...imageFields(),
      { kind: 'stringList', key: 'highlights', label: 'Điểm nhấn', addLabel: 'Thêm điểm nhấn' },
    ],
    defaults: { title: 'Giới thiệu', settings: {} },
  },
  {
    type: 'features',
    label: 'Điểm khác biệt',
    description: 'Danh sách đánh số gồm tiêu đề và mô tả ngắn, không dùng thẻ.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      {
        kind: 'list', key: 'items', label: 'Danh sách', itemTitleKey: 'title', addLabel: 'Thêm mục',
        fields: [
          { kind: 'text', key: 'title', label: 'Tiêu đề' },
          { kind: 'textarea', key: 'description', label: 'Mô tả', rows: 3 },
        ],
      },
    ],
    defaults: { title: 'Điểm khác biệt', settings: { items: [] } },
  },
  {
    type: 'services',
    label: 'Dịch vụ / Không gian',
    description: 'Dải ảnh ngang kèm tên và mô tả, cuộn ngang trên điện thoại.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      {
        kind: 'list', key: 'items', label: 'Danh sách', itemTitleKey: 'title', addLabel: 'Thêm mục',
        fields: [
          { kind: 'text', key: 'title', label: 'Tên' },
          { kind: 'textarea', key: 'description', label: 'Mô tả', rows: 2 },
          ...imageFields(),
          { kind: 'text', key: 'href', label: 'Liên kết (tùy chọn)' },
        ],
      },
    ],
    defaults: { title: 'Dịch vụ', settings: { items: [] } },
  },
  {
    type: 'products',
    label: 'Sản phẩm / Thực đơn',
    description: 'Danh sách sản phẩm có ảnh, tên, giá và mô tả.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      {
        kind: 'list', key: 'items', label: 'Danh sách', itemTitleKey: 'name', addLabel: 'Thêm sản phẩm',
        fields: [
          { kind: 'text', key: 'name', label: 'Tên' },
          { kind: 'text', key: 'price', label: 'Giá' },
          { kind: 'textarea', key: 'description', label: 'Mô tả', rows: 3 },
          ...imageFields(),
        ],
      },
    ],
    defaults: { title: 'Sản phẩm', settings: { items: [] } },
  },
  {
    type: 'stats',
    label: 'Con số',
    description: 'Một hàng số liệu lớn trên nền tối.',
    title: 'Tiêu đề (tùy chọn)',
    settings: [
      {
        kind: 'list', key: 'items', label: 'Số liệu', itemTitleKey: 'label', addLabel: 'Thêm số liệu',
        fields: [
          { kind: 'text', key: 'value', label: 'Giá trị', placeholder: '1.200' },
          { kind: 'text', key: 'label', label: 'Nhãn' },
        ],
      },
    ],
    defaults: { settings: { items: [] } },
  },
  {
    type: 'pricing',
    label: 'Bảng giá',
    description: 'Các gói giá dạng bảng so sánh.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      { kind: 'text', key: 'note', label: 'Ghi chú dưới bảng giá' },
      {
        kind: 'list', key: 'plans', label: 'Các gói', itemTitleKey: 'name', addLabel: 'Thêm gói',
        fields: [
          { kind: 'text', key: 'name', label: 'Tên gói' },
          { kind: 'text', key: 'price', label: 'Giá', placeholder: '6.900.000đ' },
          { kind: 'text', key: 'unit', label: 'Đơn vị', placeholder: '/ bàn' },
          { kind: 'text', key: 'description', label: 'Mô tả ngắn' },
          { kind: 'stringList', key: 'features', label: 'Bao gồm', addLabel: 'Thêm dòng' },
          { kind: 'boolean', key: 'highlighted', label: 'Làm nổi bật gói này' },
          { kind: 'link', key: 'cta', label: 'Nút' },
        ],
      },
    ],
    defaults: { title: 'Bảng giá', settings: { plans: [] } },
  },
  {
    type: 'testimonials',
    label: 'Khách hàng nói về chúng tôi',
    description: 'Trích dẫn đầu tiên được làm nổi bật, các trích dẫn sau nhỏ hơn.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      {
        kind: 'list', key: 'items', label: 'Trích dẫn', itemTitleKey: 'name', addLabel: 'Thêm trích dẫn',
        fields: [
          { kind: 'textarea', key: 'quote', label: 'Nội dung', rows: 4 },
          { kind: 'text', key: 'name', label: 'Tên' },
          { kind: 'text', key: 'detail', label: 'Chi tiết', placeholder: 'Tiệc cưới tháng 3/2026' },
        ],
      },
    ],
    defaults: { title: 'Khách hàng nói về chúng tôi', settings: { items: [] } },
  },
  {
    type: 'faq',
    label: 'Câu hỏi thường gặp',
    description: 'Danh sách hỏi đáp, bấm để mở rộng.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      {
        kind: 'list', key: 'items', label: 'Câu hỏi', itemTitleKey: 'question', addLabel: 'Thêm câu hỏi',
        fields: [
          { kind: 'text', key: 'question', label: 'Câu hỏi' },
          { kind: 'textarea', key: 'answer', label: 'Trả lời', rows: 4 },
        ],
      },
    ],
    defaults: { title: 'Câu hỏi thường gặp', settings: { items: [] } },
  },
  {
    type: 'gallery',
    label: 'Thư viện ảnh',
    description: 'Lưới ảnh bất đối xứng. Ảnh đầu tiên được hiển thị lớn nhất.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      { kind: 'imageList', key: 'images', label: 'Ảnh' },
    ],
    defaults: { title: 'Hình ảnh', settings: { images: [] } },
  },
  {
    type: 'cta',
    label: 'Kêu gọi hành động',
    description: 'Dải tối chỉ có chữ và nút.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      { kind: 'link', key: 'primaryCta', label: 'Nút chính' },
      { kind: 'link', key: 'secondaryCta', label: 'Nút phụ' },
      { kind: 'text', key: 'note', label: 'Ghi chú nhỏ' },
    ],
    defaults: { title: 'Tiêu đề', settings: {} },
  },
  {
    type: 'contact',
    label: 'Liên hệ',
    description: 'Thông tin liên hệ (lấy từ Cài đặt chung) và biểu mẫu.',
    title: 'Tiêu đề',
    subtitle: 'Dòng mô tả',
    settings: [
      {
        kind: 'text', key: 'formAction', label: 'Địa chỉ nhận biểu mẫu',
        hint: 'URL nhận dữ liệu form (ví dụ Formspree). Để trống nếu chỉ muốn hiển thị thông tin liên hệ.',
      },
      { kind: 'text', key: 'submitLabel', label: 'Nhãn nút gửi', placeholder: 'Gửi thông tin' },
    ],
    defaults: { title: 'Liên hệ', settings: {} },
  },
  {
    type: 'custom',
    label: 'Tùy chỉnh (HTML)',
    description: 'Khối nội dung tự do. Nội dung được hiển thị dưới dạng HTML.',
    title: 'Tiêu đề (tùy chọn)',
    subtitle: 'Dòng mô tả (tùy chọn)',
    content: 'Nội dung HTML',
    settings: [
      {
        kind: 'select', key: 'width', label: 'Độ rộng',
        options: [{ value: 'narrow', label: 'Hẹp (đọc văn bản)' }, { value: 'wide', label: 'Rộng' }],
      },
    ],
    defaults: { settings: { width: 'narrow' } },
  },
];

export const sectionDefByType = (type: string) => sectionDefs.find((def) => def.type === type);
