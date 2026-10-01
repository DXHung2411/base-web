import { useEffect, useState } from 'preact/hooks';
import { api } from '../api';
import { errorMessage } from '../hooks';
import { Button, Spinner } from './controls';
import { Modal } from './dialog';
import { useToast } from './toast';

interface PreviewModalProps {
  pageId: number;
  /** Section anchor to scroll to. */
  anchor?: string;
  onClose: () => void;
}

/** Shows the website itself in an iframe, so the preview is always what visitors will see. */
export function PreviewModal({ pageId, anchor, onClose }: PreviewModalProps) {
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setToken(null);
    api.pages.previewToken(pageId).then((result) => setToken(result.token)).catch((error) => toast.error(errorMessage(error)));
  }, [pageId, version, toast]);

  return (
    <Modal title="Xem trước" onClose={onClose} size="max-w-6xl">
      <div class="mb-3 flex items-center gap-2">
        <Button variant={mobile ? 'secondary' : 'primary'} small onClick={() => setMobile(false)}>Máy tính</Button>
        <Button variant={mobile ? 'primary' : 'secondary'} small onClick={() => setMobile(true)}>Điện thoại</Button>
        <Button variant="ghost" small onClick={() => setVersion(version + 1)}>Làm mới</Button>
        <span class="ml-auto text-xs text-stone-500">Bản xem trước hiển thị cả trang chưa xuất bản.</span>
      </div>
      <div class="flex h-[70vh] justify-center rounded-md border border-stone-300 bg-stone-100">
        {token ? (
          <iframe
            title="Xem trước landing page"
            src={`/preview/${pageId}?token=${encodeURIComponent(token)}${anchor ? `#${anchor}` : ''}`}
            class={`h-full bg-white ${mobile ? 'w-[390px] border-x border-stone-300' : 'w-full'}`}
          />
        ) : (
          <div class="flex items-center text-stone-500"><Spinner size={24} /></div>
        )}
      </div>
    </Modal>
  );
}
