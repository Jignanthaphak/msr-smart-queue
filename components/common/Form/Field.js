// /conponents/form/Field.js
'use client';
import React from 'react';
import Select from '@/components/common/Form/Select';
import Input from '@/components/common/Form/Input';
import Textarea from '@/components/common/Form/Textarea';
import Checkbox from '@/components/common/Form/Checkbox';

export default function Field({ 
    id, 
    name, 
    placeholder, 
    type = "text", 
    component= "Input", 
    options, 
    value, 
    checked,
    optionValue, 
    optionLabel, 
    isEdit, 
    onChange, 
    onBlur, 
    disabledForm, 
    className,
    warning 
}) {
  return (
    <>
      {isEdit ? (
        component === "Select" ? (
          <Select
            classNameTooltip='!w-fit'
            id={id}
            name={name}
            value={value}
            readOnly={disabledForm}
            placeholder={placeholder}
            onChange={onChange}
            onBlur={onBlur}
            warning={warning?.[name]}
            options={options}
            optionValue={optionValue}
            optionLabel={optionLabel}
          />
        ) : component === "Textarea" ? (
          <Textarea
            classNameTooltip=''
            id={id}
            name={name}
            value={value}
            readOnly={disabledForm}
            placeholder={placeholder}
            onChange={onChange}
            onBlur={onBlur}
            warning={warning?.[name]}
            rows={3}
          />
        ) : component === "Checkbox" ? (
          <div className='flex flex-row items-center gap-2 justify-center'>
            <Checkbox
              classNameTooltip='!mb-0'
              className={`checkbox ${className} `}
              id={id}
              name={name}
              checked={checked}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              warning={warning?.[name]}
              readOnly={disabledForm}
            />
            {placeholder && <span className='!text-[16px] !mb-0'>{placeholder}</span>}
          </div>
        ) : (
          <Input
            classNameTooltip='!w-fit'
            type={type}
            id={id}
            name={name}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            onBlur={onBlur}
            warning={warning?.[name]}
            readOnly={disabledForm}
          />
        )
      ) : (
        <span className="!text-[16px] !mb-0"> 
          {component === "Select"
            ? options?.find((opt) => opt[optionValue] == value)?.[optionLabel] || "-"
            : value || component === "Checkbox" ? checked === 1 ? "✔ "+placeholder : value : "-"}
        </span>
      )}
    </>
  );
}