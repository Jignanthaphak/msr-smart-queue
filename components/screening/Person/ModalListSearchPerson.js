// /components/screening/Person/ModalListSearchPerson.js "success Refactor Code"
'use client';
import { useState, useEffect, useCallback } from "react";
import { CircleX, MousePointerClick } from 'lucide-react';
import MovableDialogWrapper from '@/components/common/MovableDialog/MovableDialogWrapper';
import ListPerson from '@/components/screening/Person/ListPerson';

export default function ModalListSearchPerson({ isOpen, onClose, dataSearch, onSelectedModal }) {
   
    const [personDataSelected, setPersonDataSelected] = useState(null)
    const [isClearSelected, setIsClearSelected] = useState(false)
   
    useEffect(() => {

        if (isOpen) {
            setPersonDataSelected(null) 
        }

    }, [isOpen]);

    const onSelectedPersonCallback = (data) => {

        if (Object.keys(data).length > 0) {
            setPersonDataSelected(data)
            setIsClearSelected(false)
        }

    }

    const handleConfirm = () => {

        if (personDataSelected) {
            onSelectedModal(personDataSelected)
        }

    }

    const handleCancel = () => {

        if(personDataSelected){
            setPersonDataSelected(null)
            setIsClearSelected(true)
        }else{
            onClose()
        }
    }

    return (
        <MovableDialogWrapper
            title="รายการค้นหา"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="modal-wrapper">
                <div className="modal-wrapper-container">
                    <ListPerson dataPerson={dataSearch} clearSelected={isClearSelected} onSelectedPerson={onSelectedPersonCallback} tableOptions={{
                        maxHeight: 500,
                    
                    }} />
                </div>
                <div className="modal-action">
                    <button type="button" className="action-btn outline" onClick={handleCancel}>
                        <span className="hide-in-modern">❌</span>
                        <CircleX className="show-in-modern" />
                        ยกเลิก
                    </button>
                    {personDataSelected &&
                    <button type="button" className="action-btn outline" disabled={!personDataSelected} onClick={handleConfirm}>
                        <span className="hide-in-modern">✅</span>
                        <MousePointerClick className="show-in-modern" />
                        เลือก
                    </button>
                    }
                </div>
            </div>
        </MovableDialogWrapper>
    );
}
