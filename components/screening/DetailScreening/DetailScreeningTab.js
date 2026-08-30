// /components/screening/DetailScreening/DetailScreeningTab.js "success Refactor Code"
'use client';
import { useState } from 'react';
import DetailPersonManage from '@/components/screening/DetailScreening/DetailPersonManage';

import DetailBioManage from '@/components/screening/DetailScreening/DetailBioManage';

import DetailConsultManage from '@/components/screening/DetailScreening/DetailConsultManage';


const tabs = [
    { id: 1, label: "ข้อมูลผู้ป่วย" },
    { id: 2, label: "Biofeedback" },
    { id: 3, label: "Consult" },
];

export default function DetailScreeningTab({data, isEdit = false, onEdit}) {
 
  const [activeId, setActiveId] = useState(1);

  return (
    <>
      <div className="flex flex-col  justify-center h-full w-full">
        <div className="step-content pb-[0.5rem] px-[0.5rem] mb-2 rounded-lg " >
        
            {tabs.map((tab, index) => (

              <div
                className={`cursor-pointer w-1/3 flex items-center justify-center  py-2  rounded-lg ${tab.id === activeId ? "bg-green-300" : ""}`}
                onClick={() => setActiveId(tab.id)}
                key={index}
              >
              
                <div className="step-label ">
                  <h3 className={`${tab.id === activeId ? "!text-white" : "!text-black"}`}>{tab.label}</h3>
                </div>
              
              </div>
            
            ))}
        
            
        </div>
        
        <div className="step-content flex-1">
            
          <DetailPersonManage open={activeId === 1} data={data} isEdit={isEdit} onEdit={onEdit}/>

          <DetailBioManage open={activeId === 2} data={data} isEdit={isEdit} onEdit={onEdit}/>

          <DetailConsultManage open={activeId === 3} data={data} isEdit={isEdit} onEdit={onEdit}/>

        </div>
      </div>
     
    </>
  );
}
