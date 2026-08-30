// app/login/page.js
'use client';
import { useRouter } from "next/navigation";
import LoginForm from '@/components/login/LoginForm';

export default function Login() {

  const router = useRouter();
  const handleSubmitFinish = ({ status, message }) => {
    if (status) {
       router.push("/");
    }
  };

  return (
    <>

    <div className="login-section ">
      <div className="login-container expanded">
          <div className="login-left">
            
              <button className="collapse-button" id="collapseBtn" ></button>
              <div className="logo-section">
                  <div className="logo-icon">
                      <div className="heart-pulse"></div>
                  </div>
                  <div className="logo-text">
                      <h1>MENTAL HEALTH</h1>
                      <p>ระบบบันทึกการคัดกรองสุขภาพจิต<br/>เพื่อการดูแลที่ดีกว่า</p>
                  </div>
              </div>
              
              <div className="features">
                  <div className="feature-item">ระบบปลอดภัยและเชื่อถือได้</div>
                  <div className="feature-item">ข้อมูลเข้ารหัสและคุ้มครองความเป็นส่วนตัว</div>
                  <div className="feature-item">เข้าถึงได้ตลอด 24 ชั่วโมง</div>
                  <div className="feature-item">สนับสนุนการดำเนินงานด้านส่งเสริมป้องกันปัญหาสุขภาพจิต</div>
              </div>
          </div>

          <div className="login-right">
      
            <LoginForm onSubmitFinish={handleSubmitFinish}/>

          </div>
      </div>
    </div>
      
    
    </>
  );
}
