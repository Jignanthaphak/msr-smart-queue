// /components/screening/Tab/TabMenu.js
'use client';
import clientConfig from "@/config/Client";

export default function TabMenu({ tab, isActive, onClick, showConnector }) {
    
  return (
    <div className="flex items-center">
      <div
        className={`step-item ${isActive ? "current" : ""}`}
        onClick={() => onClick(tab.id)}
      >
        <div className="step-circle">
          <img className="" src={`${clientConfig.base_path}${tab.img}`} alt="" />
        </div>
        {tab.label && (
          <div className="step-label">
            <h3>{tab.label}</h3>
          </div>
        )}
      </div>

      {showConnector && <div className="step-connector"></div>}
    </div>
  );
}
