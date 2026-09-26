// /components/screening/Bio/BioReportViewer.js
'use client';
import { useState, useEffect, useRef } from 'react';
import clientConfig from '@/config/Client';
import { uploadBioImageAction, getBioImagesAction } from '@/actions/bioReportActions';
import { 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ExternalLink, 
  Download, 
  X, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  FileImage,
  RefreshCw
} from 'lucide-react';

/**
 * ฟังก์ชันช่วยแปลง URL รูปภาพให้มี prefix basePath (/msr) ถูกต้อง 100% เสมอ
 * ป้องกันปัญหากระเด็นไปเว็บหน้าหลักของศูนย์ฯ
 */
export function formatImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  // กรณีเป็น Full URL เช่น https://mhc4.dmh.go.th/uploads/bio/...
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname && !parsed.pathname.startsWith('/msr/')) {
        parsed.pathname = '/msr' + (parsed.pathname.startsWith('/') ? '' : '/') + parsed.pathname;
        return parsed.toString();
      }
      return url;
    } catch {
      return url;
    }
  }

  // กรณีเป็น Relative path
  let clean = url.startsWith('/') ? url : `/${url}`;
  if (!clean.startsWith('/msr/')) {
    clean = `/msr${clean}`;
  }
  return clean;
}

/**
 * ฟังก์ชันช่วยบีบอัดรูปภาพผ่าน HTML5 Canvas ก่อนส่งขึ้นเซิร์ฟเวอร์
 * ลดขนาดเหลือ ~150-180 KB คมชัดสูง ไม่เบลอ ประหยัดพื้นที่จัดเก็บบนเซิร์ฟเวอร์
 */
