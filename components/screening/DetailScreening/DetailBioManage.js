// /components/screening/DetailScreening/DetailBioManage.js 
'use client';
import { useState } from 'react';
import BtnForm from '@/components/screening/BtnAction/BtnForm';
import DetailBioForm from '@/components/screening/DetailScreening/DetailBioForm';
import { useManagesBioFormDetail } from '@/hooks/useManagesBioFormDetail';

export default function DetailBioManage({ open, data, isEdit = false, onEdit }) {

  const {
    refFormBio,
    bioData,
    uiState,
    onChangeFormBioCallback,
    onClickBtnCallback,
    AlertComponent
  } = useManagesBioFormDetail(data, onEdit);

  return (
    <>
      <div className={`step-box ${open ? "open" : ""}`}>
        <DetailBioForm  ref={refFormBio} bioData={bioData} isEdit={uiState.isEdit} disabledForm={uiState.disabledForm} onChangeFormBio={onChangeFormBioCallback}/>
        {isEdit &&
          <BtnForm btnState={uiState.btnState} disabledBtn={uiState.disabledBtn} onClickBtn={onClickBtnCallback} />
         }
      </div>
      {AlertComponent}
     
    </>
  );
}
