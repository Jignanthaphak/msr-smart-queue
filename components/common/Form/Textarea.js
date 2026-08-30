// /conponents/form/Input.js
'use client';
export default function Textarea({
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
    rows = '',
    cols = '',
    warning = null,
}) {
  return (
    <>
       <div className={`${classNameTooltip} ${!readOnly ? "tooltip tooltip-close" : ""} w-full`} data-tip={warning}>
            <textarea
                name={name}
                id={id}
                value={value ?? ""}
                onChange={onChange ?? (() => {})}
                className={`w-full ${className} form-input ${readOnly ? "disabled":""} ${warning ? "input-error " : ""}`}
                readOnly={readOnly}
                disabled={readOnly}
                required={required}
                onBlur={onBlur}
                placeholder={placeholder}
                rows={rows}
                cols={cols}
            />
        </div>
    </>
  );
}