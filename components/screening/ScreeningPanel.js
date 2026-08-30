// /components/screening/ScreeningPanel.js "success Refactor Code"
'use client';

import { useState } from 'react';
import TabMenu from '@/components/screening/Tab/TabMenu';
import TabBody from '@/components/screening/Tab/TabBody';
const tabs = [
    { id: 1, img: "/images/LOGO_MSR.png", label: "รายชื่อผู้รับบริการ" },
    { id: 2, img: "/images/register.png", label: "ข้อมูลผู้รับบริการ" },
    { id: 3, img: "/images/biofeedback.png", label: "Biofeedback" },
    { id: 4, img: "/images/consult.png", label: "Consult" },
];

export default function ScreeningPanel() {

  const [activeId, setActiveId] = useState(1);

  return (
    <>
    
      <div className="card ">
          <div className="card-header">
              <h3 className="card-title" id="leftPanelTitle">
                  <i className="show-in-modern" data-lucide="layers"></i>
                  <label className="hide-in-modern">
                      🩺
                  </label>
                  ขั้นตอนการตรวจ
              </h3>
          </div>
          <div className="card-content" >
                  
              <div className="steps-nav" >

                {tabs.map((tab, index) => (
                  <TabMenu
                    key={tab.id}
                    tab={tab}
                    isActive={activeId === tab.id}
                    onClick={setActiveId}
                    showConnector={index < tabs.length - 1}
                  />
                ))}
                  
              </div>
              
              <div className="step-content">

                <TabBody activeId={activeId} />

              </div>
          
          </div>
      </div>
    
    </>
  );
}
