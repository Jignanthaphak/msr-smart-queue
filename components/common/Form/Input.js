// /conponents/form/Input.js
'use client';
export default function Input({
    type = 'text',
    name,
    id,
    value,
    className = '',
    classNameTooltip = '',
    readOnly = false,
    required = false,
    onChange,
    onBlur,
    placeholder = '',
    autoComplete = '',
    warning = null,
}) {
  return (
    <>
       <div className={`${classNameTooltip} ${!readOnly ? "tooltip tooltip-colse" : ""} w-full`} data-tip={warning}>
            <input
                type={type}
                name={name}
                id={id}
                value={value ?? ""}
                onChange={onChange ?? (() => {})}
                className={` w-full ${className} form-input ${readOnly ? "disabled":""} ${warning ? "input-error " : ""}`}
                readOnly={readOnly}
                disabled={readOnly}
                required={required}
                onBlur={onBlur}
                placeholder={placeholder}
                autoComplete ={autoComplete}
            />
        </div>
    </>
  );
}