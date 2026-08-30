// /conponents/login/LoginForm.js
'use client'
import { LogIn } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Input from '@/components/common/Form/Input';
import Button from '@/components/common/Form/Button';
import { BaseSchema } from "@/lib/validators/form/login/schema";
import { loginUser } from "@/services/auth";
import useAuthStore from "@/stores/useAuthStore";
export default function LoginForm({  onSubmitFinish  }) {

    const setStoreLogin = useAuthStore((state) => state.setStoreLogin);

    const [showPassword, setShowPassword] = useState(false);
    const [logging, setLogging] = useState(false);
    const [msgError, setMsgError] = useState("");
    const [animatedLogging, setAnimatedLogging] = useState("")

    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [warnFields, setWarnFields] = useState({});
    const sanitizeTimeouts = useRef({});
    
    const togglePassword = () => {
        if(logging) return
        setShowPassword(prev => !prev);
    };

    useEffect(() => {
        if (logging) {
        let dotCount = 0;
        const interval = setInterval(() => {
            dotCount = (dotCount + 1) % 5; // 0,1,2,3,4 -> วนกลับ 0
            const dots = '.'.repeat(dotCount);
            setAnimatedLogging(`${dots}`);
        }, 500);

        return () => clearInterval(interval);
        } else {
        setAnimatedLogging('');
        }
    }, [logging]);


    const setWarnWithTimeout = (name, message) => {
        setWarnFields((prev) => ({ ...prev, [name]: message }));

        if (sanitizeTimeouts.current[name]) {
        clearTimeout(sanitizeTimeouts.current[name]);
        }

        if (message !== null) {
        sanitizeTimeouts.current[name] = setTimeout(() => {
            setWarnFields((prev) => ({ ...prev, [name]: null }));
            sanitizeTimeouts.current[name] = null;
        }, 1500);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = (focus = false) => {
        const result = BaseSchema.omit({ new_password: true }).safeParse(loginData);
 
        if (!result.success) {
            if (focus) {

                const errorIssue = result?.error?.errors[0];

                const fieldName = errorIssue?.path?.[0];
                setWarnWithTimeout(fieldName, errorIssue?.message);

                const el = document.querySelector(`[name="${fieldName}"]`);
                if (el) {
                    el.focus();
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        if (!validateForm(true)) return;

        setLogging(true);

        await new Promise((r) => setTimeout(r, 500));

        try {

            const result = await loginUser(loginData);

            setStoreLogin(result)

            onSubmitFinish?.({ status: true, message: "เข้าสู่ระบบสำเร็จ" });

        }  catch (err) {
         
          setMsgError(err.message || "เกิดข้อผิดพลาด");
          setLogging(false);
          onSubmitFinish?.({ status: false, message: err.message || "เกิดข้อผิดพลาด" });
          
        }
    };

  return (
    <>
         <div className='login-form'>
            <div className="login-header">
                <h2>เข้าสู่ระบบ</h2>
                <p>กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
            </div>

            <form onSubmit={handleSubmit}>

                <div className="form-group">
                    <label htmlFor="username">ชื่อผู้ใช้</label>
                    <Input type="text" 
                        id="username" 
                        name="username" 
                        value={loginData.username}
                        placeholder="กรอกชื่อผู้ใช้" 
                        readOnly={logging} 
                        required={true}   
                        onChange={handleChange}
                        onBlur={() => setWarnFields((prev) => ({ ...prev, username: null }))}
                        warning={warnFields?.username}
                    />
                   
                </div>

                <div className="form-group">
                    <label htmlFor="password">รหัสผ่าน</label>
                    <div className="password-input">
                        <Input type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password" 
                            value={loginData.password}
                            placeholder="กรอกรหัสผ่าน" 
                            autoComplete="current-password"
                            readOnly={logging} 
                            required={true}   
                            onChange={handleChange}
                            onBlur={() => setWarnFields((prev) => ({ ...prev, password: null }))}
                            warning={warnFields?.password}
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

                <div className="form-group">
                  <Button 
                    type="submit" 
                    className={`login-button ${logging ? "disabled": ""}`}
                    disabled={logging}
                  > 
                    {logging ? (
                      <>
                        กำลังเข้าสู่ระบบ {animatedLogging}
                      </>
                    ):(
                      <>
                        เข้าสู่ระบบ
                        <span className="expand-button" id="expandBtn" ><LogIn /></span>
                      </>
                    )}
                  </Button>
                </div>

                {msgError && 
                  <div className="form-group">
                    <div role="alert" className="alert alert-error alert-dash">
                      <span>{msgError}</span>
                    </div>
                  </div>
                }
             
            </form>
          </div>

    </>
  );
}