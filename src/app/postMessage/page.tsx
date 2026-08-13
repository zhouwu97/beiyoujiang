'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLATES, Plate } from '@/lib/types';
import { addPost } from '@/lib/api';
import { getUserId } from '@/stores/auth';
import { useCustomAlert } from '@/components/common/CustomAlert';
import { useRewardToast } from '@/components/common/RewardToast';
import LoginTipModal from '@/components/common/LoginTipModal';
import { resolveImage } from '@/lib/utils';

/** 表情包（官方 /images/meme/ 目录） */
const EMOJIS = [
  'face002.jpg', 'face003.jpg', 'face009.jpg', 'face016.jpg', 'face017.jpg',
  'face020.jpg', 'face027.jpg', 'face028.jpg', 'face030.jpg', 'face032.jpg',
  'face043.jpg', 'face046.gif', 'face050.gif', 'face051.jpg', 'face056.jpg',
  'face059.jpg', 'face064.jpg', 'face068.gif', 'face070.gif', 'face071.jpg',
  'face073.jpg', 'face074.gif', 'face075.jpg', 'face076.jpg', 'face077.gif',
  'face084.jpg', 'face085.jpg', 'face089.jpg', 'face091.gif', 'face095.gif',
];

/**
 * 发帖页：标题 + 富文本正文（表情插入）+ 图片上传 + 板块选择
 */
export default function PostMessagePage() {
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const { show: showReward } = useRewardToast();

  const [title, setTitle] = useState('');
  const [plate, setPlate] = useState<Plate>(Plate.CupForum);
  /** 预览图：blob URL 在选中文件时生成一次，删除/卸载时 revoke，避免内存泄漏 */
  const [images, setImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLoginTip, setShowLoginTip] = useState(false);
  const [publishing, setPublishing] = useState(false);
  /** 是否有未发布内容（标题/正文/图片任一已填写），用于离开确认 */
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const previewUrlsRef = useRef<string[]>([]);

  const me = getUserId();

  // 未发布内容离开确认：取消按钮走 confirm，浏览器关闭/刷新走 beforeunload
  const handleCancel = () => {
    if (dirty && !window.confirm('内容尚未发布，确定离开？')) return;
    router.back();
  };

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty && !publishing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, publishing]);

  // 卸载时释放所有 blob URL
  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  /** 保存光标位置 */
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) selectionRef.current = sel.getRangeAt(0);
  };

  /** 插入表情到光标处 */
  const insertEmoji = (src: string) => {
    setShowEmoji(false);
    const editor = editorRef.current;
    if (!editor) return;
    saveSelection();
    const img = document.createElement('img');
    img.src = resolveImage(`/images/meme/${src}`);
    img.style.cssText = 'width:25px;height:25px;display:inline-block;vertical-align:middle;object-fit:cover;';
    const range = selectionRef.current ?? document.createRange();
    range.collapse(false);
    range.insertNode(img);
    range.setStartAfter(img);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    editor.focus();
    setDirty(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const room = 9 - images.length;
    const picked = files.slice(0, room);
    const previews = picked.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      return { file, previewUrl };
    });
    setImages((prev) => [...prev, ...previews]);
    setDirty(true);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const target = images[index];
    if (target) {
      previewUrlsRef.current = previewUrlsRef.current.filter((u) => u !== target.previewUrl);
      URL.revokeObjectURL(target.previewUrl);
    }
    setImages((prev) => prev.filter((_, j) => j !== index));
    setDirty(true);
  };

  const publish = async () => {
    if (!me) {
      setShowLoginTip(true);
      return;
    }
    const content = editorRef.current?.innerHTML ?? '';
    if (!title.trim()) {
      showAlert('标题不能为空哦');
      return;
    }
    if (!content.trim() || content === '<br>') {
      showAlert('内容不能为空哦，写点东西吧喵~');
      return;
    }
    if (publishing) return;
    setPublishing(true);

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('content', content);
      fd.append('plate', String(plate));
      fd.append('authorId', String(me));
      images.forEach((img) => fd.append('images', img.file));

      const res = await addPost(fd);
      setDirty(false);
      if (res.reward && res.reward > 0) {
        showReward('发布成功');
      } else {
        showAlert('发布成功');
      }
      setTimeout(() => router.push('/'), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发布失败';
      showAlert(msg.includes('403') ? '发布频率过高，请稍后再试' : '发布失败，请重试');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex h-14 w-full max-w-[920px] items-center px-4 sm:px-6 lg:h-[72px] lg:px-0">
          <button
            onClick={handleCancel}
            className="text-[14px] text-[var(--muted)] px-1"
            disabled={publishing}
          >
            取消
          </button>
          <h1 className="flex-1 text-center text-[16px] font-semibold text-[var(--ink)]">
            发布帖子
          </h1>
          <button
            onClick={publish}
            disabled={publishing}
            className="interactive-press rounded-full bg-[var(--accent)] px-5 py-1.5 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? '发布中' : '发布'}
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[920px] lg:my-6 lg:rounded-[18px] lg:border lg:border-[var(--line)] lg:bg-white lg:px-5 lg:py-2 lg:shadow-[0_10px_30px_rgba(27,27,38,0.035)]">
      {/* 标题 */}
      <div className="px-4 pt-4 lg:px-3">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          placeholder="标题（必填）"
          aria-label="帖子标题"
          className="w-full text-[16px] font-medium text-[var(--ink)] outline-none placeholder:text-[var(--muted)] pb-3 border-b border-[var(--line)]"
        />
      </div>

      {/* 正文 */}
      <div className="px-4 py-3 lg:px-3">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onInput={() => setDirty(true)}
          role="textbox"
          aria-label="帖子正文"
          aria-multiline="true"
          className="min-h-[200px] text-[15px] text-[var(--ink)] leading-[1.8] outline-none [&_img]:inline-block [&_img]:align-middle"
          data-placeholder="分享你的体验吧~"
        />
      </div>

      {/* 图片上传 */}
      <div className="px-4 lg:px-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileChange}
        />
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={img.previewUrl}
                alt=""
                className="w-full h-24 rounded-[12px] object-cover bg-[var(--background)]"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[12px] leading-5"
                aria-label="删除图片"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 9 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-24 rounded-[12px] bg-[var(--background)] flex flex-col items-center justify-center gap-1 text-[var(--muted)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-[11px]">添加图片</span>
            </button>
          )}
        </div>
      </div>

      {/* 板块选择 */}
      <div className="mt-4 px-4 lg:px-3">
        <p className="text-[12px] text-[var(--muted)] mb-2">选择板块</p>
        <div className="flex gap-2">
          {PLATES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlate(p.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                plate === p.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--background)] text-[var(--muted)]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 表情按钮 */}
      <button
        onClick={() => setShowEmoji((v) => !v)}
        className="interactive-press mx-4 mb-3 mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--background)] text-[18px]"
        aria-label="表情"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#777780" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.5 14.5c.9 1 2.1 1.5 3.5 1.5s2.6-.5 3.5-1.5" />
          <path d="M9 9.5h.01M15 9.5h.01" />
        </svg>
      </button>

      {/* 表情选择器 */}
      {showEmoji && (
        <div className="mx-4 mb-4 rounded-[16px] bg-[var(--background)] p-3">
          <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => insertEmoji(e)}
                className="flex items-center justify-center active:scale-110 transition-transform"
              >
                <img
                  src={resolveImage(`/images/meme/${e}`)}
                  alt=""
                  className="w-7 h-7 object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      </div>

      <LoginTipModal open={showLoginTip} onClose={() => setShowLoginTip(false)} />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
