// /components/screening/Bio/TabBio.js
'use client';
import { useEffect } from 'react';
import FormBio from '@/components/screening/Bio/FormBio';
import SearchPanelBio from '@/components/screening/Bio/SearchPanelBio';
import BtnForm from '@/components/screening/BtnAction/BtnForm';
import Checkbox from '@/components/common/Form/Checkbox';
import ReadBioModal from '@/components/screening/Bio/ReadBioModal';
import { useManagesBioFormScreening } from '@/hooks/useManagesBioFormScreening';
import clientConfig from '@/config/Client';

export default function TabBio({ open }) {
  
  const {
    formComplete,
    bioData,
    uiState,
    refFormBio,
    onSelectedSearchCallback,
    onChangeFormBioCallback,
    onClickBtnCallback,
    AlertComponent,
    onReadBioSuccess,
  } = useManagesBioFormScreening();

  // Auto-listen for background push from SA-3000P
  useEffect(() => {
    const currentHn = bioData?.hn;
    if (!currentHn || !uiState.screeningId || uiState.disabledBtn) return;

    const interval = setInterval(async () => {
      try {
        const basePath = clientConfig?.base_path || "";
        const res = await fetch(`${basePath}/api/screening/bio/receive?hn=${encodeURIComponent(currentHn)}`);
        if (res.ok) {
          const result = await res.json();
          if (result.ok && result.hasNew && result.data) {
            onReadBioSuccess(result.data);
          }
        }
      } catch (e) {
        // silent
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [bioData?.hn, uiState.screeningId, uiState.disabledBtn]);

  return (
    <>
      <div className={`step-box ${open ? "open" : ""}`}>
        <div className="form-title">
          <h4>
            <label className="hide-in-modern">📠</label>
            ตรวจวัดค่าและประเมิน
          </h4>
          <SearchPanelBio 
            key={uiState.resetKey} 
            onSelectedSearch={onSelectedSearchCallback} 
          />
        </div>

        <div className="form-box">
          <div className="flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between">
              <div className="checkbox-group check-is-complete">
                <Checkbox 
                  type="checkbox"
                  id="isComplete"
                  name="isComplete" 
                  checked={formComplete}
                  readOnly
                />
                <span>กรอกข้อมูลครบถ้วน</span>
              </div>
              <div className="form-group !flex-col sm:!flex-row gap-2 items-left sm:items-center !text-[1rem] !font-bold mr-5">
                <div>
                  <label className="!text-[1rem] !font-bold !mb-0">วันที่ Screening : </label>
                  <label className="!text-[1rem] !font-bold !mb-0">{uiState.screeningDate || "-"}</label>
                </div>
                <div className="hidden sm:block">|</div>
                <div>
                  <label className="!text-[1rem] !font-bold !mb-0">สถานะ Screening : </label>
                  <label className="!text-[1rem] !font-bold !mb-0">{uiState.screeningStatusName || "-"}</label>
                </div>
                <div className="hidden sm:block">|</div>
                <div>
                  <label className="!text-[1rem] !font-bold !mb-0">Screening ID : </label>
                  <label className="!text-[1rem] !font-bold !mb-0">{uiState.screeningId || "-"}</label>
                </div>
              </div>
            </div>

            {/* 👉 ปุ่มดึงผลตรวจจากเครื่อง Biofeedback SA-3000P */}
            {uiState.screeningId && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 my-2">
                <ReadBioModal
                  hn={bioData?.hn}
                  patientName={`${bioData?.firstname || ""} ${bioData?.lastname || ""}`.trim()}
                  disabled={uiState.disabledBtn}
                  onSuccess={onReadBioSuccess}
                />
              </div>
            )}
          </div>

          <FormBio 
            ref={refFormBio} 
            key={uiState.resetKey} 
            bioData={bioData} 
            disabledForm={uiState.disabledForm} 
            onChangeFormBio={onChangeFormBioCallback} 
          />

          <BtnForm  
            btnState={uiState.btnState} 
            onClickBtn={onClickBtnCallback} 
            disabledBtn={uiState.disabledBtn} 
          />
        </div>
      </div>

      {AlertComponent}
    </>
  );
}
