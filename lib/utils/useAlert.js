// /lib/utils/useAlert.js
import { useState, useCallback } from 'react'
import ModalWrapper from '@/components/common/Modal/ModalWrapper'
import AlertContent from '@/components/common/Alert/AlertContent'

export function useAlert() {
  const [modalProps, setModalProps] = useState(null)

  const showAlert = useCallback((options) => {
    return new Promise((resolve) => {
      let resolved = false

      const resolveOnce = (result) => {
        if (!resolved) {
          resolved = true
          resolve(result)
          setModalProps(null)
        }
      }

      const type = options.type || 'alert'
      const isConfirm = type === 'confirm'
      const isLoading = type === 'loading'
      const loadingStyle = options.loadingStyle || 'modal'

      const commonProps = {
        isOpen: true,
        title: options.title,
        message: options.message,
        icon: options.icon || 'info',
        imgSrc: options.imgSrc || null,
        confirmText: options.confirmText || 'ตกลง',
        cancelText: options.cancelText || 'ยกเลิก',
        showCancel: options.showCancel !== undefined ? options.showCancel : isConfirm,
        loading: isLoading,
        loadingStyle,
        allowOutsideClick: options.allowOutsideClick !== false,
        allowEscapeKey: options.allowEscapeKey !== false,
        allowEnterKey: options.allowEnterKey !== false,
        onConfirm: () => {
          setModalProps((prev) => ({
            ...prev,
            isOpen: false,
            onClosed: () => resolveOnce(true),
          }))
        },
        onCancel: () => {
          setModalProps((prev) => ({
            ...prev,
            isOpen: false,
            onClosed: () => resolveOnce(false),
          }))
        },
        onClosed: () => resolveOnce(false), // fallback (เช่น click outside)
      }

      if (isLoading && typeof options.duration !== 'number') {
        const close = () => {
          setModalProps((prev) => ({
            ...prev,
            isOpen: false,
            onClosed: () => resolveOnce(true),
          }))
        }
        setModalProps({
          ...commonProps,
          onConfirm: () => {},
          onCancel: () => {},
        })
        resolve(close)
        return
      }

      setModalProps(commonProps)

      if (isLoading && typeof options.duration === 'number') {
        const id = setTimeout(() => {
          setModalProps((prev) => ({
            ...prev,
            isOpen: false,
            onClosed: () => resolveOnce(true),
          }))
        }, options.duration)
        return () => clearTimeout(id)
      }
    })
  }, [])

  const AlertComponent = modalProps ? (
    <ModalWrapper
      isOpen={modalProps.isOpen}
      onClosed={modalProps.onClosed}
      allowOutsideClick={modalProps.allowOutsideClick}
      allowEscapeKey={modalProps.allowEscapeKey}
      allowEnterKey={modalProps.allowEnterKey}
      onConfirm={modalProps.onConfirm}
    >
      <AlertContent {...modalProps} />
    </ModalWrapper>
  ) : null

  return {
    showAlert,
    AlertComponent,
  }
}
