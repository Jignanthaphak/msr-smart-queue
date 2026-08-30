// /conponents/login/LoginModalAgain.js
'use client'
import { useEffect, useState } from 'react'
import ModalWrapper from '@/components/common/Modal/ModalWrapper'
import LoginForm from '@/components/login/LoginForm'
export default function LoginModalAgain({isOpen}) {

   
    return (
        <>
            <ModalWrapper
                isOpen={isOpen}
                allowOutsideClick={false}
                allowEscapeKey={false}
                allowEnterKey={false}
            >
                <LoginForm />
          
            </ModalWrapper>
        
        </>
        
    )
}
  