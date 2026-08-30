// /components/common/Modal/ModalWrapper.js
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useEffect } from 'react'
export default function ModalWrapper({ isOpen, onClosed, onConfirm, children, allowOutsideClick = true, allowEscapeKey = true, allowEnterKey = true }) {
  const handleClose = () => {
    if (onClosed) onClosed()
  }

useEffect(() => {
    const handleKeyDown = (e) => {
    if (e.key === 'Escape' && allowEscapeKey) handleClose()
    if (e.key === 'Enter' && allowEnterKey) onConfirm()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
}, [allowEscapeKey, allowEnterKey])

  return (
    <AnimatePresence onExitComplete={onClosed}>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={allowOutsideClick ? handleClose : undefined}
        >
          <motion.div
            className="w-full max-w-md mx-4"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.2, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
