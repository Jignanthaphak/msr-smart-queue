// /components/screening/DetailScreening/DetailPersonTab.js 
'use client';
import { useState } from 'react';
import BtnForm from '@/components/screening/BtnAction/BtnForm';
import DetailPersonForm from '@/components/screening/DetailScreening/DetailPersonForm';
import { useManagesPersonFormDetail } from '@/hooks/useManagesPersonFormDetail';

export default function DetailPersonManage({ open, data, isEdit = false, onEdit }) {

  const {
    refFormPerson,
    personData,
    uiState,
    onChangeFormPersonCallback,
    onClickBtnCallback,
    AlertComponent
  } = useManagesPersonFormDetail(data, onEdit);

  return (
    <>
      <div className={`step-box ${open ? "open" : ""}`}>
        <DetailPersonForm  ref={refFormPerson} personData={personData} isEdit={uiState.isEdit} disabledForm={uiState.disabledForm} onChangeFormPerson={onChangeFormPersonCallback}/>

        {isEdit &&
        <BtnForm btnState={uiState.btnState} disabledBtn={uiState.disabledBtn} onClickBtn={onClickBtnCallback} />
        }
      </div>
      {AlertComponent}
     
    </>
  );
}