function compressImageClient(file, maxWidth = 1100, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BioReportViewer({ 
  screeningId = null, 
  hn = null, 
  initialDdrUrl = null, 
  initialApgUrl = null,
  isEdit = false 
}) {
  const [images, setImages] = useState({
    ddr: initialDdrUrl ? formatImageUrl(initialDdrUrl) : null,
    apg: initialApgUrl ? formatImageUrl(initialApgUrl) : null,
  });
  const [imgErrors, setImgErrors] = useState({
    ddr: false,
    apg: false,
  });
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // { url, title, type }
  const [zoomLevel, setZoomLevel] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  const fileInputDdrRef = useRef(null);
  const fileInputApgRef = useRef(null);

  // อัปเดตรูปภาพทันทีเมื่อได้รับ props initialDdrUrl หรือ initialApgUrl เข้ามา
  useEffect(() => {
    if (initialDdrUrl) {
      setImages((prev) => ({ ...prev, ddr: formatImageUrl(initialDdrUrl) }));
      setImgErrors((prev) => ({ ...prev, ddr: false }));
    }
    if (initialApgUrl) {
      setImages((prev) => ({ ...prev, apg: formatImageUrl(initialApgUrl) }));
      setImgErrors((prev) => ({ ...prev, apg: false }));
    }
  }, [initialDdrUrl, initialApgUrl]);

  // ดึง URL รูปภาพ (มีระบบสำรองอัตโนมัติทั้ง Server Action และ REST API)
  useEffect(() => {
    let isMounted = true;

    const fetchImages = async () => {
      if (!screeningId && !hn) return;

      setLoading(true);
      try {
        let res = null;

        // 1. ลองเรียกผ่าน Server Action ก่อน
        try {
          res = await getBioImagesAction({ screeningId, hn });
        } catch (errAction) {
          console.warn('[BioReportViewer] getBioImagesAction failed, trying REST API fallback:', errAction);
        }

        // 2. ถ้า Server Action ยังไม่ได้ build หรือ error ให้ดึงผ่าน REST API สำรอง
        if (!res?.ok) {
          try {
            const params = new URLSearchParams();
            if (screeningId) params.append('screening_id', String(screeningId));
            if (hn) params.append('hn', String(hn));
            const apiRes = await fetch(`/msr/api/screening/bio/images?${params.toString()}`);
            if (apiRes.ok) {
              const apiData = await apiRes.json();
              if (apiData?.ok) {
                res = {
                  ok: true,
                  ddrUrl: apiData.ddr_url,
                  apgUrl: apiData.apg_url,
                };
              }
            }
          } catch (errApi) {
            console.warn('[BioReportViewer] REST API fallback failed:', errApi);
          }
        }

        if (isMounted && res?.ok) {
          if (res.ddrUrl) {
            const formatted = formatImageUrl(res.ddrUrl);
            setImages((prev) => ({ ...prev, ddr: formatted }));
            setImgErrors((prev) => ({ ...prev, ddr: false }));
          }
          if (res.apgUrl) {
            const formatted = formatImageUrl(res.apgUrl);
            setImages((prev) => ({ ...prev, apg: formatted }));
            setImgErrors((prev) => ({ ...prev, apg: false }));
          }
        }
      } catch (err) {
        console.error('Error fetching bio images:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, [screeningId, hn]);

  // ระบบตรวจจับกรณีโหลดรูปไม่ขึ้น (Fallback อัตโนมัติไปยัง Streaming Route โดยตรง)
  const handleImageLoadError = (type) => {
    const currentUrl = images[type];
    if (currentUrl && !currentUrl.includes('/view-image')) {
      const fileName = currentUrl.split('/').pop()?.split('?')[0];
      if (fileName && fileName.endsWith('.jpg')) {
        const streamUrl = `/msr/api/screening/bio/view-image?name=${fileName}`;
        console.warn(`[BioReportViewer] รูปภาพ static ${type} โหลดไม่ขึ้น สลับไปใช้ Stream API: ${streamUrl}`);
        setImages((prev) => ({
          ...prev,
          [type]: streamUrl,
        }));
        return;
      }
    }
    // ถ้าลอง fallback แล้วยังไม่พบ ให้แสดงการ์ด fallback
    setImgErrors((prev) => ({ ...prev, [type]: true }));
  };

  // ฟังก์ชันอัปโหลดภาพรายงานย้อนหลัง (รองรับทั้ง Server Action และ REST API Fallback)
  const handleUploadImage = async (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg('กำลังบีบอัดและบันทึกภาพรายงาน...');
    try {
      // 1. บีบอัดฝั่งเบราว์เซอร์ให้ไฟล์เล็ก คมชัดสูง (~150 KB)
      const compressedBase64 = await compressImageClient(file, 1100, 0.75);

      // 2. ลองบันทึกผ่าน Server Action
      let res = null;
      try {
        res = await uploadBioImageAction({
          screeningId: screeningId ? String(screeningId) : '',
          hn: hn ? String(hn) : '',
          type,
          base64: compressedBase64,
        });
      } catch (actionErr) {
        console.warn('[BioReportViewer] uploadBioImageAction failed, falling back to REST API:', actionErr);
      }

      // 3. ถ้า Server Action ล้มเหลว (เช่น เซิร์ฟเวอร์ยังไม่ได้ rebuild) ให้ fallback ผ่าน REST API
      if (!res?.ok) {
        const payload = {
          screening_id: screeningId ? String(screeningId) : '',
          hn: hn ? String(hn) : '',
          [type === 'ddr' ? 'ddr_image_base64' : 'apg_image_base64']: compressedBase64,
        };

        const apiRes = await fetch('/msr/api/screening/bio/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.ok) {
            res = {
              ok: true,
              message: `บันทึกภาพ ${type.toUpperCase()} สำเร็จเรียบร้อยค่ะ`,
              url: type === 'ddr' ? apiData.ddr_url : apiData.apg_url,
            };
          } else {
            res = { ok: false, error: apiData.error };
          }
        } else {
          res = { ok: false, error: 'เชื่อมต่อ API บันทึกภาพไม่สำเร็จ (HTTP ' + apiRes.status + ')' };
        }
      }

      if (res?.ok && res.url) {
        const formattedUrl = formatImageUrl(res.url);
        setImages((prev) => ({
          ...prev,
          [type]: formattedUrl,
        }));
        setImgErrors((prev) => ({
          ...prev,
          [type]: false,
        }));
        setUploadMsg(res.message || `บันทึกภาพ ${type.toUpperCase()} สำเร็จเรียบร้อยค่ะ`);
        setTimeout(() => setUploadMsg(null), 3000);
      } else {
        alert(res?.error || 'เกิดข้อผิดพลาดในการบันทึกภาพค่ะ');
        setUploadMsg(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ระบบไม่สามารถบันทึกภาพได้'));
      setUploadMsg(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Lightbox Zoom Controls
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  // Close Lightbox on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
        setZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const isDdrValid = Boolean(images.ddr && !imgErrors.ddr);
  const isApgValid = Boolean(images.apg && !imgErrors.apg);

  return (
    <div className="w-full mt-6 pt-4 border-t border-slate-200">
      {/* Header ของส่วนแสดงภาพรายงาน */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="!text-[18px] font-bold text-slate-800 !mb-0 flex items-center gap-2">
              ภาพรายงานผลตรวจ Biofeedback (DDR & APG)
            </h3>
            <p className="text-xs text-slate-500 !mb-0">
              รายงานระบบประสาทอัตโนมัติและสภาวะหลอดเลือดจากเครื่อง SA-3000P (บีบอัดความคมชัดสูง ประหยัดเนื้อที่เซิร์ฟเวอร์)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {uploadMsg && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-pulse font-medium">
              {uploadMsg}
            </span>
          )}
          {loading && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> กำลังตรวจสอบภาพรายงาน...
            </span>
          )}
        </div>
      </div>

      {/* ซ่อน input file ไว้สำหรับเรียกใช้ */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputDdrRef} 
        onChange={(e) => handleUploadImage('ddr', e)} 
        className="hidden" 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputApgRef} 
        onChange={(e) => handleUploadImage('apg', e)} 
        className="hidden" 
      />

      {/* Grid แสดงการ์ดภาพรายงาน 2 ช่อง (DDR และ APG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* --- Card 1: รายงานระบบประสาทอัตโนมัติ (DDR) --- */}
        <div className="border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 text-[15px] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                1. รายงานระบบประสาทอัตโนมัติ (DDR)
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                ANS Report
              </span>
            </div>

            {isDdrValid ? (
              <div className="relative group rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center min-h-[220px]">
                <img 
                  src={formatImageUrl(images.ddr)} 
                  alt="DDR Report" 
                  onError={() => handleImageLoadError('ddr')}
                  className="max-h-[280px] w-auto object-contain cursor-pointer transition duration-200 group-hover:scale-[1.02]"
                  onClick={() => {
                    setSelectedImage({
                      url: formatImageUrl(images.ddr),
                      title: `รายงานระบบประสาทอัตโนมัติ (DDR) - HN: ${hn || '-'}`,
                      type: 'ddr'
                    });
                    setZoomLevel(1);
                  }}
                />
                {/* Overlay Hover Icon */}
                <div 
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer pointer-events-none"
                >
                  <span className="bg-white/90 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <ZoomIn className="w-4 h-4 text-emerald-600" /> คลิกเพื่อดูภาพขนาดใหญ่
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center min-h-[220px]">
                <FileImage className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-sm font-medium text-slate-600">ยังไม่พบไฟล์ภาพรายงาน DDR</span>
                <span className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  จะแนบอัตโนมัติเมื่อส่งจากเครื่องตรวจ หรือเลือกอัปโหลดไฟล์ภาพได้ค่ะ
                </span>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputDdrRef.current?.click()}
                  className="mt-3 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-md flex items-center gap-1 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> แนบภาพ DDR
                </button>
              </div>
            )}
          </div>

          {/* Action Bar สำหรับ DDR */}
          {isDdrValid && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedImage({
                    url: formatImageUrl(images.ddr),
                    title: `รายงานระบบประสาทอัตโนมัติ (DDR) - HN: ${hn || '-'}`,
                    type: 'ddr'
                  });
                  setZoomLevel(1);
                }}
                className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" /> ดูภาพขนาดใหญ่
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={formatImageUrl(images.ddr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  title="เปิดในแท็บใหม่"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> เปิดแท็บใหม่
                </a>
                <button
                  type="button"
                  onClick={() => fileInputDdrRef.current?.click()}
                  className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                  title="เปลี่ยนภาพรายงาน"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- Card 2: รายงานสภาวะหลอดเลือด (APG) --- */}
        <div className="border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 text-[15px] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                2. รายงานสภาวะหลอดเลือด (APG)
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                Vascular Report
              </span>
            </div>

            {isApgValid ? (
              <div className="relative group rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center min-h-[220px]">
                <img 
                  src={formatImageUrl(images.apg)} 
                  alt="APG Report" 
                  onError={() => handleImageLoadError('apg')}
                  className="max-h-[280px] w-auto object-contain cursor-pointer transition duration-200 group-hover:scale-[1.02]"
                  onClick={() => {
                    setSelectedImage({
                      url: formatImageUrl(images.apg),
                      title: `รายงานสภาวะหลอดเลือด (APG) - HN: ${hn || '-'}`,
                      type: 'apg'
                    });
                    setZoomLevel(1);
                  }}
                />
                {/* Overlay Hover Icon */}
                <div 
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer pointer-events-none"
                >
                  <span className="bg-white/90 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <ZoomIn className="w-4 h-4 text-blue-600" /> คลิกเพื่อดูภาพขนาดใหญ่
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center min-h-[220px]">
                <FileImage className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-sm font-medium text-slate-600">ยังไม่พบไฟล์ภาพรายงาน APG</span>
                <span className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  จะแนบอัตโนมัติเมื่อส่งจากเครื่องตรวจ หรือเลือกอัปโหลดไฟล์ภาพได้ค่ะ
                </span>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputApgRef.current?.click()}
                  className="mt-3 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 px-3 py-1.5 rounded-md flex items-center gap-1 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> แนบภาพ APG
                </button>
              </div>
            )}
          </div>

          {/* Action Bar สำหรับ APG */}
          {isApgValid && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedImage({
                    url: formatImageUrl(images.apg),
                    title: `รายงานสภาวะหลอดเลือด (APG) - HN: ${hn || '-'}`,
                    type: 'apg'
                  });
                  setZoomLevel(1);
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" /> ดูภาพขนาดใหญ่
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={formatImageUrl(images.apg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  title="เปิดในแท็บใหม่"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> เปิดแท็บใหม่
                </a>
                <button
                  type="button"
                  onClick={() => fileInputApgRef.current?.click()}
                  className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                  title="เปลี่ยนภาพรายงาน"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Lightbox Modal สำหรับดูภาพขนาดใหญ่ ซูมเข้า/ออก ได้คมชัดเต็มจอ --- */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setSelectedImage(null);
            setZoomLevel(1);
          }}
        >
          {/* Modal Toolbar */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between text-white pb-3 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-sm md:text-base text-slate-100">
                {selectedImage.title}
              </span>
            </div>

            {/* ปุ่มควบคุมการซูมและปิด */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition disabled:opacity-40 cursor-pointer"
                title="ย่อขนาด (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-300 min-w-[40px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition disabled:opacity-40 cursor-pointer"
                title="ขยายขนาด (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer"
                title="รีเซ็ตขนาด (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-[1px] bg-slate-600 mx-1"></div>

              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                title="เปิดในแท็บใหม่"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={selectedImage.url}
                download
                className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                title="ดาวน์โหลดภาพ"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setZoomLevel(1);
                }}
                className="p-1 hover:bg-rose-600 rounded text-slate-300 hover:text-white transition ml-1 cursor-pointer"
                title="ปิดหน้าต่าง (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Container แสดงรูปภาพพร้อม Zoom */}
          <div 
            className="w-full max-w-5xl h-[85vh] overflow-auto flex items-center justify-center p-2 rounded-xl bg-slate-900/60 border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage.url} 
              alt={selectedImage.title}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="max-h-full max-w-full object-contain transition-transform duration-200 shadow-2xl rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
