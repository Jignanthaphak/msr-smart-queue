// app/page.js
import MainLayout from '@/components/layout/MainLayout';
import ScreeningPanel from '@/components/screening/ScreeningPanel';
import MonitorPanel from '@/components/monitor/MonitorPanel';
export default function Home() {
  return (
    <>
      <MainLayout >
        <div className='content-grid'>

          <div className='left-panel'>
            
            <ScreeningPanel/>

          </div>

          <div className='right-panel'>
            <MonitorPanel/>
          </div>

        </div>
      </MainLayout>    
    
    </>
  );
}
