'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Rnd } from 'react-rnd'
import { Maximize2, Minimize2, X, TableOfContents } from 'lucide-react'

export default function MovableDialogWrapper({ title = "", isOpen, onClose, children, width, height   }) {
  
  const defaultWidth = width ? width : 800
  const defaultHeight = height ? height : 700

  const [fullscreen, setFullscreen] = useState(false)
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)

  const rndRef = useRef(null)

  // ตรวจสอบขนาดหน้าจอ
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // คำนวณ size และ position เมื่อเปิด modal หรือ toggle fullscreen
  useEffect(() => {
     if (!isOpen) {
      document.body.style.overflow = "" // คืนค่าเดิม
      return
    }

    // block scroll เวลา modal เปิด
    document.body.style.overflow = "hidden"

    let w, h, x, y

    if (fullscreen) {
      // fullscreen ให้ใช้เกือบเต็มจอ
      w = window.innerWidth - 40
      h = window.innerHeight - 40
      x = 20
      y = 20
    } else {
      // ขนาดปกติ
      w = Math.min(defaultWidth, window.innerWidth - 40)
      h = Math.min(defaultHeight, window.innerHeight - 40)
      x = (window.innerWidth - w) / 2
      y = (window.innerHeight - h) / 2
    }

    setSize({ width: w, height: h })
    setPosition({ x, y })
  }, [isOpen, fullscreen])

  // ฟัง resize หน้าจอและปรับ modal
  useEffect(() => {
    const handleResize = () => {
      if (!isOpen) return

      let w = size.width
      let h = size.height
      let x = position.x
      let y = position.y

      if (fullscreen) {
        w = window.innerWidth - 40
        h = window.innerHeight - 40
        x = 20
        y = 20
      } else {
        // ตรวจสอบว่า modal ยังอยู่ในขอบเขตหน้าจอหรือไม่
        if (x + w > window.innerWidth) x = window.innerWidth - w
        if (y + h > window.innerHeight) y = window.innerHeight - h
        if (x < 0) x = 0
        if (y < 0) y = 0
      }

      setSize({ width: w, height: h })
      setPosition({ x, y })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, fullscreen, size.width, size.height, position.x, position.y])

  const handleDrag = (e, d) => {
    setPosition({ x: d.x, y: d.y })
  }

  const handleDragStop = (e, d) => {
    setPosition({ x: d.x, y: d.y })
  }

  const handleResizeStop = (e, direction, ref, delta, pos) => {
    setSize({
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height)
    })
    setPosition(pos)
  }

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  if (!isOpen) return null

  return (
     <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Rnd
          ref={rndRef}
          size={{
            width: size.width,
            // height: fullscreen ? size.height : 'auto', // ให้สูงตาม content
            height: size.height,
          }}
          position={position}
          minWidth={isMobile ? 300 : 400}
          minHeight={isMobile ? 250 : 300}
          maxHeight={fullscreen ? window.innerHeight - 40 : defaultHeight}
          enableResizing={!fullscreen}
          disableDragging={fullscreen}
          dragHandleClassName="modal-drag-handle"
          bounds="window"
          className="fixed z-50 pointer-events-auto"
          onDragStop={handleDragStop}
          onResizeStop={handleResizeStop}
        >
          <motion.div
            className="w-full h-full bg-white rounded-xl shadow-lg flex flex-col overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            // style={{ maxHeight: fullscreen ? window.innerHeight - 40 : 600 }}
          >
            {/* Toolbar */}
            <div className={`flex items-center justify-between bg-gray-100 px-4 py-2 border-b ${!isMobile && !fullscreen ? 'modal-drag-handle cursor-move' : ''}`}>
              <span className="font-semibold flex items-center gap-1 text-sm md:text-base">
                <TableOfContents className="show-in-modern w-4 h-4 md:w-5 md:h-5"/>
                {title}
              </span>
              <div className="flex gap-1 md:gap-2">
             
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                  >
                     {fullscreen ? <Minimize2 size={16} className="md:w-[18px] md:h-[18px]" /> : <Maximize2 size={16} className="md:w-[18px] md:h-[18px]" />}
                  </button>
                
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-red-100 text-red-600 cursor-pointer"
                >
                  <X size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 md:p-4 overflow-hidden flex-1">
              {children}
            </div>
          </motion.div>
        </Rnd>
      </motion.div>
    </AnimatePresence>
  )
}