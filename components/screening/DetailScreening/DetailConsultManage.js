// /components/screening/DetailScreening/DetailConsultManage.js 
'use client';
import { useState, useRef, useEffect } from 'react';
import BtnForm from '@/components/screening/BtnAction/BtnForm';
import DetailConsultForm from '@/components/screening/DetailScreening/DetailConsultForm';
import { useManagesConsultFormDetail } from '@/hooks/useManagesConsultFormDetail';
import Button from '@/components/common/Form/Button';
import { Activity, Brain, BrainCog, HeartPulse, HeartCrack, GraduationCap } from 'lucide-react';

export default function DetailConsultManage({ open, data, isEdit = false, onEdit }) {
  
  const {
    formRef,
    consultData,
    uiState,
    onChangeFormCallback,
    onClickBtnCallback,
    handleCloseConsult,
    AlertComponent
  } = useManagesConsultFormDetail(data, onEdit);
 
  return (
    <>
      <div className={`step-box ${open ? "open" : ""}`}>
        {isEdit &&
        <div className="form-grid !gap-3 !w-full justify-end ">
            {![4,5].includes(consultData?.status_id) &&
              <Button className="action-btn outline mb-5" onClick={handleCloseConsult}>
                  <span className="hide-in-modern">📩</span>
                  <GraduationCap className="show-in-modern"/>
                  ปิดเคส
              </Button>
            }
        </div>
          }
        <DetailConsultForm  ref={formRef} consultData={consultData} isEdit={uiState.isEdit} disabledForm={uiState.disabledForm} onChangeFormConsult={onChangeFormCallback}/>
        {isEdit &&
          <BtnForm btnState={uiState.btnState} disabledBtn={uiState.disabledBtn} onClickBtn={onClickBtnCallback} />
        }
      </div>
      {AlertComponent}
     
    </>
  );
}
