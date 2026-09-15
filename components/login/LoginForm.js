// /conponents/login/LoginForm.js
'use client'
import { LogIn } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Input from '@/components/common/Form/Input';
import Button from '@/components/common/Form/Button';
import { BaseSchema } from "@/lib/validators/form/login/schema";
import { loginUser } from "@/services/auth";
import useAuthStore from "@/stores/useAuthStore";
import clientConfig from "@/config/Client";

function ThaidLogoIcon({ className = "thaid-icon-img" }) {
  return (
    <svg className={className} viewBox="0 0 95 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '26px', width: 'auto', verticalAlign: 'middle', display: 'inline-block' }}>
      <defs>
        <clipPath id="thaid-flag-dot">
          <circle cx="49" cy="8" r="4.5" />
        </clipPath>
      </defs>
      {/* Thai Flag Dot on i */}
      <g clipPath="url(#thaid-flag-dot)">
        <rect x="43" y="3.5" width="12" height="1.8" fill="#EF3340" />
        <rect x="43" y="5.3" width="12" height="1.4" fill="#FFFFFF" />
        <rect x="43" y="6.7" width="12" height="2.6" fill="#00247D" />
        <rect x="43" y="9.3" width="12" height="1.4" fill="#FFFFFF" />
        <rect x="43" y="10.7" width="12" height="1.8" fill="#EF3340" />
      </g>
      {/* Text thaID */}
      <text x="2" y="28" fontFamily="Arial, Helvetica, sans-serif" fontSize="26" fontWeight="800" fill="#FFFFFF" letterSpacing="-0.5">
        tha<tspan dx="1">ı</tspan><tspan dx="2">D</tspan>
      </text>
    </svg>
  );
}

export default function LoginForm({  onSubmitFinish  }) {

    const setStoreLogin = useAuthStore((state) => state.setStoreLogin);

    const [showPassword, setShowPassword] = useState(false);
    const [logging, setLogging] = useState(false);
    const [thaidLogging, setThaidLogging] = useState(false);
    const [msgError, setMsgError] = useState("");
    const [animatedLogging, setAnimatedLogging] = useState("")

    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [warnFields, setWarnFields] = useState({});
    const sanitizeTimeouts = useRef({});

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const err = params.get("error");
            if (err === "thaid_not_found") {
                setMsgError("ไม่พบบัญชีผู้ใช้ที่ผูกกับเลขประจำตัวประชาชน ThaID ในระบบ กรุณาติดต่อผู้ดูแลระบบ");
            } else if (err === "thaid_failed") {
                const detail = params.get("message");
                setMsgError(detail ? `เข้าสู่ระบบ ThaID ไม่สำเร็จ: ${detail}` : "การยืนยันตัวตนด้วย ThaID ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
            } else if (err === "thaid_invalid_state") {
                setMsgError("เซสชัน ThaID หมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
            }
        }
    }, []);
    
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

    const handleThaidLogin = () => {
        if (logging || thaidLogging) return;
        setThaidLogging(true);
        window.location.href = `${clientConfig.backend_url}/auth/thaid/login`;
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

                <div className="login-divider">
                  <span>หรือ</span>
                </div>

                <div className="form-group">
                  <button 
                    type="button" 
                    className="thaid-login-button"
                    onClick={handleThaidLogin}
                    disabled={logging || thaidLogging}
                  > 
                    {thaidLogging ? (
                      <span className="thaid-btn-text">กำลังเชื่อมต่อ ThaID...</span>
                    ) : (
                      <>
                        <ThaidLogoIcon className="thaid-icon-img" />
                        <span className="thaid-btn-text">เข้าสู่ระบบโดย thaID</span>
                      </>
                    )}
                  </button>
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
