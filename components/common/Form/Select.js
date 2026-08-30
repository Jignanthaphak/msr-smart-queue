// /conponents/form/Input.js
'use client';
export default function Select({
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
    warning = null,
    options = [],      
    optionValue = '', 
    optionLabel = '', 
}) {

  return (
    <>
       <div className={`${classNameTooltip} tooltip tooltip-close w-full`} data-tip={warning}>
            <select
                name={name}
                id={id}
                value={value ?? ""}
                onChange={onChange ?? (() => {})}
                className={` ${className} form-input ${readOnly ? "disabled":""} ${warning ? "input-error " : ""}`}
                disabled={readOnly}
                required={required}
                onBlur={onBlur}
            >
              <option value="">{placeholder}</option>
              {options?.map((item) => (
                  <option key={item[optionValue]} value={item[optionValue]}>        
                      {item[optionLabel]}
                  </option>   
              ))}
            </select>
        </div>
    </>
  );
}