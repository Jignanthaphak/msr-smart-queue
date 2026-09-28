'use client';
import SearchPanelPerson from '@/components/screening/Person/SearchPanelPerson';
import FormPerson from '@/components/screening/Person/FormPerson';
import BtnForm from '@/components/screening/BtnAction/BtnForm';
import Checkbox from '@/components/common/Form/Checkbox';
import Button from '@/components/common/Form/Button';
import ReadCardModal from '@/components/screening/Person/ReadCardModal'; // <--- Import เข้ามา
import ReadThaIDModal from '@/components/screening/Person/ReadThaIDModal'; // <--- ปุ่มดึงข้อมูลด้วย ThaID
import { UserPlus, Pencil, Save, Stethoscope, X } from 'lucide-react';
import { useManagesPersonFormScreening } from '@/hooks/useManagesPersonFormScreening';

export default function TabPerson({ open }) {

  const {
    formComplete,
    personData,
    uiState,
    refFormPerson,
    onSelectedSearchCallback,
    onChangeFormPersonCallback,
    onClickBtnCallback,
    addReserveHN,
    AlertComponent,
    onReadCardSuccess
  } = useManagesPersonFormScreening();

  return (
    <>
      <div className={`step-box ${open ? "open" : ""}`}>
        <div className="form-title">
          <h4>
            <label className="hide-in-modern">📝</label>
            บันทึกข้อมูลผู้รับบริการ/ค้นหาข้อมูลผู้รับบริการ
          </h4>
          <SearchPanelPerson key={uiState.resetKey} onSelectedSearch={onSelectedSearchCallback} />
        </div>

        <div className="form-box">
          <div className="flex flex-col  justify-between">

            <div className="flex flex-col sm:flex-row justify-between">
              <div className="checkbox-group check-is-complete">
                <Checkbox type="checkbox" id="isComplete" name="isComplete" checked={formComplete} readOnly />
                <span>กรอกข้อมูลครบถ้วน</span>
              </div>
              <div className="form-group !flex-col sm:!flex-row gap-2 items-left sm:items-center !text-[1rem] !font-bold mr-5">
                {uiState.screeningDate && (
                  <>
                    <div>
                      <label className="!text-[1rem] !font-bold !mb-0">วันที่ Screening : </label>
                      <label className="!text-[1rem] !font-bold !mb-0">{uiState.screeningDate || "-"}</label>
                    </div>
                    <div className="hidden sm:block">|</div>
                  </>
                )}
                {uiState.screeningStatusName && (
                  <>
                    <div>
                      <label className="!text-[1rem] !font-bold !mb-0">สถานะ Screening : </label>
                      <label className="!text-[1rem] !font-bold !mb-0">{uiState.screeningStatusName || "-"}</label>
                    </div>
                    <div className="hidden sm:block">|</div>
                  </>
                )}
                {uiState.screeningId && (
                  <>
                    <div>
                      <label className="!text-[1rem] !font-bold !mb-0">Screening ID : </label>
                      <label className="!text-[1rem] !font-bold !mb-0">{uiState.screeningId || "-"}</label>
                    </div>
                    <div className="hidden sm:block">|</div>
                  </>
                )}
                <div>
                  <label className="!text-[1rem] !font-bold !mb-0">HN : </label>
                  <label className="!text-[1rem] !font-bold !mb-0">{uiState.hn || "-"}</label>
                </div>
              </div>
            </div>

            {/* 👉 แก้ไขจุดนี้: นำปุ่มทั้งสองมาจัดกลุ่มรวมกันให้อยู่ชิดขวา และมีระยะห่าง (gap) */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              {!uiState.hn && (
                <Button onClick={addReserveHN} disabled={uiState.disabledBtn} className="action-btn outline" type="button">
                  <span className="hide-in-modern">➕</span>
                  <UserPlus className="show-in-modern"/>
                  เพิ่มใหม่
                </Button>
              )}
              
              {/* ปุ่มอ่านบัตรประชาชน & ปุ่มดึงข้อมูลด้วย ThaID */}
              {!uiState.disabledForm && (
                <>
                  <ReadCardModal onSuccess={onReadCardSuccess} />
                  <ReadThaIDModal onSuccess={onReadCardSuccess} />
                </>
              )}
            </div>


          </div>

          <FormPerson
            ref={refFormPerson}
            key={uiState.resetKey}
            personData={personData}
            disabledForm={uiState.disabledForm}
            onChangeFormPerson={onChangeFormPersonCallback}
          />

          <BtnForm btnState={uiState.btnState} disabledBtn={uiState.disabledBtn} onClickBtn={onClickBtnCallback} />
        </div>
      </div>
      {AlertComponent}
    </>
  );
}
