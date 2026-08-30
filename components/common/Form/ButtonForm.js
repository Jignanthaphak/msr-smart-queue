// /conponents/form/Button.js
'use client';
import Button from '@/components/common/Form/Button';
export default function ButtonForm({
    type = 'button',
    name,
    className = '',
    disabled = false,
    onClick,
    children
}) {
  return (
    <>
      <Button 
        type={type}
        name={name}
        className={`${className} action-btn outline search ${disabled ? "disabled":""}`}
        disabled={disabled}
        onClick={onClick}
      > 
        {children}
      </Button>
       
    </>
  );
}