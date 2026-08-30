// /components/screening/BtnAction/BtnForm.js
'use client';
import { useState, useEffect  } from "react";
import { UserPlus, Pencil, Save, Stethoscope, X } from 'lucide-react';
import Button from '@/components/common/Form/Button';
export default function BtnForm({btnState = null, onClickBtn, disabledBtn = false}) {
 
    const [buttons, setButtons] = useState({
        new: false,
        edit: false,
        cancel: false,
        save: false,
        send: false,
    });

    useEffect(() => {
        const map = {
            1: { new: true, edit: false, cancel: false, save: false, send: false },
            2: { new: false, edit: false, cancel: true, save: true, send: false },
            3: { new: true, edit: true, cancel: true, save: false, send: true },
            4: { new: false, edit: true, cancel: true, save: false, send: true },
            5: { new: false, edit: true, cancel: true, save: false, send: true },
            6: { new: false, edit: false, cancel: true, save: true, send: false },
            7: { new: false, edit: true, cancel: true, save: false, send: false },
            8: { new: true, edit: true, cancel: true, save: false, send: false },
            9: { new: false, edit: true, cancel: false, save: false, send: false },
        };
        setButtons(map[btnState] || { new: false, edit: false, cancel: false, save: false, send: false });
    }, [btnState]);

    const handleButtonNew = () => {
        onClickBtn("new");
    }
    const handleButtonSave = () => {
        onClickBtn("save");
    }
    const handleButtonEdit = () => {
        onClickBtn("edit");
    }
    const handleButtonCancel = () => {
        onClickBtn("cancel");
    }
    const handleButtonSend = () => {
        onClickBtn("send");
    }

    return (
        <>
            <div className="form-actions">
                 {buttons.cancel &&
                    <Button onClick={handleButtonCancel} disabled={disabledBtn} className="action-btn outline emergency">
                        <span className="hide-in-modern">❌</span>
                        <X className="show-in-modern"/>
                        ยกเลิก
                    </Button>
                }
                {buttons.new &&
                    <Button onClick={handleButtonNew} disabled={disabledBtn} className="action-btn outline">
                        <span className="hide-in-modern">➕</span>
                        <UserPlus className="show-in-modern"/>
                        เพิ่มใหม่
                    </Button>
                }
                {buttons.edit &&
                    <Button onClick={handleButtonEdit} disabled={disabledBtn} className="action-btn outline">
                        <span className="hide-in-modern">✏</span>
                        <Pencil className="show-in-modern"/>
                        คีย์ข้อมูล
                    </Button>
                }
                {buttons.save &&
                    <Button onClick={handleButtonSave} disabled={disabledBtn} className="action-btn outline">
                        <span className="hide-in-modern">💾</span>
                        <Save className="show-in-modern"/>
                        บันทึก
                    </Button>
                }
                {buttons.send &&
                    <Button onClick={handleButtonSend} disabled={disabledBtn} className="action-btn outline">
                        <span className="hide-in-modern">🩺</span>
                        <Stethoscope className="show-in-modern"/>
                        ส่งตรวจ
                    </Button>
                }
                
            </div>
        </>
    );
}
