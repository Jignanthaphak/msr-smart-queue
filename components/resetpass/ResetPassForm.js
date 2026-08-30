// /components/login/components/login/ResetPassForm.js
'use client'
import { useRouter } from "next/navigation";
import { Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Input from '@/components/common/Form/Input';
import Button from '@/components/common/Form/Button';
import { BaseSchema } from "@/lib/validators/form/login/schema";
import { resetPassUser } from "@/services/auth";
import {logoutUser} from '@/services/auth';
import useAuthStore from "@/stores/useAuthStore";

export default function ResetPassForm({ onSubmitFinish }) {

  const router = useRouter();

  const setStoreLogout = useAuthStore((state) => state.setStoreLogout);

  const [showPassword, setShowPassword] = useState(false);
  const [logging, setLogging] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [animatedLogging, setAnimatedLogging] = useState("");

  const [formData, setFormData] = useState({
    password: "",
    new_password: "",
    confirm_password: ""
  });

  const [warnFields, setWarnFields] = useState({});
  const sanitizeTimeouts = useRef({});

  const togglePassword = () => {
    if (logging) return;
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    if (logging) {
      let dotCount = 0;
      const interval = setInterval(() => {
        dotCount = (dotCount + 1) % 5;
        setAnimatedLogging('.'.repeat(dotCount));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setAnimatedLogging('');
    }
  }, [logging]);

  const setWarnWithTimeout = (name, message) => {
    setWarnFields((prev) => ({ ...prev, [name]: message }));
    if (sanitizeTimeouts.current[name]) clearTimeout(sanitizeTimeouts.current[name]);
    if (message !== null) {
      sanitizeTimeouts.current[name] = setTimeout(() => {
        setWarnFields((prev) => ({ ...prev, [name]: null }));
        sanitizeTimeouts.current[name] = null;
      }, 2000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (focus = false) => {
    const { password, new_password, confirm_password } = formData;

    if (!password.trim()) {
      setWarnWithTimeout("password", "กรุณากรอกรหัสผ่านเดิม");
      if (focus) document.querySelector(`[name="password"]`)?.focus();
      return false;
    }

    if (!new_password.trim()) {
      setWarnWithTimeout("new_password", "กรุณากรอกรหัสผ่านใหม่");
      if (focus) document.querySelector(`[name="new_password"]`)?.focus();
      return false;
    }

    if (new_password.length < 6) {
      setWarnWithTimeout("new_password", "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      if (focus) document.querySelector(`[name="new_password"]`)?.focus();
      return false;
    }

    if (new_password === password) {
      setWarnWithTimeout("new_password", "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");
      if (focus) document.querySelector(`[name="new_password"]`)?.focus();
      return false;
    }

    if (confirm_password !== new_password) {
      setWarnWithTimeout("confirm_password", "ยืนยันรหัสผ่านไม่ตรงกัน");
      if (focus) document.querySelector(`[name="confirm_password"]`)?.focus();
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setLogging(true);
    setMsgError("");

    await new Promise((r) => setTimeout(r, 500));

    try {
      const result = await resetPassUser(formData);
      await logoutUser();
      await setStoreLogout()
      router.push("/login");
    } catch (err) {
      setMsgError(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      setLogging(false);
    }
  };

  return (
    <div className='login-form'>
      <div className="login-header">
        <h2>เปลี่ยนรหัสผ่าน</h2>
        <p>กรุณากรอกรหัสผ่านเดิมและตั้งรหัสผ่านใหม่</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* รหัสผ่านเดิม */}
        <div className="form-group">
          <label htmlFor="password">รหัสผ่านเดิม</label>
          <div className="password-input">
            <Input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              placeholder="กรอกรหัสผ่านเดิม"
              readOnly={logging}
              required
              onChange={handleChange}
              onBlur={() => setWarnFields((prev) => ({ ...prev, password: null }))}
              warning={warnFields?.password}
            />
          </div>
        </div>

        {/* รหัสผ่านใหม่ */}
        <div className="form-group">
          <label htmlFor="new_password">รหัสผ่านใหม่</label>
          <div className="password-input">
            <Input
              type={showPassword ? 'text' : 'password'}
              id="new_password"
              name="new_password"
              value={formData.new_password}
              placeholder="กรอกรหัสผ่านใหม่"
              readOnly={logging}
              required
              onChange={handleChange}
              onBlur={() => setWarnFields((prev) => ({ ...prev, new_password: null }))}
              warning={warnFields?.new_password}
            />
            <Button
              type="button"
              className="password-toggle"
              onClick={togglePassword}
            >
              {showPassword ? '🙈' : '👁️'}
            </Button>
          </div>
        </div>

        {/* ยืนยันรหัสผ่านใหม่ */}
        <div className="form-group">
          <label htmlFor="confirm_password">ยืนยันรหัสผ่านใหม่</label>
          <Input
            type={showPassword ? 'text' : 'password'}
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            placeholder="ยืนยันรหัสผ่านใหม่"
            readOnly={logging}
            required
            onChange={handleChange}
            onBlur={() => setWarnFields((prev) => ({ ...prev, confirm_password: null }))}
            warning={warnFields?.confirm_password}
          />
        </div>

        <div className="form-group">
          <Button
            type="submit"
            className={`login-button ${logging ? "disabled" : ""}`}
            disabled={logging}
          >
            {logging ? (
              <>กำลังบันทึก {animatedLogging}</>
            ) : (
              <>
                เปลี่ยนรหัสผ่าน
                <span className="expand-button" id="expandBtn"><Lock /></span>
              </>
            )}
          </Button>
        </div>

        {msgError && (
          <div className="form-group">
            <div role="alert" className="alert alert-error alert-dash">
              <span>{msgError}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
