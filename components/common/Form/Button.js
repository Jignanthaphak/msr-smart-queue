// /conponents/form/Button.js
'use client';
export default function Button({
    type = 'button',
    name,
    className = '',
    disabled = false,
    onClick,
    children
}) {
  return (
    <>
      <button type={type}
        name={name}
        className={`${className} ${disabled ? "disabled":""}`}
        disabled={disabled}
        onClick={onClick}
      > 
        {children}
      </button>
       
    </>
  );
}