// /components/screening/Search/SearchForm.js "success Refactor Code"
'use client';
import React from "react";
import { useState, useEffect, useRef } from "react";
import Input from '@/components/common/Form/Input';
import ButtonForm from '@/components/common/Form/ButtonForm';
import { BaseSchema, replace } from "@/lib/validators/form/screening/search/schema";
import { Search } from 'lucide-react';
import cloneDeep from 'lodash/cloneDeep';
function SearchForm({
  showFields = {},
  onSearch,
  clearSearch = false,
  disabledSearch = false 
}) {

    const defaultFields = {
        hn: true,
        nameTh: true,
        nameEn: true,
        idCard: true,
        passport: true,
    }

    const mergedFields = { ...defaultFields, ...showFields }
    
    const initialFormData = {
        hn: '',
        nameTh: '',
        nameEn: '',
        idCard: '',
        passport: '',
    }

    const [formData, setFormData] = useState(initialFormData)
    const [warnFields, setWarnFields] = useState({})
    const sanitizeTimeouts = useRef({})

    const setWarnWithTimeout = (name, message) => {
        setWarnFields((prev) => ({ ...prev, [name]: message }))

        if (sanitizeTimeouts.current[name]) {
            clearTimeout(sanitizeTimeouts.current[name])
        }

        if (message !== null) {
            sanitizeTimeouts.current[name] = setTimeout(() => {
                setWarnFields((prev) => ({ ...prev, [name]: null }))
                sanitizeTimeouts.current[name] = null
            }, 1500)
        }
    }

    useEffect(() => {

        if (clearSearch) {
            setFormData(cloneDeep(initialFormData))
            setWarnFields({})
        }

    }, [clearSearch])
    
    const handleChange = (e) => {

        const {name, value} = e.target
        
        let newValue = value
        const oldValue = formData[name]
       
        const validator = replace[name]
        const partialObj = {[name]: newValue }
        const parsed = BaseSchema.pick({ [name]: true }).safeParse(partialObj)
        
        if (!parsed.success) {

            const isFormatError = parsed?.error?.errors[0]?.message
        
            if (validator) {
                
                newValue = newValue.replace(validator, '')
                
                setWarnWithTimeout(name, isFormatError)
            }

        }else{

            setWarnWithTimeout(name, null)
            
        }
        
        if(newValue !== oldValue){

            setFormData((prev) => ({
                ...prev,
                [name]: newValue,
            }))

        }
       

    }

    const handleSubmit = async (e) => {

        try {

            e.preventDefault()

            const searchData = {}

            Object.keys(mergedFields).forEach(key => {
                if (mergedFields[key]) {
                    searchData[key] = formData[key]
                }
            });

            onSearch(searchData)

        } catch (err) {

            await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message , type: 'alert', icon: 'error' })

        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-search">
        
                {mergedFields.hn && (
                    <div className="form-group">
                        <span >HN</span>
                        <Input type="text"
                            name="hn" 
                            value={formData.hn}
                            className={`form-input ${disabledSearch ? "disabled":""}`}
                            placeholder="" 
                            onChange={handleChange}
                            onBlur={() => setWarnFields((prev) => ({ ...prev, hn: null }))}
                            warning={warnFields?.hn}
                            readOnly={disabledSearch}
                        />
                    </div>
                )}

                {mergedFields.nameTh && (
                    <div className="form-group">
                    <span >ชื่อ-นามสกุล (ไทย)</span>
                     <Input type="text"
                        name="nameTh" 
                        value={formData.nameTh}
                        placeholder="" 
                        onChange={handleChange}
                        onBlur={() => setWarnFields((prev) => ({ ...prev, nameTh: null }))}
                        warning={warnFields?.nameTh}
                        readOnly={disabledSearch}
                    />
                    </div>
                )}

                {mergedFields.nameEn && (
                    <div className="form-group">
                        <span >ชื่อ-นามสกุล (อังกฤษ)</span>
                        <Input type="text"
                            name="nameEn" 
                            value={formData.nameEn}
                            placeholder="" 
                            onChange={handleChange}
                            onBlur={() => setWarnFields((prev) => ({ ...prev, nameEn: null }))}
                            warning={warnFields?.nameEn}
                            readOnly={disabledSearch}
                        />
                    </div>
                )}

                {mergedFields.idCard && (
                    <div className="form-group">
                        <span >หมายเลขบัตรประชาชน</span>
                        <Input type="text"
                            name="idCard" 
                            value={formData.idCard}
                            placeholder="" 
                            onChange={handleChange}
                            onBlur={() => setWarnFields((prev) => ({ ...prev, idCard: null }))}
                            warning={warnFields?.idCard}
                            readOnly={disabledSearch}
                        />
                    </div>
                )}

                {mergedFields.passport && (
                    <div className="form-group">
                        <span >พาสสปอร์ต</span>
                        <Input type="text"
                            name="passport" 
                            value={formData.passport}
                            placeholder="" 
                            onChange={handleChange}
                            onBlur={() => setWarnFields((prev) => ({ ...prev, passport: null }))}
                            warning={warnFields?.passport}
                            readOnly={disabledSearch}
                        />
                    </div>
                )}

                <div className="form-group">
                    <ButtonForm 
                        type="submit" 
                        disabled={disabledSearch}
                    > 
                        <span className="hide-in-modern">🔍</span>
                        <Search className="show-in-modern"/> ค้นหา
                      
                    </ButtonForm>
                </div>
            
            </div>
        </form>
    );
}
export default React.memo(SearchForm);
