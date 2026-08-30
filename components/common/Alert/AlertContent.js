// /components/common/Alert/AlertContent.jsx
'use client'
import React, { useState, useEffect } from 'react'
import { Info, CheckCircle, XCircle } from 'lucide-react'
import Image from 'next/image'
import clientConfig from "@/config/Client";

export default function AlertContent({
  title,
  message,
  icon = 'info',
  imgSrc,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  showCancel = false,
  loading = false,
  loadingStyle = 'modal',
  onConfirm,
  onCancel,
}) {

  
  const [animatedTitle, setAnimatedTitle] = useState(title)

  useEffect(() => {
    if (loading) {
      let dotCount = 0
      const interval = setInterval(() => {
        dotCount = (dotCount + 1) % 4
        const dots = '.'.repeat(dotCount)
        setAnimatedTitle(`${title}${dots}`)
      }, 500)
      return () => clearInterval(interval)
    } else {
      setAnimatedTitle(title)
    }
  }, [loading, title])

  const getIcon = () => {
    if (imgSrc) {
      return <Image src={`${clientConfig.base_path}${imgSrc}`} alt="custom icon" width={150} height={150} className="object-contain" unoptimized/>
    } 
    switch (icon) {
      case 'success':
        return <CheckCircle className="text-green-500" size={32} />
      case 'error':
        return <Image src={`${clientConfig.base_path}/loading/lo7.gif`} alt="custom icon" width={150} height={150} className="object-contain" unoptimized />
      case 'loading':
        return <Image src={`${clientConfig.base_path}/loading/lo2.gif`} alt="custom icon" width={150} height={150} className="object-contain" unoptimized />
      case 'loading':
      case 'info':
      default:
        return <Info className="text-blue-500" size={32} />
    }
  }

  if (loading && loadingStyle === 'overlay') {
    return (
      <div className="flex flex-col items-center space-y-4">
        {getIcon()}
        <p className="text-white animate-pulse text-lg">{animatedTitle || 'กำลังโหลด'}</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full">
      <div className="flex flex-col items-center text-center">
        {getIcon()}
        <h3 className="mt-3 font-bold text-2xl">{animatedTitle}</h3>
        {message && <p className="text-neutral-500 mt-5 text-lg">{message}</p>}
      </div>

      {!loading && (
        <div className="flex justify-center gap-3 mt-6">
          {showCancel && (
            <button
              onClick={onCancel}
              className="action-btn outline emergency"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="action-btn outline "
          >
            {confirmText}
          </button>
        </div>
      )}
    </div>
  )
}
