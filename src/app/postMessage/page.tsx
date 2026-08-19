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
 * 发帖页：
 * PC >= 1024 采用左侧主编辑器（标题、工具栏、420px+ 高度正文）+ 右侧发布配置栏（板块、图片、发帖须知）；
 * 消除 max-w-[920px] 狭窄限制，接入全站统一响应式宽度；
 * 严格修复 contentEditable 表情插入光标丢失与错位问题。
 */
export default function PostMessagePage() {
  const router = useRouter();
  const { show: showAlert } = useCustomAlert();
  const { show: showReward } = useRewardToast();

  const [title, setTitle] = useState('');
  const [plate, setPlate] = useState<Plate>(Plate.CupForum);
  const [images, setImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLoginTip, setShowLoginTip] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const me = getUserId();

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

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // 点击外部关闭表情面板
  useEffect(() => {
    if (!showEmoji) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showEmoji]);

  /** 检查当前 Selection 是否位于编辑器内 */
  const isSelectionInsideEditor = (sel: Selection | null): boolean => {
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return false;
    const range = sel.getRangeAt(0);
    return editorRef.current.contains(range.commonAncestorContainer);
  };

  /** 保存光标位置（仅当选区合法且在编辑器内） */
  const saveSelection = () => {
    const sel = window.getSelection();
    if (isSelectionInsideEditor(sel)) {
      selectionRef.current = sel!.getRangeAt(0).cloneRange();
    }
  };

  const handleToggleEmoji = () => {
    saveSelection();
    setShowEmoji((v) => !v);
  };

  /** 插入表情到光标处 */
  const insertEmoji = (src: string) => {
    setShowEmoji(false);
    const editor = editorRef.current;
    if (!editor) return;

    let range = selectionRef.current;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    const img = document.createElement('img');
    img.src = resolveImage(`/images/meme/${src}`);
    img.style.cssText =
      'width:25px;height:25px;display:inline-block;vertical-align:middle;object-fit:cover;margin:0 2px;';

    range.deleteContents();
    range.insertNode(img);
    range.setStartAfter(img);
    range.collapse(true);

    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    selectionRef.current = range.cloneRange();
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
    <div className="page-shell min-h-screen">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur-md">
        <div className="shell-width flex h-14 items-center justify-between lg:h-16">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1 text-[13.5px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            disabled={publishing}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>取消</span>
          </button>

          <h1 className="text-[16px] font-bold text-[var(--ink)]">发布新帖</h1>

          <button
            type="button"
            onClick={publish}
            disabled={publishing}
            className="interactive-press rounded-full bg-[var(--accent)] px-5 py-1.5 text-[13.5px] font-bold text-white shadow-[0_4px_12px_rgba(var(--accent-rgb),0.2)] transition-all hover:bg-[var(--accent-strong)] hover:shadow-[0_6px_16px_rgba(var(--accent-rgb),0.28)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? '发布中...' : '发布'}
          </button>
        </div>
      </header>

      {/* 主体两列布局 */}
      <main className="shell-width py-5 lg:py-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
          {/* 左侧：编辑器卡片 */}
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7">
            {/* 标题 */}
            <div className="border-b border-[var(--line)] pb-4">
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
                placeholder="给帖子起个吸引人的标题吧..."
                aria-label="帖子标题"
                className="w-full text-[18px] font-bold text-[var(--ink)] outline-none placeholder:font-normal placeholder:text-[var(--muted-light)]"
              />
            </div>

            {/* 工具栏 */}
            <div className="relative flex items-center gap-2 border-b border-[var(--line)] py-2.5">
              <button
                type="button"
                onClick={handleToggleEmoji}
                className="interactive-press flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[12.5px] font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                aria-label="插入表情"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M8.5 14.5c.9 1 2.1 1.5 3.5 1.5s2.6-.5 3.5-1.5" />
                  <path d="M9 9.5h.01M15 9.5h.01" />
                </svg>
                <span>表情</span>
              </button>

              {/* 表情选择器 Popover */}
              {showEmoji && (
                <div
                  ref={emojiPickerRef}
                  className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 rounded-[16px] border border-[var(--line)] bg-white p-3 shadow-[var(--shadow-float)] sm:w-80"
                >
                  <div className="grid max-h-52 grid-cols-6 gap-2 overflow-y-auto p-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => insertEmoji(e)}
                        className="flex h-9 w-9 items-center justify-center rounded-[8px] transition-transform hover:scale-110 hover:bg-[var(--surface-subtle)]"
                      >
                        <img
                          src={resolveImage(`/images/meme/${e}`)}
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 正文输入区 */}
            <div className="py-4">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onMouseUp={saveSelection}
                onKeyUp={saveSelection}
                onBlur={saveSelection}
                onInput={() => setDirty(true)}
                role="textbox"
                aria-label="帖子正文"
                aria-multiline="true"
                className="min-h-[240px] text-[15px] leading-[1.85] text-[var(--ink)] outline-none lg:min-h-[440px] [&_img]:inline-block [&_img]:align-middle"
                data-placeholder="分享你的真实体验、提问或者测评吧~"
              />
            </div>
          </div>

          {/* 右侧：发布配置面板 */}
          <div className="space-y-5">
            {/* 板块选择卡片 */}
            <div className="rail-panel p-5">
              <h2 className="text-[13.5px] font-bold text-[var(--ink)]">选择板块</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {PLATES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlate(p.id)}
                    className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                      plate === p.id
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'bg-[var(--surface-subtle)] text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 图片上传卡片 */}
            <div className="rail-panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[13.5px] font-bold text-[var(--ink)]">上传图片</h2>
                <span className="text-[11px] font-semibold text-[var(--muted-light)]">
                  {images.length}/9 张
                </span>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFileChange}
              />

              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface-subtle)]">
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-[12px] leading-none transition-colors hover:bg-black/80"
                      aria-label="删除图片"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {images.length < 9 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-tint)] hover:text-[var(--accent-ink)]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="text-[11px] font-semibold">添加图片</span>
                  </button>
                )}
              </div>
            </div>

            {/* 社区规范提示 */}
            <div className="rail-panel bg-[var(--surface-soft)] p-4 text-[12px] text-[var(--muted)] shadow-none">
              <p className="font-semibold text-[var(--ink-soft)]">💡 社区发帖小贴士</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[11.5px] leading-5">
                <li>客观分享真实测评与使用体验</li>
                <li>图片支持常见比例，保持原比例展示</li>
                <li>友善交流，互相尊重不同感受</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <LoginTipModal open={showLoginTip} onClose={() => setShowLoginTip(false)} />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--muted-light);
        }
      `}</style>
    </div>
  );
}
