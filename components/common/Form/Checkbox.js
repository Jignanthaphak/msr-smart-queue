// /conponents/form/Input.js
'use client';
export default function Checkbox({
    type = 'checkbox',
    name,
    id,
    checked,
    value,
    className = '',
    classNameTooltip = '',
    readOnly = false,
    required = false,
    onChange,
    onBlur,
    placeholder = '',
    warning = null,
}) {
  return (
    <>
       <span className={`${classNameTooltip} ${!readOnly ? "tooltip tooltip-colse" : ""}`} data-tip={warning}>
          <input
            type={type}
            name={name}
            id={id}
            checked={checked ?? false}
            value={value ?? ''}
            className={`${className} form-checkbox ${readOnly ? "disabled":""} ${warning ? "input-error " : ""}`}
            disabled={readOnly}
            required={required}
            onChange={onChange ?? (() => {})}
            onBlur={onBlur}
            placeholder={placeholder}
          />
        </span>
    </>
  );
}