// /conponents/login/ResetPassModal.js
'use client'
import { useEffect, useState } from 'react'
import ModalWrapper from '@/components/common/Modal/ModalWrapper'
import ResetPassForm from '@/components/resetpass/ResetPassForm'
export default function ResetPassModal({isOpen, onClosed, onConfirm}) {

    const handleClosed = () => {
        onClosed()
    };
    const handleConfirm = () => {
      onConfirm()
    };
   
    return (
        <>
            <ModalWrapper
                isOpen={isOpen}
                onClosed={handleClosed}
                onConfirm={handleConfirm}
                allowOutsideClick={true}
                allowEscapeKey={true}
                allowEnterKey={true}
            >
                <ResetPassForm />
          
            </ModalWrapper>
        
        </>
        
    )
}
  